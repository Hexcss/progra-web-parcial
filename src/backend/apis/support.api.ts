// frontend/src/backend/apis/support.api.ts
import { io, type Socket } from "socket.io-client";
import { env } from "../../config/env";
import { normalizeMessage } from "../../utils/functions/mormalize-message.function";
import { showSnackbar } from "../../signals/snackbar.signal";
import { triggerSessionExpired } from "../../signals/session.signal";
import { AuthAPI } from "./auth.api";
import { unwrapApiCall } from "../../utils/functions/unwrap-api-call.function";

type Role = "user" | "admin";
type ChatRoomStatus = "waiting" | "assigned" | "closed";

export type ChatRoom = {
  _id: string;
  customerId: string;
  adminId?: string | null;
  status: ChatRoomStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
};

export type ChatMessage = {
  _id: string;
  roomId: string;
  senderId: string;
  senderRole: Role;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type Ok<T = unknown> = { ok: true } & T;
type Err = { ok?: false; error?: string };

const NS = "/support";

function resolveWsBase(): string {
  const raw = (env.SUPPORT_WS_URL || env.API_URL || (typeof window !== "undefined" ? window.location.origin : "")) as string;
  try {
    const u = new URL(raw, typeof window !== "undefined" ? window.location.origin : undefined);
    return u.origin;
  } catch {
    const m = raw.match(/^https?:\/\/[^/]+/i);
    return m ? m[0] : raw;
  }
}

function resolveWsPath(): string {
  const p = (env.SUPPORT_WS_PATH as string) || "/socket.io";
  return p.startsWith("/") ? p : `/${p}`;
}

const url = `${resolveWsBase()}${NS}`;
const path = resolveWsPath();

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

class SupportSocketClient {
  private socket: Socket | null = null;
  private connecting = false;
  private triedReauth = false;
  private debug = false;

  get isConnected() {
    return !!this.socket && this.socket.connected;
  }

  private async fetchTicketSafely(): Promise<string | undefined> {
    try {
      return unwrapApiCall(await AuthAPI.fetchWsTicket());
    } catch {
      return undefined;
    }
  }

  async connect(): Promise<void> {
    if (this.socket || this.connecting) return;
    this.connecting = true;

    const ticket = await this.fetchTicketSafely();

    const s = io(url, {
      path,
      withCredentials: true as any,
      auth: ticket ? { token: ticket } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["polling", "websocket"],
      upgrade: true,
      forceNew: true,
    });

    s.on("connect", () => {
      this.connecting = false;
      this.triedReauth = false;
      if (this.debug) console.debug("[WS] connected", s.id);
    });

    s.on("connect_error", async (err: any) => {
      this.connecting = false;
      const msg = normalizeMessage(err?.message ?? "No se pudo conectar");
      if (!this.triedReauth && /Unauthorized|Missing token|Invalid token|token/i.test(msg)) {
        this.triedReauth = true;
        try {
          const newTicket = await this.fetchTicketSafely();
          if (newTicket) {
            s.auth = { token: newTicket } as any;
            s.connect();
            return;
          }
        } catch {}
        try { s.disconnect(); } catch {}
        this.socket = null;
        triggerSessionExpired();
        return;
      }
      showSnackbar(`Chat: ${msg}`, "warning");
    });

    s.on("exception", (err: any) => {
      const msg = normalizeMessage(err?.message ?? err ?? "Error en el chat");
      showSnackbar(`Chat: ${msg}`, "warning");
      if (this.debug) console.debug("[WS exception]", err);
    });

    s.on("error", (err: any) => {
      const msg = normalizeMessage(err?.message ?? "Error en el chat");
      showSnackbar(`Chat: ${msg}`, "warning");
      if (this.debug) console.debug("[WS error]", err);
    });

    s.on("disconnect", (reason: string) => {
      this.connecting = false;
      if (this.debug) console.debug("[WS] disconnected", reason);
    });

    this.socket = s;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
      this.triedReauth = false;
    }
  }

  private async ensureConnected(): Promise<Socket> {
    if (!this.socket) {
      await this.connect();
      let tries = 0;
      while (!this.socket && tries < 200) {
        await delay(25);
        tries++;
      }
      if (!this.socket) throw new Error("not_connected");
    }

    if (this.socket.connected) return this.socket;

    await new Promise<void>((resolve, reject) => {
      let done = false;
      const finish = (fn: (e?: any) => void) => (e?: any) => {
        if (done) return;
        done = true;
        cleanup();
        fn(e);
      };
      const onConnect = finish(() => resolve());
      const onError = finish((e) => reject(e || new Error("connect_error")));
      const onTimeout = setTimeout(
        finish(() => reject(new Error("timeout"))),
        20000
      );
      const cleanup = () => {
        clearTimeout(onTimeout as any);
        this.socket?.off("connect", onConnect);
        this.socket?.off("connect_error", onError);
      };
      this.socket!.once("connect", onConnect);
      this.socket!.once("connect_error", onError);
      this.socket!.connect();
    });

    return this.socket!;
  }

  private async emitAck<T = any>(event: string, payload: any, timeoutMs = 15000): Promise<T> {
    const s = await this.ensureConnected();
    if (this.debug) console.debug("[WS ->]", NS, event, payload);
    return new Promise<T>((resolve, reject) => {
      try {
        (s.timeout as any)(timeoutMs).emit(event, payload, (...args: any[]) => {
          if (this.debug) console.debug("[WS <-]", NS, event, args);
          if (args.length === 0) return resolve(undefined as unknown as T);
          if (args.length === 1) {
            const only = args[0];
            if (only && typeof only === "object" && (only as Err).ok === false) {
              const msg = normalizeMessage((only as Err).error ?? "unknown");
              return reject(new Error(msg));
            }
            if (only === "timeout" || (only && (only as any).message === "timeout")) {
              return reject(new Error("timeout"));
            }
            return resolve(only as T);
          }
          const [err, res] = args;
          if (err) {
            const msg = normalizeMessage(err?.message ?? err ?? "unknown");
            return reject(new Error(msg));
          }
          if (res && typeof res === "object" && (res as Err).ok === false) {
            const msg = normalizeMessage((res as Err).error ?? "unknown");
            return reject(new Error(msg));
          }
          resolve(res as T);
        });
      } catch (e: any) {
        reject(e);
      }
    });
  }

  onConnect(cb: () => void) {
    if (!this.socket) return () => {};
    const s = this.socket;
    s.on("connect", cb);
    s.on("reconnect", cb);
    return () => {
      s.off("connect", cb);
      s.off("reconnect", cb);
    };
  }

  onDisconnect(cb: (reason: string) => void) {
    if (!this.socket) return () => {};
    const s = this.socket;
    s.on("disconnect", cb);
    return () => s.off("disconnect", cb);
  }

  onRoom(cb: (payload: { type: "created" | "assigned" | "closed"; room: ChatRoom }) => void) {
    if (!this.socket) return () => {};
    const s = this.socket;
    s.on("support:room", cb);
    return () => s.off("support:room", cb);
  }

  onMessage(cb: (payload: { type: "message"; message: ChatMessage }) => void) {
    if (!this.socket) return () => {};
    const s = this.socket;
    s.on("support:message", cb);
    return () => s.off("support:message", cb);
  }

  async subscribeMine() {
    await this.emitAck<Ok>("support:subscribeMine", {});
  }

  async subscribe(roomId: string) {
    await this.emitAck<Ok>("support:subscribe", { roomId });
  }

  async unsubscribe(roomId: string) {
    await this.emitAck<Ok>("support:unsubscribe", { roomId });
  }

  async create(initialMessage?: string) {
    const payload = initialMessage !== undefined ? { initialMessage } : {};
    const res = await this.emitAck<Ok<{ room: ChatRoom }>>("support:create", payload);
    return res.room;
  }

  async pickup(roomId: string) {
    const res = await this.emitAck<Ok<{ room: ChatRoom }>>("support:pickup", { roomId });
    return res.room;
  }

  async send(roomId: string, body: string) {
    const res = await this.emitAck<Ok<{ message: ChatMessage }>>("support:send", { roomId, body });
    return res.message;
  }

  async close(roomId: string) {
    const res = await this.emitAck<Ok<{ room: ChatRoom }>>("support:close", { roomId });
    return res.room;
  }

  async list(params: { status?: ChatRoomStatus; page?: number; limit?: number } = {}) {
    const res = await this.emitAck<Ok<{ items: ChatRoom[]; total: number; page: number; limit: number }>>(
      "support:list",
      params
    );
    return res;
  }

  async listMine(params: { page?: number; limit?: number } = {}) {
    const res = await this.emitAck<Ok<{ items: ChatRoom[]; total: number; page: number; limit: number }>>(
      "support:listMine",
      params
    );
    return res;
  }

  async history(roomId: string, page = 1, limit = 50) {
    const res = await this.emitAck<Ok<{ items: ChatMessage[]; total: number; page: number; limit: number }>>(
      "support:history",
      { roomId, page, limit }
    );
    return res;
  }
}

export const SupportAPI = new SupportSocketClient();

// src/backend/apis/support.api.ts
import { io, type Socket } from "socket.io-client";
import { env } from "../../config/env";
import { normalizeMessage } from "../../utils/functions/mormalize-message.function";
import { showSnackbar } from "../../signals/snackbar.signal";
import { triggerSessionExpired } from "../../signals/session.signal";

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
const base = (env.SUPPORT_WS_URL || env.API_URL || "").replace(/\/+$/g, "");
const url = `${base}${NS}`;

class SupportSocketClient {
  private socket: Socket | null = null;
  private connecting = false;

  get isConnected() {
    return !!this.socket && this.socket.connected;
  }

  connect(token?: string) {
    if (this.socket || this.connecting) return;
    this.connecting = true;
    const s = io(url, {
      transports: ["websocket", "polling"],
      withCredentials: true as any,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    s.on("connect", () => {
      this.connecting = false;
    });
    s.on("connect_error", (err: any) => {
      const msg = normalizeMessage(err?.message ?? "No se pudo conectar");
      if (/Unauthorized|Missing token|Invalid token|token/i.test(msg)) {
        triggerSessionExpired();
      } else {
        showSnackbar(`Chat: ${msg}`, "warning");
      }
    });
    s.on("error", (err: any) => {
      const msg = normalizeMessage(err?.message ?? "Error en el chat");
      showSnackbar(`Chat: ${msg}`, "warning");
    });
    s.on("disconnect", () => {});
    this.socket = s;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
    }
  }

  private ensure() {
    if (!this.socket) throw new Error("not_connected");
    return this.socket;
  }

  private emitAck<T = any>(event: string, payload: any, timeoutMs = 10000): Promise<T> {
    const s = this.ensure();
    return new Promise<T>((resolve, reject) => {
      try {
        (s.timeout as any)(timeoutMs).emit(event, payload, (err: any, res: any) => {
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

  onRoom(cb: (payload: { type: "created" | "assigned" | "closed"; room: ChatRoom }) => void) {
    const s = this.ensure();
    s.on("support:room", cb);
    return () => s.off("support:room", cb);
  }

  onMessage(cb: (payload: { type: "message"; message: ChatMessage }) => void) {
    const s = this.ensure();
    s.on("support:message", cb);
    return () => s.off("support:message", cb);
  }

  async create(initialMessage?: string) {
    const res = await this.emitAck<Ok<{ room: ChatRoom }>>("support:create", { initialMessage });
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

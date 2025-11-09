import { useEffect, useRef, useState, useCallback } from "react";
import PortalLayout from "../../../../../layouts/Wrappers/PortalLayout";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import ForumIcon from "@mui/icons-material/Forum";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { ChatMessage, ChatRoom } from "../../../../../backend/apis/support.api";
import { SupportAPI } from "../../../../../backend/apis/support.api";

function short(id: string) {
  return id?.slice?.(-6)?.toUpperCase?.() ?? id;
}

const STATUS_LABELS: Record<string, string> = {
  waiting: "En espera",
  assigned: "Asignado",
  closed: "Cerrado",
};

function statusColor(status?: string): "default" | "primary" | "success" | "warning" | "error" {
  const s = (status ?? "").toLowerCase();
  if (s === "waiting") return "warning";
  if (s === "assigned") return "primary";
  if (s === "closed") return "default";
  return "default";
}

function sortRooms(a: ChatRoom, b: ChatRoom) {
  const ak = a.lastMessageAt || a.updatedAt || a.createdAt;
  const bk = b.lastMessageAt || b.updatedAt || b.createdAt;
  return bk.localeCompare(ak);
}

const appendUnique = (prev: ChatMessage[], msg: ChatMessage) =>
  prev.some((m) => m._id === msg._id) ? prev : [...prev, msg];

export default function SupportAdminChatPage() {
  const theme = useTheme();
  const [connecting, setConnecting] = useState(false);
  const [waiting, setWaiting] = useState<ChatRoom[]>([]);
  const [mine, setMine] = useState<ChatRoom[]>([]);
  const [selected, setSelected] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selected?._id ?? null;
  }, [selected?._id]);

  const ensureConnection = useCallback(async () => {
    if (SupportAPI.isConnected) return;
    if (connecting) return;
    setConnecting(true);
    try {
      await new Promise<void>((resolve) => {
        SupportAPI.connect();
        const check = () => {
          if (SupportAPI.isConnected) resolve();
          else setTimeout(check, 150);
        };
        check();
      });
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      await ensureConnection();
      const [w, m] = await Promise.all([
        SupportAPI.list({ status: "waiting", page: 1, limit: 200 }),
        SupportAPI.listMine({ page: 1, limit: 500 }),
      ]);
      setWaiting((w.items || []).slice().sort(sortRooms));
      setMine((m.items || []).slice().sort(sortRooms));
    } finally {
      setLoadingLists(false);
    }
  }, [ensureConnection]);

  const subscribeCollections = useCallback(async () => {
    try {
      await SupportAPI.subscribeMine();
    } catch {}
  }, []);

  const loadHistory = useCallback(
    async (room: ChatRoom | null) => {
      setMessages([]);
      if (!room) return;
      setLoadingHistory(true);
      try {
        await ensureConnection();
        await SupportAPI.subscribe(room._id);
        const res = await SupportAPI.history(room._id, 1, 200);
        setMessages((res.items || []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "instant" as any });
        }, 0);
      } finally {
        setLoadingHistory(false);
      }
    },
    [ensureConnection]
  );

  const handlePickup = useCallback(
    async (room: ChatRoom) => {
      await ensureConnection();
      const updated = await SupportAPI.pickup(room._id);
      setMine((prev) => {
        const exists = prev.some((r) => r._id === updated._id);
        const next = exists ? prev.map((r) => (r._id === updated._id ? updated : r)) : [updated, ...prev];
        return next.slice().sort(sortRooms);
      });
      setWaiting((prev) => prev.filter((r) => r._id !== updated._id));
      setSelected(updated);
      await loadHistory(updated);
    },
    [ensureConnection, loadHistory]
  );

  const handleClose = useCallback(async () => {
    if (!selected) return;
    await ensureConnection();
    const updated = await SupportAPI.close(selected._id);
    setMine((prev) => prev.map((r) => (r._id === updated._id ? updated : r)).slice().sort(sortRooms));
    setWaiting((prev) => prev.filter((r) => r._id !== updated._id));
    setSelected(updated);
  }, [ensureConnection, selected]);

  const handleSend = useCallback(async () => {
    if (!selected) return;
    const body = input.trim();
    if (!body) return;
    setInput("");
    await ensureConnection();
    const msg = await SupportAPI.send(selected._id, body);
    setMessages((prev) => appendUnique(prev, msg));
    setMine((prev) =>
      prev
        .map((r) => (r._id === selected._id ? { ...r, lastMessageAt: msg.createdAt, updatedAt: msg.createdAt } : r))
        .slice()
        .sort(sortRooms)
    );
    setSelected((curr) => (curr && curr._id === selected._id ? { ...curr, lastMessageAt: msg.createdAt, updatedAt: msg.createdAt } : curr));
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [ensureConnection, input, selected]);

  useEffect(() => {
    let offRoom: (() => void) | null = null;
    let offMsg: (() => void) | null = null;
    let offConn: (() => void) | null = null;
    let mounted = true;

    (async () => {
      await ensureConnection();
      if (!mounted) return;
      await subscribeCollections();
      await loadLists();

      offRoom = SupportAPI.onRoom(({ type, room }) => {
        if (type === "created") {
          setWaiting((prev) => {
            if (prev.find((r) => r._id === room._id)) return prev.slice().sort(sortRooms);
            return [room, ...prev].slice().sort(sortRooms);
          });
        }
        if (type === "assigned") {
          setWaiting((prev) => prev.filter((r) => r._id !== room._id));
          setMine((prev) => {
            const exists = prev.some((r) => r._id === room._id);
            const next = exists ? prev.map((r) => (r._id === room._id ? room : r)) : [room, ...prev];
            return next.slice().sort(sortRooms);
          });
          setSelected((curr) => (curr && curr._id === room._id ? room : curr));
        }
        if (type === "closed") {
          setWaiting((prev) => prev.filter((r) => r._id !== room._id));
          setMine((prev) => prev.map((r) => (r._id === room._id ? room : r)).slice().sort(sortRooms));
          setSelected((curr) => (curr && curr._id === room._id ? room : curr));
        }
      });

      offMsg = SupportAPI.onMessage(({ message }) => {
        if (selectedIdRef.current && message.roomId === selectedIdRef.current) {
          setMessages((prev) => appendUnique(prev, message));
          setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
          }, 0);
        }
        setWaiting((prev) =>
          prev
            .map((r) => (r._id === message.roomId ? { ...r, lastMessageAt: message.createdAt, updatedAt: message.createdAt } : r))
            .slice()
            .sort(sortRooms)
        );
        setMine((prev) =>
          prev
            .map((r) => (r._id === message.roomId ? { ...r, lastMessageAt: message.createdAt, updatedAt: message.createdAt } : r))
            .slice()
            .sort(sortRooms)
        );
        setSelected((curr) =>
          curr && curr._id === message.roomId ? { ...curr, lastMessageAt: message.createdAt, updatedAt: message.createdAt } : curr
        );
      });

      offConn = SupportAPI.onConnect(async () => {
        try {
          await subscribeCollections();
          const [w, m] = await Promise.all([
            SupportAPI.list({ status: "waiting", page: 1, limit: 200 }),
            SupportAPI.listMine({ page: 1, limit: 500 }),
          ]);
          setWaiting((w.items || []).slice().sort(sortRooms));
          setMine((m.items || []).slice().sort(sortRooms));
          const sel = selectedIdRef.current;
          if (sel) {
            await SupportAPI.subscribe(sel);
            const hist = await SupportAPI.history(sel, 1, 200);
            setMessages((hist.items || []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
          }
        } catch {}
      });
    })();

    return () => {
      mounted = false;
      offRoom?.();
      offMsg?.();
      offConn?.();
    };
  }, [ensureConnection, loadLists, subscribeCollections]);

  useEffect(() => {
    void loadHistory(selected);
  }, [selected?._id, loadHistory]);

  const RoomItem = (r: ChatRoom, action?: React.ReactNode) => (
    <Box key={r._id}>
      <ListItem
        disableGutters
        onClick={() => setSelected(r)}
        secondaryAction={action}
        sx={{
          px: 1,
          borderRadius: 1.25,
          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
          backgroundColor: selected?._id === r._id ? alpha(theme.palette.primary.main, 0.08) : "transparent",
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.15) }}>
            <PersonIcon fontSize="small" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={700}>#{short(r._id)}</Typography>
              <Chip size="small" label={STATUS_LABELS[r.status] ?? r.status} color={statusColor(r.status)} variant="outlined" />
            </Stack>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {r.lastMessageAt ? `Último: ${new Date(r.lastMessageAt).toLocaleString()}` : `Creado: ${new Date(r.createdAt).toLocaleString()}`}
            </Typography>
          }
        />
      </ListItem>
      <Divider sx={{ my: 0.5 }} />
    </Box>
  );

  return (
    <PortalLayout contentZoomable allowScrolling>
      <Stack direction="row" spacing={2} sx={{ height: "calc(100vh - 160px)" }}>
        <Paper
          elevation={0}
          sx={{
            width: 320,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.18),
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            minHeight: 0,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <ForumIcon />
              <Typography variant="h6" fontWeight={800}>Soporte</Typography>
            </Stack>
            <Tooltip title="Refrescar">
              <IconButton size="small" onClick={loadLists}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, overflow: "hidden" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.75, bgcolor: alpha(theme.palette.warning.main, 0.06) }}>
                <Typography variant="subtitle2" fontWeight={800}>En espera</Typography>
                <Chip size="small" label={waiting.length} color="warning" variant="outlined" />
              </Stack>
              <Divider />
              <List dense disablePadding sx={{ maxHeight: 220, overflowY: "auto" }}>
                {loadingLists
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Box key={`sk-w-${i}`} sx={{ px: 1, py: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="circular" width={36} height={36} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="60%" />
                            <Skeleton width="40%" />
                          </Box>
                          <Skeleton variant="rounded" width={28} height={28} />
                        </Stack>
                      </Box>
                    ))
                  : waiting.map((r) =>
                      RoomItem(
                        r,
                        <Tooltip title="Atender">
                          <IconButton size="small" onClick={(e) => (e.stopPropagation(), handlePickup(r))}>
                            <CallReceivedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    )}
              </List>
            </Box>

            <Box sx={{ borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, overflow: "hidden", flex: 1, minHeight: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.75, bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                <Typography variant="subtitle2" fontWeight={800}>Mis chats</Typography>
                <Chip size="small" label={mine.length} color="primary" variant="outlined" />
              </Stack>
              <Divider />
              <List dense disablePadding sx={{ height: "100%", overflowY: "auto" }}>
                {loadingLists
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Box key={`sk-m-${i}`} sx={{ px: 1, py: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="circular" width={36} height={36} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="60%" />
                            <Skeleton width="40%" />
                          </Box>
                        </Stack>
                      </Box>
                    ))
                  : mine.map((r) => RoomItem(r))}
              </List>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 0,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.18),
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15) }}>
                {selected ? <ForumIcon /> : <PersonIcon />}
              </Avatar>
              <Stack spacing={0}>
                <Typography variant="subtitle1" fontWeight={800}>
                  {selected ? `Sala #${short(selected._id)}` : "Selecciona un chat"}
                </Typography>
                {selected && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={STATUS_LABELS[selected.status] ?? selected.status}
                      color={statusColor(selected.status)}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {selected.lastMessageAt
                        ? `Último: ${new Date(selected.lastMessageAt).toLocaleString()}`
                        : `Actualizado: ${new Date(selected.updatedAt).toLocaleString()}`}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {selected && selected.status !== "closed" && (
                <Tooltip title="Cerrar chat">
                  <Button onClick={handleClose} variant="outlined" startIcon={<CloseIcon />} sx={{ textTransform: "none" }}>
                    Cerrar
                  </Button>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          <Divider />

          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              py: 2,
              background:
                theme.palette.mode === "light"
                  ? `radial-gradient(circle at 80% -20%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 45%)`
                  : `radial-gradient(circle at 80% -20%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 45%)`,
            }}
          >
            {!selected && (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                <Typography color="text.secondary">Selecciona un chat para comenzar</Typography>
              </Stack>
            )}

            {selected && loadingHistory && (
              <Stack spacing={1.25}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start" justifyContent={i % 2 ? "flex-end" : "flex-start"}>
                    {i % 2 === 0 && <Skeleton variant="circular" width={32} height={32} />}
                    <Skeleton variant="rounded" width="60%" height={40 + (i % 3) * 10} />
                    {i % 2 === 1 && <Skeleton variant="circular" width={32} height={32} />}
                  </Stack>
                ))}
              </Stack>
            )}

            {selected &&
              !loadingHistory &&
              messages.map((m) => {
                const mineMsg = m.senderRole === "admin";
                return (
                  <Stack key={m._id} direction="row" justifyContent={mineMsg ? "flex-end" : "flex-start"} sx={{ mb: 1.25 }}>
                    {!mineMsg && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.warning.main, 0.2), mr: 1 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: "70%",
                        px: 1.25,
                        py: 1,
                        borderRadius: 1.5,
                        bgcolor: mineMsg ? alpha(theme.palette.primary.main, 0.12) : "background.paper",
                        border: `1px solid ${
                          mineMsg ? alpha(theme.palette.primary.main, 0.35) : alpha(theme.palette.divider, 1)
                        }`,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{m.body}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                        {mineMsg ? <DoneAllIcon fontSize="inherit" /> : <CheckCircleIcon fontSize="inherit" />}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Stack>
                    </Box>
                    {mineMsg && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.2), ml: 1 }}>
                        <ForumIcon fontSize="small" />
                      </Avatar>
                    )}
                  </Stack>
                );
              })}
          </Box>

          <Divider />

          <Box sx={{ px: 2, py: 1.5 }}>
            <TextField
              fullWidth
              disabled={!selected || selected.status === "closed" || connecting}
              placeholder={selected?.status === "closed" ? "Chat cerrado" : "Escribe un mensaje…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Enviar">
                      <span>
                        <IconButton color="primary" onClick={handleSend} disabled={!selected || !input.trim()}>
                          <SendIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>
      </Stack>
    </PortalLayout>
  );
}

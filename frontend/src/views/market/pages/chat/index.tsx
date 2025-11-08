// src/views/market/pages/chat/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  Button,
  Chip,
  TextField,
  IconButton,
  Avatar,
  useTheme,
  Skeleton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { SupportAPI, type ChatRoom, type ChatMessage } from "../../../../backend/apis/support.api";
import { showSnackbar } from "../../../../signals/snackbar.signal";
import { useUser } from "../../../../context/UserContext";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Esperando agente",
  assigned: "En curso",
  closed: "Cerrado",
};

export default function MarketSupportChatPage() {
  const theme = useTheme();
  const user = useUser();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [composer, setComposer] = useState("");
  const [creating, setCreating] = useState(false);
  const [initialText, setInitialText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    SupportAPI.connect();
    return () => SupportAPI.disconnect();
  }, []);

  useEffect(() => {
    let unsubRoom: (() => void) | null = null;
    let unsubMsg: (() => void) | null = null;

    unsubRoom = SupportAPI.onRoom(({ type, room }) => {
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r._id === room._id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = room;
          return next.sort((a, b) => (b.lastMessageAt || b.updatedAt).localeCompare(a.lastMessageAt || a.updatedAt));
        }
        return [room, ...prev].sort((a, b) => (b.lastMessageAt || b.updatedAt).localeCompare(a.lastMessageAt || a.updatedAt));
      });
      if (type === "created" && !selected) setSelected(room._id);
      if (selected === room._id) {
        setRooms((prev) => prev.map((r) => (r._id === room._id ? room : r)));
      }
    });

    unsubMsg = SupportAPI.onMessage(({ message }) => {
      setMessages((prev) => (selected === message.roomId ? [...prev, message] : prev));
      setRooms((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((r) => r._id === message.roomId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], lastMessageAt: message.createdAt, updatedAt: message.createdAt };
          next.sort((a, b) => (b.lastMessageAt || b.updatedAt).localeCompare(a.lastMessageAt || a.updatedAt));
        }
        return next;
      });
    });

    return () => {
      unsubRoom?.();
      unsubMsg?.();
    };
  }, [selected]);

  useEffect(() => {
    setLoadingRooms(true);
    SupportAPI.listMine({ page: 1, limit: 50 })
      .then((res) => {
        setRooms(res.items || []);
        const open = (res.items || []).find((r) => r.status !== "closed");
        setSelected(open?._id || res.items?.[0]?._id || null);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    SupportAPI.history(selected, 1, 200)
      .then((res) => setMessages(res.items || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [selected]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
    }
  }, [messages, loadingHistory]);

  const selectedRoom = useMemo(() => rooms.find((r) => r._id === selected) || null, [rooms, selected]);
  const canSend = !!selectedRoom && selectedRoom.status !== "closed" && composer.trim().length > 0;

  const handleCreate = async () => {
    if (creating) return;
    try {
      setCreating(true);
      const room = await SupportAPI.create(initialText.trim() || undefined);
      setInitialText("");
      setSelected(room._id);
      showSnackbar?.("Chat creado. Un agente te atenderá pronto.", "success");
    } catch (e: any) {
      showSnackbar?.(e?.message ?? "No se pudo crear el chat", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!canSend || !selectedRoom) return;
    const text = composer.trim();
    setComposer("");
    try {
      await SupportAPI.send(selectedRoom._id, text);
    } catch (e: any) {
      setComposer(text);
      showSnackbar?.(e?.message ?? "No se pudo enviar el mensaje", "error");
    }
  };

  const statusColor = (s: string) => {
    if (s === "assigned") return "info";
    if (s === "waiting") return "warning";
    if (s === "closed") return "default";
    return "default";
  };

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={800}>
          Soporte
        </Typography>
        <Typography color="text.secondary">
          Chatea con nuestro equipo. Inicia un nuevo chat o continúa uno existente.
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Card
          sx={{
            width: { xs: "100%", md: 340 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 1)}`,
            height: { xs: "auto", md: "70vh" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CardContent sx={{ pb: 1.25 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={800}>
                Tus chats
              </Typography>
              <Button
                size="small"
                startIcon={<AddCommentIcon />}
                onClick={() => setSelected(null)}
                sx={{ textTransform: "none" }}
              >
                Nuevo
              </Button>
            </Stack>
          </CardContent>
          <Divider />
          <Box sx={{ p: 1.25, pt: 1, overflowY: "auto" }}>
            {loadingRooms &&
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={`sk-${i}`} sx={{ mb: 1, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent sx={{ py: 1.25 }}>
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                  </CardContent>
                </Card>
              ))}
            {!loadingRooms &&
              rooms.map((r) => {
                const last = r.lastMessageAt || r.updatedAt || r.createdAt;
                const active = selected === r._id;
                return (
                  <Card
                    key={r._id}
                    sx={{
                      mb: 1,
                      borderRadius: 1.5,
                      border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.45) : theme.palette.divider}`,
                      boxShadow: active ? `0 6px 22px ${alpha(theme.palette.primary.main, 0.12)}` : "none",
                      backgroundColor: active ? alpha(theme.palette.primary.main, 0.03) : "background.paper",
                    }}
                  >
                    <CardActionArea onClick={() => setSelected(r._id)} sx={{ "& .MuiCardActionArea-focusHighlight": { opacity: 0 } }}>
                      <CardContent sx={{ py: 1.25 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.15) }}>
                            <ChatBubbleOutlineIcon fontSize="small" />
                          </Avatar>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                              {STATUS_LABELS[r.status] ?? r.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {new Date(last).toLocaleString("es-ES")}
                            </Typography>
                          </Stack>
                          <Chip size="small" label={STATUS_LABELS[r.status] ?? r.status} color={statusColor(r.status) as any} variant="outlined" />
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            {!loadingRooms && rooms.length === 0 && (
              <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">No tienes chats abiertos.</Typography>
              </Box>
            )}
          </Box>
        </Card>

        <Card
          sx={{
            flex: 1,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 1)}`,
            minHeight: { xs: "50vh", md: "70vh" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!selectedRoom && (
            <Box sx={{ p: 3 }}>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main, width: 56, height: 56 }}>
                  <SupportAgentIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={800}>
                  Inicia un chat de soporte
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
                  Cuéntanos brevemente tu problema y un agente te responderá lo antes posible.
                </Typography>
                <TextField
                  multiline
                  minRows={3}
                  maxRows={6}
                  fullWidth
                  placeholder="Describe tu consulta…"
                  value={initialText}
                  onChange={(e) => setInitialText(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={creating}
                  sx={{ textTransform: "none" }}
                >
                  Empezar chat
                </Button>
              </Stack>
            </Box>
          )}

          {selectedRoom && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.15) }}>
                    <SupportAgentIcon fontSize="small" />
                  </Avatar>
                  <Stack>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Chat con soporte
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{selectedRoom._id.slice(-6).toUpperCase()}
                    </Typography>
                  </Stack>
                </Stack>
                <Chip
                  size="small"
                  label={STATUS_LABELS[selectedRoom.status] ?? selectedRoom.status}
                  color={statusColor(selectedRoom.status) as any}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              <Box
                ref={scrollRef}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  background:
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.primary.light, 0.035)
                      : alpha(theme.palette.primary.dark, 0.06),
                }}
              >
                {loadingHistory && (
                  <Stack spacing={1}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Stack key={i} alignItems={i % 2 ? "flex-end" : "flex-start"}>
                        <Skeleton variant="rounded" sx={{ width: "70%", height: 36, borderRadius: 2 }} />
                      </Stack>
                    ))}
                  </Stack>
                )}
                {!loadingHistory &&
                  messages.map((m) => {
                    const mine = m.senderId === user?._id || m.senderRole === "user";
                    return (
                      <Stack key={m._id} alignItems={mine ? "flex-end" : "flex-start"} sx={{ mb: 1.25 }}>
                        <Box
                          sx={{
                            maxWidth: "75%",
                            borderRadius: 2,
                            px: 1.5,
                            py: 1,
                            backgroundColor: mine
                              ? alpha(theme.palette.primary.main, 0.14)
                              : theme.palette.background.paper,
                            border: `1px solid ${mine ? alpha(theme.palette.primary.main, 0.35) : theme.palette.divider}`,
                            boxShadow: mine ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.12)}` : "none",
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {m.body}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, textAlign: mine ? "right" : "left" }}>
                            {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                {!loadingHistory && messages.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No hay mensajes todavía.
                  </Typography>
                )}
              </Box>

              <Divider />
              <Box sx={{ p: 1.25 }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    placeholder={
                      selectedRoom.status === "closed" ? "El chat está cerrado" : "Escribe tu mensaje…"
                    }
                    fullWidth
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={selectedRoom.status === "closed"}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!canSend}
                    sx={{ width: 44, height: 44 }}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
                {selectedRoom.status === "waiting" && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", textAlign: "center" }}>
                    Esperando a que un agente se una al chat…
                  </Typography>
                )}
                {selectedRoom.status === "closed" && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", textAlign: "center" }}>
                    Este chat está cerrado. Puedes iniciar un nuevo chat desde la barra lateral.
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Card>
      </Stack>
    </Box>
  );
}

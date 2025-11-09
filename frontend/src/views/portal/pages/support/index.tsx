// src/views/portal/pages/support/index.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import PortalLayout from "../../../../layouts/Wrappers/PortalLayout";
import { TableLayout } from "../../../../layouts/Wrappers/TableLayout";
import PaginatedTable from "../../../../components/Tables/PaginatedTable/Table";
import type { ITableColumn } from "../../../../utils/types/table.type";
import type { Action } from "../../../../components/Tables/PaginatedTable/helpers";
import { SupportAPI, type ChatRoom } from "../../../../backend/apis/support.api";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ForumIcon from "@mui/icons-material/Forum";
import { showSnackbar } from "../../../../signals/snackbar.signal";
import { useUser } from "../../../../context/UserContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}
function statusColor(s: string): "default" | "primary" | "success" | "warning" | "info" | "error" {
  if (s === "assigned") return "info";
  if (s === "waiting") return "warning";
  if (s === "closed") return "default";
  return "default";
}
function statusLabel(s: string) {
  if (s === "waiting") return "En espera";
  if (s === "assigned") return "Asignado";
  if (s === "closed") return "Cerrado";
  return s;
}

export default function SupportAdminPage() {
  const me = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState<ChatRoom[]>([]);
  const [mine, setMine] = useState<ChatRoom[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!SupportAPI.isConnected) SupportAPI.connect();
      const [w, m] = await Promise.all([
        SupportAPI.list({ status: "waiting", page: 1, limit: 200 }),
        SupportAPI.listMine({ page: 1, limit: 500 }),
      ]);
      setWaiting(w.items || []);
      setMine(m.items || []);
    } catch {
      showSnackbar?.("No se pudo cargar el estado del chat", "warning");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    let offRoom: (() => void) | undefined;
    try {
      offRoom = SupportAPI.onRoom(() => refresh());
    } catch {}
    return () => {
      if (offRoom) offRoom();
    };
  }, [refresh]);

  const myActive = useMemo(() => mine.filter((r) => r.status === "assigned" && r.adminId === me?._id), [mine, me?._id]);
  const myClosed = useMemo(() => mine.filter((r) => r.status === "closed" && r.adminId === me?._id), [mine, me?._id]);

  const waitingColumns: ITableColumn<ChatRoom>[] = useMemo(
    () => [
      {
        id: "_id",
        label: "Sala",
        render: (_, row) => (
          <Button
            component={RouterLink}
            to={`/portal/support/chat/${encodeURIComponent(row._id)}`}
            variant="text"
            size="small"
            sx={{ textTransform: "none", fontWeight: 700, px: 0, minWidth: 0 }}
          >
            {shortId(row._id)}
          </Button>
        ),
      },
      { id: "customerId", label: "Cliente", render: (v) => <Typography variant="body2">{v}</Typography> },
      {
        id: "status",
        label: "Estado",
        render: (_, row) => <Chip size="small" label={statusLabel(row.status)} color={statusColor(row.status)} variant="outlined" />,
      },
      {
        id: "lastMessageAt",
        label: "Último mensaje",
        render: (v) => <Typography variant="body2" color="text.secondary">{v ? new Date(v).toLocaleString() : "—"}</Typography>,
      },
      {
        id: "createdAt",
        label: "Creado",
        render: (v) => <Typography variant="body2" color="text.secondary">{new Date(v as string).toLocaleString()}</Typography>,
      },
    ],
    []
  );

  const mineColumns: ITableColumn<ChatRoom>[] = useMemo(
    () => [
      {
        id: "_id",
        label: "Sala",
        render: (_, row) => (
          <Button
            component={RouterLink}
            to={`/portal/support/chat/${encodeURIComponent(row._id)}`}
            variant="text"
            size="small"
            sx={{ textTransform: "none", fontWeight: 700, px: 0, minWidth: 0 }}
          >
            {shortId(row._id)}
          </Button>
        ),
      },
      { id: "customerId", label: "Cliente", render: (v) => <Typography variant="body2">{v}</Typography> },
      { id: "status", label: "Estado", render: (_, row) => <Chip size="small" label={statusLabel(row.status)} color={statusColor(row.status)} variant="outlined" /> },
      { id: "lastMessageAt", label: "Último mensaje", render: (v) => <Typography variant="body2" color="text.secondary">{v ? new Date(v).toLocaleString() : "—"}</Typography> },
      { id: "updatedAt", label: "Actualizado", render: (v) => <Typography variant="body2" color="text.secondary">{new Date(v as string).toLocaleString()}</Typography> },
    ],
    []
  );

  const waitingActions = (row: ChatRoom): Action[] => [
    {
      id: "pickup",
      name: "Atender",
      icon: <EditIcon fontSize="small" />,
      onClick: async () => {
        try {
          await SupportAPI.pickup(row._id);
          showSnackbar?.("Sala asignada a ti", "success");
          refresh();
          navigate(`/portal/support/chat/${encodeURIComponent(row._id)}`);
        } catch (e: any) {
          showSnackbar?.(e?.message || "No se pudo asignar la sala", "warning");
        }
      },
      outsideMenu: true,
    },
    {
      id: "open",
      name: "Abrir chat",
      icon: <ForumIcon fontSize="small" />,
      onClick: () => navigate(`/portal/support/chat/${encodeURIComponent(row._id)}`),
      outsideMenu: true,
    },
  ];

  const activeActions = (row: ChatRoom): Action[] => [
    {
      id: "open",
      name: "Abrir chat",
      icon: <ForumIcon fontSize="small" />,
      onClick: () => navigate(`/portal/support/chat/${encodeURIComponent(row._id)}`),
      outsideMenu: true,
    },
    {
      id: "close",
      name: "Cerrar",
      icon: <CheckCircleIcon fontSize="small" />,
      onClick: async () => {
        try {
          await SupportAPI.close(row._id);
          showSnackbar?.("Sala cerrada", "success");
          refresh();
        } catch (e: any) {
          showSnackbar?.(e?.message || "No se pudo cerrar la sala", "warning");
        }
      },
      outsideMenu: true,
    },
  ];

  const closedActions = (row: ChatRoom): Action[] => [
    {
      id: "open",
      name: "Abrir chat",
      icon: <ForumIcon fontSize="small" />,
      onClick: () => navigate(`/portal/support/chat/${encodeURIComponent(row._id)}`),
      outsideMenu: true,
    },
  ];

  return (
    <PortalLayout allowScrolling>
      <TableLayout
        title="Soporte"
        addButton={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} sx={{ textTransform: "none" }}>
            Actualizar
          </Button>
        }
        inheritPortalScroll
      >
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={800}>Chats en espera</Typography>
          <PaginatedTable<ChatRoom>
            data={waiting}
            columns={waitingColumns}
            actions={(r) => waitingActions(r)}
            isLoading={loading}
            tableName="portal-support-waiting"
            wrap
          />

          <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>Mis chats activos</Typography>
          <PaginatedTable<ChatRoom>
            data={myActive}
            columns={mineColumns}
            actions={(r) => activeActions(r)}
            isLoading={loading}
            tableName="portal-support-active"
            wrap
          />

          <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>Mis chats cerrados</Typography>
          <PaginatedTable<ChatRoom>
            data={myClosed}
            columns={mineColumns}
            actions={(r) => closedActions(r)}
            isLoading={loading}
            tableName="portal-support-closed"
            wrap
          />
        </Stack>
      </TableLayout>
    </PortalLayout>
  );
}

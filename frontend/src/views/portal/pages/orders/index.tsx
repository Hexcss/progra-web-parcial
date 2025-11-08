// src/views/portal/pages/orders/index.tsx
import { useMemo, useState } from "react";
import {
  Stack,
  Typography,
  Chip,
  AvatarGroup,
  Avatar,
} from "@mui/material";
import PortalLayout from "../../../../layouts/Wrappers/PortalLayout";
import { TableLayout } from "../../../../layouts/Wrappers/TableLayout";
import PaginatedTable from "../../../../components/Tables/PaginatedTable/Table";
import type { ITableColumn } from "../../../../utils/types/table.type";
import { openModal } from "../../../../signals/modal.signal";
import { useAllOrdersQuery } from "../../../../queries/orders.queries";
import type { Order } from "../../../../schemas/order.schemas";
import type { Action } from "../../../../components/Tables/PaginatedTable/helpers";
import EditIcon from "@mui/icons-material/Edit";
import LaunchIcon from "@mui/icons-material/Launch";

function formatEUR(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number.isFinite(v) ? v : 0);
}

const STATUS_LABELS: Record<string, string> = {
  created: "Creado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
};

function normalizeStatus(raw: string) {
  const s = (raw ?? "").toLowerCase();
  const lettersOnly = s.replace(/[^a-z]/g, "");
  const known = new Set<string>(["created", "processing", "shipped", "delivered", "cancelled", "canceled"]);
  if (known.has(lettersOnly)) return lettersOnly;
  if (lettersOnly.startsWith("d")) {
    const withoutD = lettersOnly.slice(1);
    if (known.has(withoutD)) return withoutD;
  }
  return lettersOnly || "created";
}

function statusColor(status: string): "default" | "primary" | "success" | "warning" | "info" | "error" {
  const s = normalizeStatus(status);
  if (s === "delivered") return "success";
  if (s === "shipped") return "info";
  if (s === "processing") return "warning";
  if (s === "cancelled" || s === "canceled") return "error";
  if (s === "created") return "primary";
  return "default";
}

export default function PortalOrdersPage() {
  const [page] = useState(1);
  const [limit] = useState(100);
  const { data, isLoading } = useAllOrdersQuery({ page, limit });

  const rows: Order[] = useMemo(() => data?.items ?? [], [data?.items]);

  const columns: ITableColumn<Order>[] = useMemo(
    () => [
      {
        id: "_id",
        label: "Pedido",
        width: 140,
        render: (_v, row) => (
          <Typography fontWeight={700}>#{row._id.slice(-6).toUpperCase()}</Typography>
        ),
      },
      {
        id: "email",
        label: "Email",
        width: 240,
        render: (_v, row) => (
          <Typography variant="body2" sx={{ maxWidth: 240 }} noWrap title={row.email || ""}>
            {row.email || "—"}
          </Typography>
        ),
      },
      {
        id: "items",
        label: "Artículos",
        width: 220,
        render: (_v, row) => {
          const count = row.items.reduce<number>((acc, it) => acc + it.quantity, 0);
          const thumbs = row.items.slice(0, 4).map((i) => i.imageUrl).filter(Boolean) as string[];
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 12 } }}>
                {thumbs.length === 0 && <Avatar sx={{ width: 26, height: 26 }}>{count}</Avatar>}
                {thumbs.map((src, i) => (
                  <Avatar key={i} src={src} alt={`item-${i}`} />
                ))}
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary">{count}</Typography>
            </Stack>
          );
        },
      },
      {
        id: "totals",
        label: "Totales",
        width: 180,
        render: (_v, row) => (
          <Stack spacing={0}>
            <Typography variant="body2">Subtotal: {formatEUR(row.subtotal)}</Typography>
            <Typography variant="body2" fontWeight={700}>Total: {formatEUR(row.total)}</Typography>
          </Stack>
        ),
      },
      {
        id: "status",
        label: "Estado",
        width: 160,
        render: (_v, row) => {
          const skey = normalizeStatus(row.status);
          const slabel = STATUS_LABELS[skey] ?? row.status;
          return (
            <Chip
              size="small"
              label={slabel}
              color={statusColor(row.status)}
              variant="outlined"
              sx={{ fontWeight: 700, textTransform: "none" }}
            />
          );
        },
      },
      {
        id: "createdAt",
        label: "Creado",
        width: 180,
        render: (_v, row) => (
          <Typography variant="body2" color="text.secondary">
            {new Date(row.createdAt).toLocaleString()}
          </Typography>
        ),
      },
    ],
    []
  );

  const actions = (row: Order): Action[] => [
    {
      id: "edit",
      name: "Actualizar estado",
      icon: <EditIcon fontSize="small" />,
      onClick: () => openModal("orderStatus", { orderId: row._id, currentStatus: row.status }),
      outsideMenu: true,
    },
    {
      id: "open-market",
      name: "Ver en tienda",
      icon: <LaunchIcon fontSize="small" />,
      onClick: () => window.open(`/market/orders/${encodeURIComponent(row._id)}`, "_blank", "noopener,noreferrer"),
      outsideMenu: true,
    },
  ];

  return (
    <PortalLayout>
      <TableLayout title="Pedidos">
        <PaginatedTable<Order>
          data={rows}
          columns={columns}
          actions={(r) => actions(r)}
          isLoading={isLoading}
          tableName="portal-orders"
          wrap
        />
      </TableLayout>
    </PortalLayout>
  );
}

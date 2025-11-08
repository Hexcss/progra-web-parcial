// src/views/market/pages/orders/index.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  AvatarGroup,
  Avatar,
  Divider,
  Pagination,
  useTheme,
  Skeleton,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { useMyOrdersQuery } from "../../../../queries/orders.queries";
import type { Order } from "../../../../schemas/order.schemas";

function formatEUR(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number.isFinite(v) ? v : 0);
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

const STATUS_STEPS = ["created", "processing", "shipped", "delivered"] as const;

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
  const known = new Set<string>([...STATUS_STEPS, "cancelled", "canceled"]);
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

export default function OrdersPage() {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const limit = 8;
  const { data, isLoading } = useMyOrdersQuery({ page, limit });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 6, md: 8 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", mb: 5 }}>
        <Typography variant="h4" component="h1" fontWeight={800}>
          Tus pedidos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          Consulta el historial de compras y sigue el estado de cada pedido.
        </Typography>
      </Stack>

      <Stack spacing={2.5}>
        {isLoading &&
          Array.from({ length: limit }).map((_, i) => (
            <Card key={`sk-${i}`} sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Skeleton width={180} />
                    <Skeleton width={120} />
                  </Stack>
                  <Stack alignItems="flex-end" spacing={1}>
                    <Skeleton width={120} />
                    <Skeleton width={80} />
                  </Stack>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Skeleton variant="rectangular" sx={{ width: "100%", height: 28, borderRadius: 1 }} />
              </CardContent>
            </Card>
          ))}

        {!isLoading && items.length === 0 && (
          <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
            <Typography variant="h6" fontWeight={700}>
              Aún no tienes pedidos
            </Typography>
            <Typography color="text.secondary">Cuando realices una compra, aparecerá aquí.</Typography>
            <Button component={RouterLink} to="/market" variant="outlined" color="primary">
              Explorar productos
            </Button>
          </Stack>
        )}

        {!isLoading &&
          items.map((o: Order) => {
            const createdAt = new Date(o.createdAt);
            const count = o.items.reduce((a, b) => a + b.quantity, 0);
            const thumbs = o.items.slice(0, 4).map((it) => it.imageUrl).filter(Boolean) as string[];
            const skey = normalizeStatus(o.status);
            const slabel = STATUS_LABELS[skey] ?? o.status;

            return (
              <Card
                key={o._id}
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                  boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
                  "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.4), boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}` },
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/market/orders/${encodeURIComponent(o._id)}`}
                  sx={{ "& .MuiCardActionArea-focusHighlight": { opacity: 0 } }}
                >
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Pedido #{shortId(o._id)}
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                          {formatEUR(o.total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Realizado el {createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={2} alignItems="center">
                        <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 12, borderColor: theme.palette.background.paper } }}>
                          {thumbs.length === 0 && <Avatar sx={{ width: 32, height: 32 }}>{count}</Avatar>}
                          {thumbs.map((src, idx) => (
                            <Avatar key={idx} src={src} alt={`item-${idx}`} />
                          ))}
                        </AvatarGroup>

                        <Divider flexItem orientation="vertical" />

                        <Stack alignItems="flex-end">
                          <Chip
                            size="small"
                            label={slabel}
                            color={statusColor(o.status)}
                            variant="outlined"
                            sx={{ fontWeight: 700, textTransform: "none" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {count} artículo{o.items.length > 1 || count !== 1 ? "s" : ""}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}

        {pages > 1 && (
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <Pagination
              color="primary"
              page={page}
              count={pages}
              onChange={(_, p) => setPage(p)}
              variant="outlined"
              shape="rounded"
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

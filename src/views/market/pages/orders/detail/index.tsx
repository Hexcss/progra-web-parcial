import { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Button,
  Skeleton,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useOrderByIdQuery } from "../../../../../queries/orders.queries";
import type { Order } from "../../../../../schemas/order.schemas";

function formatEUR(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number.isFinite(v) ? v : 0);
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

function stepIndex(status: string) {
  const key = normalizeStatus(status);
  const idx = STATUS_STEPS.indexOf(key as (typeof STATUS_STEPS)[number]);
  return idx >= 0 ? idx : 0;
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

export default function OrderDetailPage() {
  const theme = useTheme();
  const { order: id } = useParams();
  const { data, isLoading } = useOrderByIdQuery(id);
  const o = data as Order | undefined;

  const createdAt = useMemo(() => (o ? new Date(o.createdAt) : null), [o?.createdAt]);
  const statusKey = normalizeStatus(o?.status ?? "");
  const statusLabel = STATUS_LABELS[statusKey] ?? (o?.status ?? "");

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 6, md: 8 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={800}>
          {isLoading ? <Skeleton width={260} /> : `Pedido #${o?._id.slice(-6).toUpperCase()}`}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {isLoading ? (
            <>
              <Skeleton width={100} height={28} />
              <Skeleton width={180} height={20} />
            </>
          ) : (
            <>
              <Chip
                size="small"
                label={statusLabel}
                color={statusColor(o?.status ?? "")}
                variant="outlined"
                sx={{ fontWeight: 700, textTransform: "none" }}
              />
              {createdAt && (
                <Typography variant="body2" color="text.secondary">
                  Realizado el {createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Stack>

      <Card
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
          mb: 3,
        }}
      >
        <CardContent>
          {isLoading ? (
            <Skeleton variant="rectangular" sx={{ width: "100%", height: 60, borderRadius: 1 }} />
          ) : (
            <Stepper activeStep={stepIndex(o?.status ?? "created")} alternativeLabel>
              {STATUS_STEPS.map((s) => (
                <Step key={s}>
                  <StepLabel>{STATUS_LABELS[s] ?? s}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Artículos
          </Typography>

          {isLoading && (
            <Stack spacing={2}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Stack key={i} direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="rounded" sx={{ width: 64, height: 64 }} />
                  <Stack sx={{ flex: 1 }}>
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                  </Stack>
                  <Skeleton width={80} />
                </Stack>
              ))}
            </Stack>
          )}

          {!isLoading && (
            <Stack spacing={2} divider={<Divider />}>
              {o?.items.map((it, idx) => (
                <Stack key={idx} direction="row" spacing={2} alignItems="center">
                  <Avatar
                    variant="rounded"
                    src={it.imageUrl}
                    alt={it.name}
                    sx={{ width: 64, height: 64, border: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper" }}
                  />
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap title={it.name}>
                      {it.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {it.quantity} × {formatEUR(it.unitPrice)}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {formatEUR(it.lineTotal)}
                  </Typography>
                </Stack>
              ))}
              {(!o || o.items.length === 0) && (
                <Typography color="text.secondary">No hay artículos en este pedido.</Typography>
              )}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          {isLoading ? (
            <Stack spacing={1}>
              <Skeleton width={180} />
              <Skeleton width={120} />
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>{formatEUR(o?.subtotal ?? 0)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">Envío</Typography>
                <Typography>Incluido</Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={800}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary">
                  {formatEUR(o?.total ?? 0)}
                </Typography>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
        <Button component={RouterLink} to="/market/orders" variant="outlined" color="primary">
          Volver a pedidos
        </Button>
      </Stack>
    </Box>
  );
}

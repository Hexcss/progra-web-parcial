// src/components/Modals/Cart/ShoppingCartModal.tsx
import { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  IconButton,
  Button,
  Avatar,
  TextField,
  useTheme,
} from "@mui/material";
import { Minus, Plus, Trash2 } from "lucide-react";
import BaseDrawerModal from "../../Modals/Bases/BaseDrawerModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { useLocalShoppingCart } from "../../../hooks/useLocalShoppingCart";
import { useNavigate } from "react-router-dom";
import { closeModal } from "../../../signals/modal.signal";
import { useCreateOrderMutation } from "../../../queries/orders.queries";
import { showSnackbar } from "../../../signals/snackbar.signal";

type Props = ModalPropsMap["shoppingCart"];

function formatEUR(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number.isFinite(v) ? v : 0);
}

function computeDelivery(subtotal: number) {
  return subtotal >= 100 ? 0 : (subtotal > 0 ? 4.99 : 0);
}

export default function ShoppingCartModal({ onCheckout }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { items, totals, setQty, remove, clear, getItem } = useLocalShoppingCart();
  const createOrder = useCreateOrderMutation();

  const delivery = computeDelivery(totals.subtotal);
  const finalTotal = useMemo(() => Number((totals.subtotal + delivery).toFixed(2)), [totals.subtotal, delivery]);

  const handleMinus = (productId: string) => {
    const curr = getItem(productId);
    if (!curr) return;
    const nextQty = curr.qty - 1;
    setQty(productId, nextQty);
  };

  const handlePlus = (productId: string) => {
    const curr = getItem(productId);
    if (!curr) return;
    setQty(productId, curr.qty + 1);
  };

  const handleQtyInput = (productId: string, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setQty(productId, n);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return false;

    if (onCheckout) {
      await onCheckout();
      return true;
    }

    try {
      const payload = {
        items: items.map((it) => ({ productId: it.productId, quantity: it.qty })),
        currency: "EUR",
      };
      const order = await createOrder.mutateAsync(payload);
      showSnackbar("Pedido creado correctamente", "success");
      clear();
      // If you want to navigate to a detail page later, uncomment:
      // navigate(`/market/orders/${encodeURIComponent(order._id)}`);
      return true;
    } catch (e: any) {
      showSnackbar(e?.message || "No se pudo crear el pedido", "error");
      return false;
    }
  };

  return (
    <BaseDrawerModal
      open
      title="Tu carrito"
      onClose={closeModal}
      onConfirm={handleCheckout}
      confirmText={createOrder.isPending ? "Procesando…" : "Comprar ahora"}
      disableConfirm={items.length === 0 || createOrder.isPending}
      width="wide"
      loading={createOrder.isPending}
    >
      <Stack spacing={2}>
        {items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Tu carrito está vacío
            </Typography>
            <Typography color="text.secondary">
              Explora nuestros productos y añade tus favoritos al carrito.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} divider={<Divider />}>
            {items.map((it) => {
              const hasDiscount = (it.discountPercent ?? 0) > 0;
              return (
                <Stack key={it.productId} direction="row" spacing={2} alignItems="center">
                  <Avatar
                    variant="rounded"
                    src={it.imageUrl}
                    alt={it.name}
                    sx={{
                      width: 64,
                      height: 64,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: "background.paper",
                    }}
                  />
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap title={it.name}>
                      {it.name}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="body1" fontWeight={700}>
                        {formatEUR(it.finalPrice)}
                      </Typography>
                      {hasDiscount && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                          {formatEUR(it.price)}
                        </Typography>
                      )}
                      {hasDiscount && (
                        <Typography variant="caption" sx={{ color: "#d35400", fontWeight: 700 }}>
                          −{Math.round(it.discountPercent ?? 0)}%
                        </Typography>
                      )}
                    </Stack>

                    {!!it.stock && (
                      <Typography variant="caption" color="text.secondary">
                        Stock: {it.stock}
                      </Typography>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={() => handleMinus(it.productId)}
                      aria-label="Disminuir cantidad"
                      disabled={createOrder.isPending}
                    >
                      <Minus size={16} />
                    </IconButton>
                    <TextField
                      value={String(it.qty)}
                      onChange={(e) => handleQtyInput(it.productId, e.target.value)}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center", width: 36 } }}
                      size="small"
                      disabled={createOrder.isPending}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handlePlus(it.productId)}
                      aria-label="Aumentar cantidad"
                      disabled={createOrder.isPending}
                    >
                      <Plus size={16} />
                    </IconButton>
                  </Stack>

                  <Box sx={{ width: 96, textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatEUR(it.finalPrice * it.qty)}
                    </Typography>
                  </Box>

                  <IconButton
                    color="error"
                    onClick={() => remove(it.productId)}
                    aria-label="Eliminar del carrito"
                    sx={{ ml: 1 }}
                    disabled={createOrder.isPending}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Stack>

      {items.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Artículos</Typography>
              <Typography color="text.secondary">{totals.count}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>{formatEUR(totals.subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography color="text.secondary">Envío</Typography>
              <Typography>{delivery === 0 ? "Gratis" : formatEUR(delivery)}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={800}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatEUR(finalTotal)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Button color="inherit" onClick={() => clear()} sx={{ textTransform: "none" }} disabled={createOrder.isPending}>
              Vaciar carrito
            </Button>
          </Stack>
        </Box>
      )}
    </BaseDrawerModal>
  );
}

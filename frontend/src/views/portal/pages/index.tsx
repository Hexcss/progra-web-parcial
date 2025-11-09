// src/views/portal/pages/index.tsx
import { useMemo } from "react";
import PortalLayout from "../../../layouts/Wrappers/PortalLayout";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import GroupIcon from "@mui/icons-material/Group";
import StarRateIcon from "@mui/icons-material/StarRate";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useTheme } from "@mui/material";
import { useProductsQuery, useTopProductsQuery } from "../../../queries/products.queries";
import { useCategoriesQuery } from "../../../queries/categories.queries";
import { useUsersQuery } from "../../../queries/users.queries";
import { useReviewsQuery } from "../../../queries/reviews.queries";
import { useDiscountsQuery } from "../../../queries/discounts.queries";
import { useAllOrdersQuery } from "../../../queries/orders.queries";
import { Link as RouterLink } from "react-router-dom";
import { StatCard } from "../components/Cards/StatCard";
import { IconFromName } from "../../../utils/functions/icons.function";
import type { Order } from "../../../schemas/order.schemas";

function formatEUR(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number.isFinite(v) ? v : 0);
}

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

export default function AdminSummaryPage() {
  const theme = useTheme();

  const overviewProducts = useProductsQuery({ page: 1, limit: 1 });
  const overviewUsers = useUsersQuery({ page: 1, limit: 1 });
  const overviewReviews = useReviewsQuery({ page: 1, limit: 1 });
  const overviewDiscounts = useDiscountsQuery({ page: 1, limit: 1 });
  const categoriesQ = useCategoriesQuery();
  const overviewOrders = useAllOrdersQuery({ page: 1, limit: 1 });
  const recentOrdersQ = useAllOrdersQuery({ page: 1, limit: 100 });

  const latestProductsQ = useProductsQuery({ page: 1, limit: 5, sort: "new" });
  const topProductsQ = useTopProductsQuery(5);

  const totals = useMemo(() => {
    console.log("reviews data:", overviewReviews.data)
    const products = overviewProducts.data?.total ?? 0;
    const users = overviewUsers.data?.total ?? 0;
    const reviews = overviewReviews.data?.total ?? 0;
    const discounts = overviewDiscounts.data?.total ?? 0;
    const categories = categoriesQ.data?.length ?? 0;
    const orders = overviewOrders.data?.total ?? 0;
    return { products, users, reviews, discounts, categories, orders };
  }, [
    overviewProducts.data?.total,
    overviewUsers.data?.total,
    overviewReviews.data?.total,
    overviewDiscounts.data?.total,
    categoriesQ.data,
    overviewOrders.data?.total,
  ]);

  const topCategories = useMemo(
    () =>
      (categoriesQ.data ?? [])
        .slice()
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 5),
    [categoriesQ.data]
  );

  const ordersSample = useMemo<Order[]>(() => recentOrdersQ.data?.items ?? [], [recentOrdersQ.data?.items]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();

  const ordersStats = useMemo(() => {
    const totalSample = ordersSample.length;
    const revenueSample = ordersSample.reduce((a, b) => a + (b.total || 0), 0);
    const created = ordersSample.filter(o => normalizeStatus(o.status) === "created").length;
    const processing = ordersSample.filter(o => normalizeStatus(o.status) === "processing").length;
    const shipped = ordersSample.filter(o => normalizeStatus(o.status) === "shipped").length;
    const delivered = ordersSample.filter(o => normalizeStatus(o.status) === "delivered").length;
    const cancelled = ordersSample.filter(o => {
      const s = normalizeStatus(o.status);
      return s === "cancelled" || s === "canceled";
    }).length;
    const todayCount = ordersSample.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= startOfToday && t < endOfToday;
    }).length;
    const avg = totalSample > 0 ? revenueSample / totalSample : 0;
    return {
      revenueSample,
      totalSample,
      avg,
      created,
      processing,
      shipped,
      delivered,
      cancelled,
      todayCount,
    };
  }, [ordersSample, startOfToday, endOfToday]);

  return (
    <PortalLayout contentZoomable allowScrolling>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          useFlexGap
          flexWrap="wrap"
          sx={{ alignItems: "stretch" }}
        >
          <StatCard
            icon={<Inventory2Icon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Productos"
            value={overviewProducts.isLoading ? "…" : totals.products}
            to="/portal/products"
          />
          <StatCard
            icon={<CategoryIcon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Categorías"
            value={categoriesQ.isLoading ? "…" : totals.categories}
            to="/portal/categories"
          />
          <StatCard
            icon={<GroupIcon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Usuarios"
            value={overviewUsers.isLoading ? "…" : totals.users}
            to="/portal/users"
          />
          <StatCard
            icon={<StarRateIcon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Reseñas"
            value={overviewReviews.isLoading ? "…" : totals.reviews}
          />
          <StatCard
            icon={<LocalOfferIcon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Descuentos"
            value={overviewDiscounts.isLoading ? "…" : totals.discounts}
          />
          <StatCard
            icon={<ReceiptLongIcon sx={{ color: theme.palette.primary.main }} fontSize="small" />}
            label="Pedidos"
            value={overviewOrders.isLoading ? "…" : totals.orders}
            to="/portal/orders"
          />
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.18),
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Últimos productos
              </Typography>
              <Button component={RouterLink} to="/portal/products" size="small" sx={{ textTransform: "none" }}>
                Ver todos
              </Button>
            </Stack>
            {latestProductsQ.isLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                    <Skeleton variant="rounded" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="50%" />
                      <Skeleton width="30%" />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <List dense disablePadding>
                {(latestProductsQ.data?.items ?? []).map((p, idx, arr) => (
                  <Box key={p._id}>
                    <ListItem
                      disableGutters
                      secondaryAction={
                        <Typography variant="body2" color="text.secondary">
                          € {p.price.toFixed(2)}
                        </Typography>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={p.imageUrl || undefined}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                            fontSize: 14,
                          }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={p.name}
                        secondary={`Stock: ${p.stock}${p.activeDiscount ? ` · Descuento: ${p.activeDiscount.discountPercent}%` : ""}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                    {idx < arr.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.18),
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Top productos
              </Typography>
              <Button component={RouterLink} to="/portal/products" size="small" sx={{ textTransform: "none" }}>
                Gestionar
              </Button>
            </Stack>
            {topProductsQ.isLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                    <Skeleton variant="rounded" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="35%" />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <List dense disablePadding>
                {(topProductsQ.data ?? []).map((p, idx, arr) => (
                  <Box key={p._id}>
                    <ListItem
                      disableGutters
                      secondaryAction={
                        <Typography variant="body2" color="text.secondary">
                          {p.avgRating ? `★ ${p.avgRating.toFixed(1)} · ${p.reviewCount ?? 0}` : "Sin valoraciones"}
                        </Typography>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={p.imageUrl || undefined}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(theme.palette.success.main, 0.12),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
                            fontSize: 14,
                          }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={p.name} secondary={`Precio: € ${p.price.toFixed(2)}`} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItem>
                    {idx < arr.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.18),
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Categorías destacadas
              </Typography>
              <Button component={RouterLink} to="/portal/categories" size="small" sx={{ textTransform: "none" }}>
                Gestionar
              </Button>
            </Stack>
            {categoriesQ.isLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                    <Skeleton variant="rounded" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="50%" />
                      <Skeleton width="30%" />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <List dense disablePadding>
                {topCategories.map((c, idx, arr) => (
                  <Box key={c._id}>
                    <ListItem disableGutters>
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(theme.palette.warning.main, 0.12),
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#000"
                          }}
                        >
                          <IconFromName icon={c.icon} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={c.name}
                        secondary={`${c.productCount} productos`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                    {idx < arr.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.25,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: alpha(theme.palette.primary.main, 0.35),
              background:
                theme.palette.mode === "light"
                  ? alpha(theme.palette.primary.light, 0.04)
                  : alpha(theme.palette.primary.dark, 0.08),
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={800}>
                  Pedidos
                </Typography>
                <Button
                  component={RouterLink}
                  to="/portal/orders"
                  variant="outlined"
                  sx={{ textTransform: "none" }}
                >
                  Gestionar
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Total</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {overviewOrders.isLoading ? "…" : totals.orders}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Hoy</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : ordersStats.todayCount}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">En proceso</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : ordersStats.created + ordersStats.processing}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Entregados</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : ordersStats.delivered}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Ingresos (muestra)</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : formatEUR(ordersStats.revenueSample)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Ticket medio (muestra)</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : formatEUR(ordersStats.avg)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Cancelados</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {recentOrdersQ.isLoading ? "…" : ordersStats.cancelled}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </PortalLayout>
  );
}

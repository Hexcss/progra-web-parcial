import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Button,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";
import { useCategoriesQuery, useRefreshCategoryThumbnail } from "../../../../queries/categories.queries";
import type { CategoryEnriched } from "../../../../schemas/market.schemas";
import CategoryCard from "../Cards/CategoryCard";

export default function TopCategoriesSection() {
  const theme = useTheme();
  const { data, isLoading } = useCategoriesQuery();
  const refreshThumb = useRefreshCategoryThumbnail();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const top6 = useMemo<CategoryEnriched[]>(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));
    return list.slice(0, 6);
  }, [data]);

  useEffect(() => {
    if (!top6.length) return;
    const ids = top6.map((c) => c._id);
    const interval = setInterval(() => {
      const pick = ids[Math.floor(Math.random() * ids.length)];
      setRefreshingId(pick);
      refreshThumb.mutate(pick, {
        onSettled: () => {
          setTimeout(() => setRefreshingId((prev) => (prev === pick ? null : prev)), 650);
        },
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [top6.map((c) => c._id).join(","), refreshThumb]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 6, md: 8 },
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.05)} 0%, transparent 50%)`,
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", mb: 5 }}>
        <Typography variant="h4" component="h2" fontWeight={800}>
          Explora Nuestras Categorías
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: "580px" }}>
          Encuentra lo que buscas en nuestra cuidada selección de productos, organizados para que tu experiencia sea única.
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Grid key={`sk-${i}`} size={{ xs: 6, sm: 4 }}>
              <Card sx={{ borderRadius: 2.5, overflow: "hidden", border: `1px solid ${theme.palette.divider}` }}>
                <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "4 / 3" }} />
                <CardContent sx={{ py: 1.5 }}>
                  <Skeleton width="70%" />
                </CardContent>
              </Card>
            </Grid>
          ))}

        {!isLoading &&
          top6.map((c) => (
            <Grid key={c._id} size={{ xs: 6, sm: 4 }}>
              <CategoryCard category={c} isRefreshing={refreshingId === c._id} />
            </Grid>
          ))}
      </Grid>
      
      <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
        <Button
            component={RouterLink}
            to="/market/categories"
            variant="outlined"
            color="warning"
            endIcon={<ArrowForward />}
            sx={{ textTransform: "none", borderRadius: '999px', px: 3 }}
        >
            Ver todas las categorías
        </Button>
      </Box>
    </Box>
  );
}
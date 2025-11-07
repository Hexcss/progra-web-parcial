import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Rating,
  Stack,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

type ProductCardProps = {
  product: {
    _id: string;
    name: string;
    imageUrl?: string;
    price: number;
    avgRating?: number | null;
    activeDiscount?: {
      discountPercent?: number | null;
    } | null;
  };
};

function getDiscountPercent(p: ProductCardProps["product"]) {
  return p.activeDiscount?.discountPercent ?? 0;
}

export default function ProductCard({ product }: ProductCardProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  const discount = Math.max(0, Math.min(100, getDiscountPercent(product) || 0));
  const hasDiscount = discount > 0;
  const price = product.price;
  const finalPrice = hasDiscount ? Math.max(0.01, +(price * (1 - discount / 100)).toFixed(2)) : price;
  const rating = product.avgRating ?? 0;

  return (
    <Card
      component={motion.div}
      initial={false}
      animate={hovered ? { y: -6, scale: 1.006 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        willChange: "transform, opacity",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity .25s ease",
        },
        "&::before": {
          background: `radial-gradient(60% 50% at 50% 30%, ${alpha(theme.palette.primary.main, 0.10)} 0%, transparent 60%)`,
        },
        "&::after": {
          padding: "1px",
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.35)}, ${alpha(
            theme.palette.primary.main,
            0.05
          )}, ${alpha(theme.palette.primary.main, 0.35)})`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          borderRadius: "inherit",
        },
        ...(hovered && {
          "&::before, &::after": { opacity: 1 },
        }),
      }}
    >
      {hasDiscount && (
        <Tooltip title={`Ahorra un ${discount}%`}>
          <Chip
            label={`${discount}%`}
            size="small"
            color="warning"
            sx={{
              position: "absolute",
              zIndex: 2,
              top: 8,
              left: 8,
              fontWeight: 700,
              backdropFilter: "blur(4px)",
            }}
          />
        </Tooltip>
      )}

      <CardActionArea
        component={RouterLink}
        to={`/market/products/${product._id}`}
        sx={{
          "& .MuiCardActionArea-focusHighlight": { opacity: 0.08 },
          "&:focus-visible": {
            outline: `3px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          component={motion.div}
          animate={hovered ? { scale: 1.03, y: -2 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          sx={{ transformOrigin: "50% 50%", willChange: "transform" }}
        >
          <CardMedia
            component="img"
            image={product.imageUrl || "https://placehold.co/640x480?text=Producto"}
            alt={product.name}
            loading="lazy"
            sx={{
              width: "100%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              display: "block",
              transform: "translateZ(0)",
            }}
          />
        </Box>

        <CardContent sx={{ pb: 2 }}>
          <Typography
            gutterBottom
            fontWeight={600}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.3,
              minHeight: theme.typography.pxToRem(42),
            }}
          >
            {product.name}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Rating value={Number(rating)} precision={0.1} readOnly size="small" />
            <Typography variant="caption" color="text.secondary">
              ({Number(rating).toFixed(1)})
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography fontWeight={800} color="primary.main">
              €{finalPrice.toFixed(2)}
            </Typography>
            {hasDiscount && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                €{price.toFixed(2)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

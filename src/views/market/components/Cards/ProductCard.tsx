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
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Percent } from "lucide-react";
import { motion } from "framer-motion";
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

    const discount = Math.max(0, Math.min(100, getDiscountPercent(product) || 0));
    const hasDiscount = discount > 0;
    const price = product.price;
    const finalPrice = hasDiscount
        ? Math.max(0.01, +(price * (1 - discount / 100)).toFixed(2))
        : price;
    const rating = product.avgRating ?? 0;

    return (
        <Card
            component={motion.div}
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: `0 1px 1px ${alpha(theme.palette.common.black, 0.05)}`,
                "&:hover": {
                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                },
            }}
        >
            {hasDiscount && (
                <Tooltip title={`Ahorra un ${discount}%`}>
                    <Chip
                        icon={<Percent size={14} />}
                        label={`${discount}%`}
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{
                            position: "absolute",
                            zIndex: 2,
                            top: 12,
                            left: 12,
                            bgcolor: alpha(theme.palette.success.main, 0.85),
                            color: theme.palette.success.contrastText,
                            backdropFilter: "blur(4px)",
                            letterSpacing: 0.5,
                            fontWeight: 600,
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
                        outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                        outlineOffset: 2,
                    },
                }}
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
                    }}
                />

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
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textDecoration: "line-through" }}
                            >
                                €{price.toFixed(2)}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
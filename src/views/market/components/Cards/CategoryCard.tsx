// src/views/market/components/Cards/CategoryCard.tsx
import { useTheme, alpha } from "@mui/material/styles";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import type { CategoryEnriched } from "../../../../schemas/market.schemas";
import { resolveAssetUrl } from "../../../../utils/functions/resolve-asset-url.function";

type Props = {
  category: CategoryEnriched;
  isRefreshing?: boolean;
};

export default function CategoryCard({ category, isRefreshing }: Props) {
  const theme = useTheme();
  const fallback = "https://placehold.co/640x480?text=Categor%C3%ADa";
  const thumb = resolveAssetUrl(category.thumbnail) || fallback;

  const cardVariants = { rest: { y: 0 }, hover: { y: -5 } };
  const imageVariants = { rest: { scale: 1 }, hover: { scale: 1.08 } };

  return (
    <Card
      component={motion.div}
      initial="rest"
      whileHover="hover"
      variants={cardVariants}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      sx={{
        borderRadius: 2.5,
        overflow: "hidden",
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        "&:hover": {
          borderColor: alpha(theme.palette.warning.main, 0.6),
          boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.1)}`,
        },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/market/categories/${encodeURIComponent(category._id)}`}
        sx={{
          "& .MuiCardActionArea-focusHighlight": { opacity: 0 },
          "&:focus-visible": {
            outline: `3px solid ${alpha(theme.palette.warning.main, 0.7)}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box sx={{ position: "relative", aspectRatio: "4 / 3" }}>
          <Box
            component={motion.img}
            key={thumb}
            variants={imageVariants}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.4 }}
            src={thumb}
            alt={category.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== fallback) img.src = fallback;
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              position: "absolute",
              inset: 0,
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
          />

          {isRefreshing && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "catShimmer 900ms linear 1",
                "@keyframes catShimmer": {
                  "0%": { backgroundPosition: "200% 0" },
                  "100%": { backgroundPosition: "-200% 0" },
                },
              }}
            />
          )}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
            }}
          />

          <CardContent
            sx={{
              position: "absolute",
              zIndex: 3,
              bottom: 0,
              left: 0,
              right: 0,
              color: "common.white",
              textAlign: "center",
              py: 1.25,
            }}
          >
            <Typography
              variant="h6"
              component="h3"
              fontWeight={700}
              sx={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              {category.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {category.productCount} productos
            </Typography>
          </CardContent>
        </Box>
      </CardActionArea>
    </Card>
  );
}

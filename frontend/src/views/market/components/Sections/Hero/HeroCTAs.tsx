// src/views/market/components/Sections/Hero/HeroCTAs.tsx
import { Button, Stack } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

export const HeroCTAs = memo(function HeroCTAs({
  variants,
  custom = 5,
}: {
  variants: Variants;
  custom?: number;
}) {
  return (
    <Stack
      component={motion.div}
      variants={variants}
      custom={custom}
      direction="row"
      spacing={2}
      sx={{ pt: 1, flexWrap: "wrap" }}
    >
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        style={{ willChange: "transform", backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
      >
        <Button
          component={RouterLink}
          to="/market/deals"
          startIcon={<ShoppingCart size={18} />}
          variant="contained"
          sx={{
            textTransform: "none",
            px: 2.8,
            borderRadius: 2,
            color: "#fff",
            background: "linear-gradient(90deg, #f39c12 0%, #e67e22 60%, #ffb142 100%)",
            boxShadow: "0 8px 20px rgba(230,126,34,0.22), inset 0 -2px 0 rgba(0,0,0,0.12)",
            transition: "box-shadow .18s ease, background-position .18s ease",
            backgroundSize: "200% 100%",
            backgroundPosition: "0% 50%",
            transform: "translateZ(0)",
            willChange: "box-shadow, transform",
            letterSpacing: 0,
            "&:hover": {
              backgroundPosition: "100% 50%",
              boxShadow: "0 12px 28px rgba(230,126,34,0.30), inset 0 -2px 0 rgba(0,0,0,0.18)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 45%, transparent 60%)",
              transform: "translateX(-120%)",
              transition: "transform .7s ease",
              pointerEvents: "none",
            },
            "&:hover::after": { transform: "translateX(120%)" },
          }}
        >
          Ver ofertas
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        style={{ willChange: "transform", backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
      >
        <Button
          component={RouterLink}
          to="/market/categories"
          endIcon={<ArrowRight size={16} />}
          variant="outlined"
          sx={{
            textTransform: "none",
            px: 2.8,
            borderRadius: 2,
            color: "#d35400",
            borderColor: "rgba(230,126,34,0.9)",
            background: "transparent",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow .18s ease, border-color .18s ease, background-color .18s ease",
            transform: "translateZ(0)",
            willChange: "box-shadow, transform",
            letterSpacing: 0,
            "&:hover": {
              bgcolor: "rgba(255,165,0,0.10)",
              borderColor: "#e67e22",
              boxShadow: "0 10px 26px rgba(230,126,34,0.18), inset 0 0 18px rgba(255,177,66,0.14)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: -1,
              borderRadius: "inherit",
              padding: "1px",
              background: "linear-gradient(180deg, rgba(255,177,66,0.45), rgba(230,126,34,0.30))",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              opacity: 0,
              transition: "opacity .2s ease",
            },
            "&:hover::before": { opacity: 1 },
          }}
        >
          Explorar categorías
        </Button>
      </motion.div>
    </Stack>
  );
});

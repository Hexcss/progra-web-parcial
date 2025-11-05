// src/views/market/components/Sections/Hero/HeroCopy.tsx
import { Box, Typography } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import { useTypewriter } from "./useTypeWriter";
import { memo } from "react";

export const HeroCopy = memo(function HeroCopy({
  variants,
  mdUp,
}: {
  variants: Variants;
  mdUp: boolean;
}) {
  const headlineA = useTypewriter("Compra tecnología con velocidad de vértigo.");
  const headlineB = useTypewriter("Fresco. Minimal. Futurista.", 18);
  return (
    <Box>
      <Typography
        component={motion.h1}
        variants={variants}
        custom={0}
        variant={mdUp ? "h3" : "h4"}
        sx={{ fontWeight: 900, lineHeight: 1.25, letterSpacing: 0.2 }}
      >
        {headlineA}
      </Typography>
      <Typography
        component={motion.h2}
        variants={variants}
        custom={1}
        variant="h5"
        sx={{
          mt: 1,
          fontWeight: 800,
          lineHeight: 1.1,
          background: "linear-gradient(90deg,#f39c12 0%,#e67e22 50%,#ffb142 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {headlineB}
      </Typography>
      <Typography
        component={motion.p}
        variants={variants}
        custom={2}
        variant="body1"
        sx={{ color: "text.secondary", maxWidth: 720, mt: 1 }}
      >
        Laptops de alto rendimiento, monitores precisos, audio inmersivo y componentes fiables. Todo lo que necesitas, en un flujo de compra ágil.
      </Typography>
    </Box>
  );
});
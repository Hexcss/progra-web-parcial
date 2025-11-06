// src/views/market/components/Sections/HeroSection.tsx
import { Box, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import { HeroCopy } from "./Hero/HeroCopy";
import { HeroSearch } from "./Hero/HeroSearch";
import { HeroChips } from "./Hero/HeroChips";
import { HeroCTAs } from "./Hero/HeroCTAs";
import { HeroArt } from "./Hero/HeroArt";

export default function HeroSection() {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));

  const variants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <Box sx={{ position: "relative", zIndex: 1, py: { xs: 6, sm: 8, md: 10 } }}>
      <Box
        component={motion.section}
        initial="hidden"
        animate="show"
        sx={{
          position: "relative",
          zIndex: 1,
          borderRadius: 3,
          overflow: "hidden",
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 5, sm: 6, md: 7 },
          mx: { xs: -1.5, sm: 0 },
          background: "linear-gradient(180deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.55) 100%)",
          border: "1px solid rgba(255,165,0,0.25)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(900px 400px at 12% -10%, rgba(255,171,64,0.18), rgba(255,255,255,0) 60%)",
          }}
        />
        <Grid container alignItems="center" spacing={4} sx={{ position: "relative" }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <HeroCopy variants={variants} mdUp={mdUp} />
              <HeroSearch variants={variants} custom={3} />
              <HeroChips variants={variants} custom={4} />
              <HeroCTAs variants={variants} custom={5} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: mdUp ? "flex-end" : "center" }}>
            <HeroArt variants={variants} mdUp={mdUp} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

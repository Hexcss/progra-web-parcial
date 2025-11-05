// src/views/market/index.tsx
import { Suspense } from "react";
import { Box } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import HeroSection from "../components/Sections/HeroSection";

export default function MarketHomePage() {
  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary" }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={null}>
            <HeroSection />
          </Suspense>
        </AnimatePresence>
    </Box>
  );
}

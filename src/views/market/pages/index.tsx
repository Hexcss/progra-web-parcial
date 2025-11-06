// src/views/market/index.tsx
import { Suspense } from "react"
import { Box } from "@mui/material"
import { AnimatePresence } from "framer-motion"
import { HeroSection, TopProductsSection } from "../components"


export default function MarketHomePage() {
  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary" }}>
      <AnimatePresence mode="wait">
        <Suspense fallback={null}>
          <HeroSection />
        </Suspense>
      </AnimatePresence>
      <Suspense fallback={null}>
        <TopProductsSection />
      </Suspense>
    </Box>
  )
}

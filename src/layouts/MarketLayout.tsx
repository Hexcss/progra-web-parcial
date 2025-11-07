import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";
import MarketTopBar from "../components/TopBars/MarketTopBar";
import { Box, Container, Fade } from "@mui/material";
import { MarketParticles } from "../components/Particles/MarketParticles";

export default function MarketLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flex: 1, flexDirection: "column", color: "text.primary" }}>
      <MarketTopBar />
      <div style={{ zIndex: -1 }}>
        <MarketParticles />
      </div>
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 4 } }}>
        <Container maxWidth="xl">
          <Suspense fallback={<AppLoader open message="Cargando mercado…" />}>
            <Fade in appear timeout={300}>
              <Box>
                <Outlet />
              </Box>
            </Fade>
          </Suspense>
        </Container>
      </Box>
    </Box>
  );
}

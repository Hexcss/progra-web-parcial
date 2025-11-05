import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";
import MarketTopBar from "../components/TopBars/MarketTopBar";
import { Box, Container, Fade } from "@mui/material";

export default function MarketLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flex: 1, flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>
      <MarketTopBar />
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

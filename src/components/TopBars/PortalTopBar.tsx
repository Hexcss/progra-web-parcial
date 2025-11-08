// src/components/TopBars/PortalTopBar.tsx
import { useCallback } from "react";
import { AppBar, Toolbar, IconButton, Box, Stack, Button, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSignals } from "@preact/signals-react/runtime";
import { openDrawer } from "../../signals/drawer.signal";
import { Squash as Hamburger } from "hamburger-react";
import { useAuthActions } from "../../context/UserContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function PortalTopBar() {
  useSignals();
  const navigate = useNavigate();
  const { logout } = useAuthActions();

  const handleLogoClick = useCallback(() => {
    navigate("/portal");
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/market");
  }, [logout, navigate]);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          boxShadow: 0,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              sx={{ ml: -0.3, mr: 1, p: 0 }}
            >
              <Hamburger
                toggled={openDrawer.value}
                toggle={(toggled) => {
                  if (typeof toggled === "function") {
                    openDrawer.value = toggled(openDrawer.value);
                  } else {
                    openDrawer.value = toggled;
                  }
                }}
                size={20}
                duration={0.4}
              />
            </IconButton>

            <Typography
              variant="h6"
              onClick={handleLogoClick}
              sx={{
                fontWeight: 800,
                letterSpacing: 0.3,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              NeoTech
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Button
              component={RouterLink}
              to="/market"
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.6)" }}
            >
              Volver al mercado
            </Button>

            <Button
              onClick={handleLogout}
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.6)" }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

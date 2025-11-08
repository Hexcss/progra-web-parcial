// src/views/auth/unauthorized/index.tsx
import { Link } from "react-router-dom";
import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import { LazyLottie } from "../../../components/Animations/LazyLottie";
import AnonParticles from "../../../components/Particles/AnonParticles";

export default function UnauthorizedPage() {
  const title = "Acceso no autorizado";
  const message =
    "No tienes permisos para acceder a esta sección. Si crees que es un error, ponte en contacto con el administrador.";
  const cta = "Volver al inicio";

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100dvh",
        minWidth: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AnonParticles />
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          zIndex: 2,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 6 },
          maxWidth: 600,
          width: "90%",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(6px)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: 220, md: 280 },
            height: { xs: 220, md: 280 },
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LazyLottie file="401.json" />
        </Box>

        <Stack spacing={2} alignItems="center">
          <Typography
            variant="h1"
            sx={{
              fontSize: "2.3rem",
              fontWeight: 700,
              color: (t) => t.palette.primary.main,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              maxWidth: 420,
              fontSize: "1rem",
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            {message}
          </Typography>

          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            sx={{
              mt: 2,
              borderRadius: "10px",
              px: 3,
              py: 1,
              color: "white",
              boxShadow: "none",
            }}
          >
            {cta}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

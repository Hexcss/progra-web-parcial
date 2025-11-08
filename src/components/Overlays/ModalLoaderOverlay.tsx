import { Box, Typography, useTheme, Fade } from "@mui/material";
import { LazyLottie } from "../Animations/LazyLottie";

interface ModalLoaderOverlayProps {
  open: boolean;
  text?: string;
  blur?: number;
  opacity?: number;
  zIndex?: number;
}

export default function ModalLoaderOverlay({
  open,
  text,
  blur = 4,
  opacity = 0.25,
  zIndex = 5,
}: ModalLoaderOverlayProps) {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex,
          backdropFilter: `blur(${blur}px)`,
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            boxShadow: theme.shadows[4],
            p: 3,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            minWidth: 240,
            maxWidth: 320,
            pointerEvents: "auto",
          }}
        >
          <LazyLottie file="load.json" width={120} height={120} />

          {text && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                mt: 1,
              }}
            >
              {text}
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
}

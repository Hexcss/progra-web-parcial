// src/components/AppLoader.tsx
import { useEffect, useMemo, useRef } from "react";
import { Backdrop, Box, Typography, LinearProgress, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { createPortal } from "react-dom";

type AppLoaderProps = {
  open: boolean;
  message?: string;
  progress?: number; // 0..100 (if provided, shows determinate bar)
  tips?: string[];
  showLogo?: boolean;
  backdropOpacity?: number; // 0..1
};

const DEFAULT_TIPS = [
  "Cargando ofertas de última hora…",
  "Optimizando imágenes para tu dispositivo…",
  "Indexando categorías inteligentes…",
  "Sincronizando tu sesión de invitado…",
  "Ajustando recomendaciones de tecnología…",
];

export default function AppLoader({
  open,
  message = "Cargando…",
  progress,
  tips = DEFAULT_TIPS,
  showLogo = true,
  backdropOpacity = 0.8,
}: AppLoaderProps) {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.body;
  }, []);

  const tip = useMemo(() => tips[Math.floor(Math.random() * tips.length)] ?? "", [tips]);

  if (!containerRef.current) return null;

  return createPortal(
    <Backdrop
      sx={{
        zIndex: (t) => t.zIndex.modal + 10,
        color: theme.palette.text.primary,
        background: `
          radial-gradient(1200px 800px at 20% -10%, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 60%),
          radial-gradient(1000px 700px at 110% 20%, ${alpha(theme.palette.secondary.main, 0.20)} 0%, transparent 60%),
          linear-gradient(${alpha(theme.palette.background.default, backdropOpacity)}, ${alpha(theme.palette.background.default, backdropOpacity)})
        `,
        backdropFilter: "blur(6px)",
      }}
      open={open}
      transitionDuration={250}
    >
      <Box
        role="status"
        aria-live="polite"
        sx={{
          display: "grid",
          gap: 2,
          placeItems: "center",
          px: 3,
          py: 4,
          minWidth: 320,
          maxWidth: 440,
          borderRadius: 3,
          boxShadow: `0 10px 40px ${alpha(theme.palette.common.black, 0.25)}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha("#ffffff", 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        }}
      >
        {showLogo && (
          <Box
            aria-hidden
            sx={{
              display: "grid",
              placeItems: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              position: "relative",
              background: alpha(theme.palette.primary.main, 0.08),
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "conic-gradient(from 0deg, transparent 0 280deg, rgba(0,0,0,0.1) 320deg 360deg)",
                borderRadius: "50%",
                filter: "blur(1px)",
                animation: prefersReducedMotion ? "none" : "spin 1.6s linear infinite",
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                borderWidth: 3,
                borderStyle: "solid",
                borderColor: alpha(theme.palette.primary.main, 0.25),
                borderTopColor: theme.palette.primary.main,
                animation: prefersReducedMotion ? "none" : "spin 0.9s linear infinite",
              }}
            />
          </Box>
        )}

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            {message}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: theme.palette.text.secondary, minHeight: 20 }}
          >
            {tip}
          </Typography>
        </Box>

        {typeof progress === "number" ? (
          <Box sx={{ width: "100%", mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, progress))}
              sx={{
                height: 8,
                borderRadius: 999,
                [`& .MuiLinearProgress-bar`]: {
                  borderRadius: 999,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5, textAlign: "center", color: "text.secondary" }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>
        ) : (
          <LinearProgress
            sx={{
              width: "100%",
              height: 6,
              borderRadius: 999,
              [`& .MuiLinearProgress-bar`]: { borderRadius: 999 },
            }}
          />
        )}

        <Box
          sx={{
            mt: 0.5,
            display: "flex",
            gap: 1,
            alignItems: "center",
            color: "text.disabled",
          }}
        >
          <Dot />
          <Dot delay={0.2} />
          <Dot delay={0.4} />
        </Box>
      </Box>
    </Backdrop>,
    containerRef.current
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <Box
      aria-hidden
      sx={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: alpha(theme.palette.text.primary, 0.35),
        opacity: 0.3,
        animation: prefersReducedMotion ? "none" : "pulse 1.2s ease-in-out infinite",
        animationDelay: `${delay}s`,
        "@keyframes pulse": {
          "0%, 100%": { opacity: 0.3, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.6)" },
        },
      }}
    />
  );
}

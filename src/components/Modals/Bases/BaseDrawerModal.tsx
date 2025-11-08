// src/components/Modals/Bases/BaseDrawerModal.tsx
import {
  Drawer,
  Box,
  Stack,
  Typography,
  Divider,
  Button,
  Backdrop,
  CircularProgress,
  useTheme,
  Fade,
} from "@mui/material";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import ModalLoaderOverlay from "../../Overlays/ModalLoaderOverlay";

interface BaseDrawerModalProps {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  title?: string;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  disableConfirm?: boolean;
  width?: "narrow" | "wide";
}

export default function BaseDrawerModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Guardar",
  cancelText = "Cancelar",
  loading = false,
  disableConfirm = false,
  width = "wide",
}: BaseDrawerModalProps) {
  const theme = useTheme();
  const drawerWidth = width === "wide" ? 780 : 360;

  // Internal "in" state for Slide/Fade so we can force an enter animation on mount.
  const [isOpen, setIsOpen] = useState(false);
  const closingRef = useRef(false);
  const mountedRef = useRef(false);

  // Ensure enter animation runs on initial mount when `open` is true.
  useEffect(() => {
    mountedRef.current = true;
    if (open) {
      closingRef.current = false;
      // Start closed, then open on the next frame to trigger Slide enter.
      setIsOpen(false);
      const id = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(id);
    } else {
      closingRef.current = true;
      setIsOpen(false);
    }
  }, []); // run once

  // Respond to subsequent `open` prop changes.
  useEffect(() => {
    if (!mountedRef.current) return;
    if (open) {
      closingRef.current = false;
      const id = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(id);
    } else {
      closingRef.current = true;
      setIsOpen(false);
    }
  }, [open]);

  const requestClose = () => {
    if (loading) return;
    if (closingRef.current) return;
    closingRef.current = true;
    setIsOpen(false);
  };

  const handleExited = () => {
    onClose?.();
  };

  const handleConfirmClick = async () => {
    if (!onConfirm) return requestClose();
    try {
      const shouldClose = await onConfirm();
      if (shouldClose !== false) requestClose();
    } catch {
      // keep modal open on error
    }
  };

  return (
    <>
      <Backdrop
        open={isOpen}
        transitionDuration={{ appear: 220, enter: 220, exit: 160 }}
        sx={{
          zIndex: theme.zIndex.modal - 1,
          backgroundColor: "rgba(0,0,0,0.28)",
          position: "fixed",
        }}
        onClick={!loading ? requestClose : undefined}
      />

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={!loading ? requestClose : undefined}
        variant="temporary"
        ModalProps={{
          keepMounted: true,
          hideBackdrop: true,
          disablePortal: false,
          disableScrollLock: true,
        }}
        transitionDuration={{ enter: 300, exit: 220 }}
        SlideProps={{ appear: true, onExited: handleExited }}
        sx={{
          zIndex: theme.zIndex.modal,
          position: "fixed",
          "& .MuiDrawer-paper": {
            willChange: "transform, opacity",
          },
        }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            maxWidth: "100vw",
            height: "100dvh",
            borderRadius: 0,
            boxShadow: theme.shadows[10],
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            top: 0,
            right: 0,
            opacity: isOpen ? 1 : 0.98,
            transition: theme.transitions.create("opacity", {
              duration: isOpen ? 240 : 180,
              easing: isOpen
                ? theme.transitions.easing.easeOut
                : theme.transitions.easing.sharp,
            }),
          },
        }}
      >
        <Fade in={isOpen} timeout={{ enter: 240, exit: 160 }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {title && (
              <>
                <Box
                  sx={{
                    px: 3,
                    pt: 3,
                    pb: 1,
                    transform: isOpen ? "translateY(0)" : "translateY(2px)",
                    transition: theme.transitions.create("transform", {
                      duration: 220,
                      easing: theme.transitions.easing.easeOut,
                    }),
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    {title}
                  </Typography>
                </Box>
                <Divider />
              </>
            )}

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 3,
                py: 2,
                position: "relative",
              }}
            >
              {children}

              {loading && (
                <Suspense
                  fallback={
                    <Fade in timeout={200}>
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 2,
                          backdropFilter: "blur(3px)",
                          backgroundColor: "rgba(255,255,255,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={48} />
                        <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
                          Procesando...
                        </Typography>
                      </Box>
                    </Fade>
                  }
                >
                  <ModalLoaderOverlay open={loading} text={"Procesando..."} blur={3} opacity={0.1} zIndex={2} />
                </Suspense>
              )}
            </Box>

            <Divider />

            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} sx={{ px: 3, py: 2 }}>
              <Button onClick={requestClose} color="inherit" disabled={loading}>
                {cancelText}
              </Button>
              {onConfirm && (
                <Button
                  onClick={handleConfirmClick}
                  variant="contained"
                  color="primary"
                  disabled={loading || disableConfirm}
                  sx={{ color: "white" }}
                >
                  {loading ? "Procesando..." : confirmText}
                </Button>
              )}
            </Stack>
          </Box>
        </Fade>
      </Drawer>
    </>
  );
}

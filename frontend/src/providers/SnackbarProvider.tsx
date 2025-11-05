import { useEffect } from "react";
import { Snackbar, Alert, Box, useTheme } from "@mui/material";
import { useSignals } from "@preact/signals-react/runtime";
import { snackbarState, hideSnackbar } from "../signals/snackbar.signal";

const AUTO_HIDE = 8000;

export default function SnackbarProvider() {
  useSignals();
  const theme = useTheme();
  const { open, message, type } = snackbarState.value;

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => hideSnackbar(), AUTO_HIDE);
    return () => clearTimeout(timer);
  }, [open]);

  const handleClose = (_: any, reason?: string) => {
    if (reason === "clickaway") return;
    hideSnackbar();
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={AUTO_HIDE}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      sx={{
        "& .MuiPaper-root": {
          borderRadius: 1.5,
          minWidth: 280,
          py: 0.5,
          boxShadow: theme.shadows[1],
        },
      }}
    >
      <Box>
        <Alert
          onClose={handleClose}
          severity={type}
          sx={{ width: "100%", py: 0.8, px: 2, fontSize: "0.9rem", alignItems: "center" }}
        >
          {message}
        </Alert>
      </Box>
    </Snackbar>
  );
}

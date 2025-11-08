import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Box,  
  Slide,
} from "@mui/material";
import { forwardRef, type ReactElement, useEffect, useRef, useState } from "react";
import type { TransitionProps } from "@mui/material/transitions";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface BaseDialogModalProps {
  open: boolean;
  title: string;
  children: ReactElement | ReactElement[];
  onClose: () => void;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  disableConfirm?: boolean;
  maxWidth?: "sm" | "md" | "lg";
  hideCloseButton?: boolean;
  hideCancel?: boolean;
}

export default function BaseDialogModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Guardar",
  cancelText = "Cancelar",
  loading = false,
  disableConfirm = false,
  maxWidth = "md",
  hideCloseButton = false,
  hideCancel = false,
}: BaseDialogModalProps) {
  const [isOpen, setIsOpen] = useState(open);
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setIsOpen(true);
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
    } catch {}
  };

  const handleClose = (
    _: unknown,
    reason?: "backdropClick" | "escapeKeyDown"
  ) => {
    if (loading) return;
    if (hideCloseButton && reason) return;
    if (reason === "backdropClick") return;
    requestClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth={maxWidth}
      TransitionComponent={Transition}
      TransitionProps={{
        appear: true,
        timeout: 300,
        onExited: handleExited,
      }}
      keepMounted
    >
      <Box sx={{ position: "relative" }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          {!hideCancel && (
            <Button onClick={requestClose} color="inherit" disabled={loading}>
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button
              onClick={handleConfirmClick}
              color="primary"
              disabled={loading || disableConfirm}
            >
              {loading ? "Procesando..." : confirmText}
            </Button>
          )}
        </DialogActions>
        {loading && (
          <LinearProgress
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
            }}
          />
        )}
      </Box>
    </Dialog>
  );
}

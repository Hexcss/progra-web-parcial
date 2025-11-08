import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import BaseDialogModal from "../Bases/BaseDialogModal";
import { useUser, useAuthActions } from "../../../context/UserContext";
import { useUpdateProfileMutation } from "../../../queries/users.queries";
import { closeModal } from "../../../signals/modal.signal";
import { alpha } from "@mui/material/styles";
import { showSnackbar } from "../../../signals/snackbar.signal";
import FileUploadField from "../../Inputs/FileUploadField";
import {
  useUploadFileMutation,
  useDeleteFileByUrlMutation,
  useFilenameFromUrlQuery,
} from "../../../queries/files.queries";
import { Link as RouterLink } from "react-router-dom";

export default function ProfileModal() {
  const user = useUser();
  const { logout, refresh } = useAuthActions();

  const updateMutation = useUpdateProfileMutation();
  const uploadMutation = useUploadFileMutation();
  const deleteMutation = useDeleteFileByUrlMutation();

  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
    setPendingFile(null);
  }, [user]);

  const { data: filenameFromUrl } = useFilenameFromUrlQuery(
    avatarUrl && !pendingFile ? avatarUrl : undefined
  );

  const shownFilename = pendingFile?.name ?? filenameFromUrl?.filename ?? "";

  const dirty = useMemo(() => {
    if (!user) return false;
    const nameChanged = (displayName ?? "") !== (user.displayName ?? "");
    const avatarChanged = Boolean(pendingFile);
    return nameChanged || avatarChanged;
  }, [user, displayName, pendingFile]);

  const isBusy = updateMutation.isPending || uploadMutation.isPending;
  const disableConfirm = !dirty || isBusy;

  const onConfirm = async () => {
    if (!user) return true;

    try {
      let newAvatarUrl = avatarUrl;

      if (pendingFile) {
        const uploaded = await uploadMutation.mutateAsync({
          file: pendingFile,
          folder: "avatars",
        });
        newAvatarUrl = uploaded.url;
      }

      await updateMutation.mutateAsync({
        displayName: displayName?.trim() || undefined,
        avatarUrl: newAvatarUrl?.trim() || undefined,
      });

      if (pendingFile && user.avatarUrl) {
        deleteMutation.mutate({ url: user.avatarUrl });
      }

      setAvatarUrl(newAvatarUrl);
      setPendingFile(null);

      showSnackbar?.("Perfil actualizado correctamente", "success");
      await refresh();
      return true;
    } catch {
      showSnackbar?.("No se pudo actualizar el perfil", "error");
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSnackbar?.("Sesión cerrada correctamente", "success");
      closeModal();
    } catch {
      showSnackbar?.("No se pudo cerrar sesión", "error");
    }
  };

  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
  const updatedAt = user?.updatedAt ? new Date(user.updatedAt) : null;

  if (!user) {
    return (
      <BaseDialogModal
        open
        title="Mi perfil"
        onClose={closeModal}
        hideCancel
        confirmText="Cerrar"
        onConfirm={() => true}
        maxWidth="sm"
      >
        <Box>
          <Typography color="text.secondary">
            Debes iniciar sesión para ver tu perfil.
          </Typography>
          <Divider sx={{ mt: 2 }} />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button onClick={() => closeModal()} variant="contained" color="primary">
              Cerrar
            </Button>
          </Stack>
        </Box>
      </BaseDialogModal>
    );
  }

  const initialLetter = (user.displayName || user.email || "?")
    .slice(0, 1)
    .toUpperCase();

  return (
    <BaseDialogModal
      open
      title="Mi perfil"
      onClose={closeModal}
      onConfirm={onConfirm}
      confirmText="Guardar cambios"
      loading={isBusy}
      disableConfirm={disableConfirm}
      maxWidth="sm"
    >
      <Box>
        <Stack spacing={2.25}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={pendingFile ? undefined : avatarUrl || undefined}
                alt={user.displayName || user.email}
                sx={(theme) => ({
                  width: 56,
                  height: 56,
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  color: theme.palette.warning.dark,
                  fontWeight: 800,
                  fontSize: 18,
                })}
              >
                {initialLetter}
              </Avatar>

              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={700}>
                  {user.displayName || user.email}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    color="warning"
                    label={user.role === "admin" ? "Admin" : "Usuario"}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Stack>
            </Stack>

            <Button
              component={RouterLink}
              to="/market/orders"
              size="small"
              variant="outlined"
              color="warning"
              sx={{ textTransform: "none", borderRadius: "999px" }}
            >
              Mis pedidos
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <TextField
              label="Nombre visible"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
            />

            <FileUploadField
              label="Avatar"
              value={shownFilename}
              onFileChange={(file) => setPendingFile(file)}
              accept="image/*"
              downloadFile={
                avatarUrl && !pendingFile
                  ? () => window.open(avatarUrl, "_blank", "noopener,noreferrer")
                  : undefined
              }
              placeholder="Selecciona una imagen…"
            />
          </Stack>

          <Stack spacing={0.5} sx={{ color: "text.secondary" }}>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email}
            </Typography>
            <Typography variant="body2">
              <strong>ID:</strong> {user._id}
            </Typography>
            {createdAt && (
              <Typography variant="body2">
                <strong>Cuenta creada:</strong> {createdAt.toLocaleString()}
              </Typography>
            )}
            {updatedAt && (
              <Typography variant="body2">
                <strong>Última actualización:</strong> {updatedAt.toLocaleString()}
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              ¿Quieres cerrar tu sesión en este dispositivo?
            </Typography>
            <Button
              onClick={handleLogout}
              color="inherit"
              variant="outlined"
              sx={{ textTransform: "none" }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Stack>
      </Box>
    </BaseDialogModal>
  );
}

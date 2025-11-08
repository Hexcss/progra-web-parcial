// src/components/Modals/Users/UserModal.tsx
import { useMemo } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Avatar,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import BaseDrawerModal from "../Bases/BaseDrawerModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { closeModal } from "../../../signals/modal.signal";
import FileUploadField from "../../Inputs/FileUploadField";
import { useUserForm } from "../../../hooks/Forms/useUserForm";

type Props = ModalPropsMap["user"];

export default function UserModal({ id }: Props) {
  const {
    state,
    setState,
    pendingFile,
    setPendingFile,
    isEdit,
    isBusy,
    canSave,
    createdAt,
    updatedAt,
    initialLetter,
    onConfirm,
  } = useUserForm(id);

  const title = useMemo(() => (isEdit ? "Editar usuario" : "Nuevo usuario"), [isEdit]);

  return (
    <BaseDrawerModal
      open
      title={title}
      onClose={closeModal}
      onConfirm={onConfirm}
      confirmText={isEdit ? "Guardar cambios" : "Crear usuario"}
      disableConfirm={!canSave}
      loading={isBusy}
    >
      <Stack spacing={2.25}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={pendingFile ? undefined : state.avatarUrl || undefined}
            alt={state.displayName || state.email || "Usuario"}
            sx={{ width: 56, height: 56, fontWeight: 800, fontSize: 18 }}
          >
            {initialLetter}
          </Avatar>

          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={700}>
              {state.displayName || state.email || "Usuario"}
            </Typography>
            <Chip size="small" color={state.role === "admin" ? "warning" : "default"} label={state.role} />
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          <TextField
            label="Correo"
            value={state.email}
            onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
            type="email"
            fullWidth
            disabled={isEdit}
          />

          {!isEdit && (
            <TextField
              label="Contraseña"
              value={state.password || ""}
              onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
              type="password"
              fullWidth
              helperText="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          )}

          <TextField
            label="Nombre visible"
            value={state.displayName || ""}
            onChange={(e) => setState((s) => ({ ...s, displayName: e.target.value }))}
            fullWidth
          />

          <TextField
            select
            label="Rol"
            value={state.role}
            onChange={(e) => setState((s) => ({ ...s, role: e.target.value as "user" | "admin" }))}
            fullWidth
          >
            <MenuItem value="user">user</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </TextField>

          <FileUploadField
            label="Avatar"
            value={pendingFile?.name || ""}
            onFileChange={(file) => setPendingFile(file)}
            accept="image/*"
            placeholder="Selecciona una imagen…"
          />
          {state.avatarUrl && !pendingFile && (
            <Box>
              <Button
                size="small"
                variant="text"
                onClick={() => window.open(state.avatarUrl!, "_blank", "noopener,noreferrer")}
              >
                Ver avatar actual
              </Button>
            </Box>
          )}
        </Stack>

        {(createdAt || updatedAt) && (
          <>
            <Divider />
            <Stack spacing={0.5} sx={{ color: "text.secondary" }}>
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
          </>
        )}
      </Stack>
    </BaseDrawerModal>
  );
}

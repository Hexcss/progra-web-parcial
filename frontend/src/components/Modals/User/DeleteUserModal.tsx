// src/components/Modals/Users/DeleteUserModal.tsx
import { useMemo } from "react";
import { Typography } from "@mui/material";
import BaseDialogModal from "../Bases/BaseDialogModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { closeModal } from "../../../signals/modal.signal";
import { useDeleteUser } from "../../../queries/users.queries";
import { showSnackbar } from "../../../signals/snackbar.signal";

type Props = ModalPropsMap["deleteUser"];

export default function DeleteUserModal({ id, email, displayName }: Props) {
  const name = useMemo(() => displayName || email || id, [displayName, email, id]);
  const deleteMutation = useDeleteUser();

  return (
    <BaseDialogModal
      open
      title="Eliminar usuario"
      confirmText="Eliminar"
      cancelText="Cancelar"
      loading={deleteMutation.isPending}
      onClose={closeModal}
      onConfirm={async () => {
        try {
          await deleteMutation.mutateAsync(id);
          showSnackbar("Usuario eliminado correctamente", "success");
          closeModal();
        } catch {
          showSnackbar("No se pudo eliminar el usuario", "error");
        }
        return true;
      }}
    >
      <Typography>
        ¿Seguro que deseas eliminar al usuario <strong>{name}</strong>? Esta acción no se puede deshacer.
      </Typography>
    </BaseDialogModal>
  );
}

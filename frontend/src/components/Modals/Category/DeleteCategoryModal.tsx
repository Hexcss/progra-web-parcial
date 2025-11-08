// src/components/Modals/Category/DeleteCategoryModal.tsx
import { Box, Stack, Typography } from "@mui/material";
import BaseDialogModal from "../Bases/BaseDialogModal";
import { closeModal } from "../../../signals/modal.signal";
import { showSnackbar } from "../../../signals/snackbar.signal";
import { useDeleteCategory } from "../../../queries/categories.queries";

export default function DeleteCategoryModal({ id, name }: { id: string; name?: string }) {
  const mutation = useDeleteCategory();

  const onConfirm = async () => {
    try {
      await mutation.mutateAsync(id);
      showSnackbar?.("Categoría eliminada", "success");
      return true;
    } catch {
      showSnackbar?.("No se pudo eliminar la categoría", "error");
      return false;
    }
  };

  return (
    <BaseDialogModal
      open
      title="Eliminar categoría"
      onClose={closeModal}
      onConfirm={onConfirm}
      confirmText="Eliminar"
      loading={mutation.isPending}
      disableConfirm={mutation.isPending}
    >
      <Box>
        <Stack spacing={1.5}>
          <Typography>
            ¿Seguro que deseas eliminar la categoría {name ? <strong>{name}</strong> : "seleccionada"}?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Esta acción no se puede deshacer.
          </Typography>
        </Stack>
      </Box>
    </BaseDialogModal>
  );
}

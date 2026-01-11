// src/components/Modals/Products/DeleteProductModal.tsx
import { Box, Stack, Typography, Divider } from "@mui/material";
import BaseDialogModal from "../Bases/BaseDialogModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { useDeleteProduct } from "../../../queries/products.queries";
import { showSnackbar } from "../../../signals/snackbar.signal";
import { closeModal } from "../../../signals/modal.signal";

type Props = ModalPropsMap["deleteProduct"];

export default function DeleteProductModal({ id, name }: Props) {
  const deleteMutation = useDeleteProduct();

  const onConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Producto eliminado correctamente", "success");
      return true;
    } catch {
      showSnackbar("No se pudo eliminar el producto", "error");
      return false;
    }
  };

  return (
    <BaseDialogModal
      open
      title="Eliminar producto"
      onClose={closeModal}
      onConfirm={onConfirm}
      confirmText="Eliminar"
      loading={deleteMutation.isPending}
    >
      <Box>
        <Stack spacing={2}>
          <Typography>
            ¿Seguro que deseas eliminar {name ? <strong>{name}</strong> : "este producto"}? Esta acción no se puede deshacer.
          </Typography>
          <Divider />
        </Stack>
      </Box>
    </BaseDialogModal>
  );
}

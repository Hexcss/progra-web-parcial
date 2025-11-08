// src/components/Modals/Category/CategoryModal.tsx
import { Box, Stack, TextField } from "@mui/material";
import { closeModal } from "../../../signals/modal.signal";
import { IconSelector } from "../../Inputs/IconSelector";
import { useCategroyForm } from "../../../hooks/Forms/useCategoryForm";
import BaseDialogModal from "../Bases/BaseDialogModal";

export default function CategoryModal({ id }: { id?: string }) {
    const {
        ready,
        loading,
        mode,
        name,
        icon,
        setName,
        setIcon,
        disableConfirm,
        onConfirm,
    } = useCategroyForm(id);

    return (
        <BaseDialogModal
            open
            title={mode === "edit" ? "Editar categoría" : "Nueva categoría"}
            onClose={closeModal}
            onConfirm={onConfirm}
            confirmText={mode === "edit" ? "Guardar cambios" : "Crear categoría"}
            loading={loading || !ready}
            disableConfirm={disableConfirm || !ready}
        >
            <Box sx={{ py: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        label="Nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                    />
                    <IconSelector
                        label="Icono"
                        value={icon}
                        onChange={setIcon}
                        fullWidth
                        placeholder="Selecciona un icono"
                    />
                </Stack>
            </Box>
        </BaseDialogModal>
    );
}

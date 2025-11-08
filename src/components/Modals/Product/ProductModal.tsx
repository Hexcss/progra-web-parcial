// src/components/Modals/Products/ProductModal.tsx
import { useMemo } from "react";
import {
  Stack,
  Typography,
  Divider,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import BaseDrawerModal from "../Bases/BaseDrawerModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { useProductForm } from "../../../hooks/Forms/useProductForm";
import FileUploadField from "../../Inputs/FileUploadField";
import { closeModal } from "../../../signals/modal.signal";
import { IconFromName } from "../../../utils/functions/icons.function";

type Props = ModalPropsMap["product"];

export default function ProductModal({ id }: Props) {
  const theme = useTheme();
  const {
    mode,
    isBusy,
    canSubmit,
    dirty,
    fields: {
      name,
      setName,
      description,
      setDescription,
      price,
      setPrice,
      stock,
      setStock,
      categoryId,
      setCategoryId,
      imageUrl,
      setImageUrl,
      tagsInput,
      setTagsInput,
      pendingFile,
      setPendingFile,
      shownFilename,
    },
    datasets: { categories, categoriesLoading },
    submit,
  } = useProductForm(id);

  const title = mode === "create" ? "Nuevo producto" : "Editar producto";
  const confirmText = mode === "create" ? "Crear" : "Guardar";
  const disableConfirm = isBusy || !canSubmit || !dirty;

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c._id, name: c.name, icon: c.icon })),
    [categories]
  );

  const selectedCategory = useMemo(
    () => categoryOptions.find((c) => c.id === categoryId) ?? null,
    [categoryOptions, categoryId]
  );

  const onConfirm = async () => {
    const ok = await submit();
    return ok;
  };

  return (
    <BaseDrawerModal
      open
      title={title}
      onClose={closeModal}
      onConfirm={onConfirm}
      confirmText={confirmText}
      disableConfirm={disableConfirm}
      loading={isBusy}
      width="wide"
    >
      <Stack spacing={2.5}>
        <Stack spacing={1.25}>
          <Typography variant="subtitle2" color="text.secondary">Información básica</Typography>
          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>

        <Divider />

        <Stack spacing={1.25} direction={{ xs: "column", sm: "row" }}>
          <TextField
            type="number"
            label="Precio (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
            fullWidth
          />
          <TextField
            type="number"
            label="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputProps={{ min: 0, step: "1" }}
            fullWidth
          />
        </Stack>

        <Stack spacing={1.25}>
          <Autocomplete
            loading={categoriesLoading}
            options={categoryOptions}
            getOptionLabel={(o) => o.name}
            value={selectedCategory}
            onChange={(_e, v) => setCategoryId(v?.id ?? "")}
            renderInput={(params) => <TextField {...params} label="Categoría" />}
            renderOption={(props, option) => (
              <li {...props}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 26,
                      height: 26,
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.primary,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <IconFromName icon={option.icon} />
                  </Avatar>
                  <Typography>{option.name}</Typography>
                </Stack>
              </li>
            )}
            fullWidth
          />
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" color="text.secondary">Imagen</Typography>
          <FileUploadField
            label="Imagen del producto"
            value={shownFilename}
            onFileChange={(file) => setPendingFile(file)}
            accept="image/*"
            placeholder="Selecciona una imagen…"
            downloadFile={
              imageUrl && !pendingFile
                ? () => window.open(imageUrl, "_blank", "noopener,noreferrer")
                : undefined
            }
          />
          <TextField
            label="URL de imagen (opcional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            fullWidth
          />
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" color="text.secondary">Etiquetas</Typography>
          <TextField
            label="Tags (separadas por comas)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            fullWidth
            helperText="Ejemplo: gaming, oferta, portátil"
          />
          {tagsInput.trim().length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tagsInput
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 12)
                .map((t) => (
                  <Chip key={t} label={t} size="small" />
                ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </BaseDrawerModal>
  );
}

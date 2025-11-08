// src/components/Modals/Products/ProductDiscountsModal.tsx
import {
    Box,
    Stack,
    TextField,
    Typography,
    IconButton,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import BaseDrawerModal from "../Bases/BaseDrawerModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { closeModal } from "../../../signals/modal.signal";
import { useProductDiscounts } from "../../../hooks/Forms/useProductDiscounts";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";

type Props = ModalPropsMap["productDiscounts"];

function toDayjs(v?: string | null): Dayjs | null {
    if (!v) return null;
    const d = dayjs(v);
    return d.isValid() ? d : null;
}
function toIso(v: Dayjs | null): string {
    return v && v.isValid() ? v.toDate().toISOString() : "";
}
function clampPercent(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

export default function ProductDiscountsModal({ productId, productName }: Props) {
    const {
        page,
        limit,
        setPage,
        setLimit,
        items,
        total,
        isLoading,
        isBusy,

        createForm,
        setCreateForm,
        canCreate,
        submitCreate,

        editingId,
        editForm,
        setEditForm,
        canEdit,
        startEdit,
        cancelEdit,
        submitEdit,
        remove,
    } = useProductDiscounts(productId);

    return (
        <BaseDrawerModal
            open
            title={productName ? `Descuentos: ${productName}` : "Descuentos del producto"}
            onClose={closeModal}
            onConfirm={async () => true}
            confirmText="Cerrar"
            loading={isBusy && isLoading}
            disableConfirm={false}
            width="wide"
        >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={3}>
                    <Stack spacing={2} flexDirection="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>
                            Crear nuevo descuento
                        </Typography>

                        <Button
                            variant="text"
                            startIcon={<AddIcon />}
                            disabled={!canCreate || isBusy}
                            onClick={submitCreate}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            Añadir
                        </Button>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                        <TextField
                            label="Porcentaje"
                            type="number"
                            value={createForm.discountPercent}
                            onChange={(e) =>
                                setCreateForm((s) => ({
                                    ...s,
                                    discountPercent: String(clampPercent(parseFloat(e.target.value))),
                                }))
                            }
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: { xs: "100%", sm: 160 } }}
                        />

                        <DateTimePicker
                            label="Inicio"
                            value={toDayjs(createForm.startDate)}
                            onChange={(v) => setCreateForm((s) => ({ ...s, startDate: toIso(v) }))}
                            slotProps={{ textField: { sx: { width: { xs: "100%", sm: 260 } }, size: "small" } }}
                        />

                        <DateTimePicker
                            label="Fin"
                            value={toDayjs(createForm.endDate)}
                            onChange={(v) => setCreateForm((s) => ({ ...s, endDate: toIso(v) }))}
                            slotProps={{ textField: { sx: { width: { xs: "100%", sm: 260 } }, size: "small" } }}
                        />
                    </Stack>

                    <Divider />

                    <Box sx={{ width: "100%", overflow: "auto" }}>
                        <Table size="small" sx={{ minWidth: 720 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Porcentaje</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Fin</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, width: 140 }}>
                                        Acciones
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((d) => {
                                    const editing = editingId === d._id;
                                    return (
                                        <TableRow key={d._id} hover>
                                            <TableCell>
                                                {editing ? (
                                                    <TextField
                                                        type="number"
                                                        value={editForm.discountPercent}
                                                        onChange={(e) =>
                                                            setEditForm((s) => ({
                                                                ...s,
                                                                discountPercent: String(clampPercent(parseFloat(e.target.value))),
                                                            }))
                                                        }
                                                        inputProps={{ min: 0, max: 100 }}
                                                        size="small"
                                                        sx={{ width: 120 }}
                                                    />
                                                ) : (
                                                    `${d.discountPercent}%`
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editing ? (
                                                    <DateTimePicker
                                                        value={toDayjs(editForm.startDate)}
                                                        onChange={(v) => setEditForm((s) => ({ ...s, startDate: toIso(v) }))}
                                                        slotProps={{ textField: { size: "small" } }}
                                                    />
                                                ) : (
                                                    new Date(d.startDate).toLocaleString()
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editing ? (
                                                    <DateTimePicker
                                                        value={toDayjs(editForm.endDate)}
                                                        onChange={(v) => setEditForm((s) => ({ ...s, endDate: toIso(v) }))}
                                                        slotProps={{ textField: { size: "small" } }}
                                                    />
                                                ) : (
                                                    new Date(d.endDate).toLocaleString()
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editing ? (
                                                    <>
                                                        <IconButton aria-label="Guardar" onClick={submitEdit} disabled={!canEdit || isBusy}>
                                                            <SaveIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton aria-label="Cancelar" onClick={cancelEdit} disabled={isBusy}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton aria-label="Editar" onClick={() => startEdit(d)} disabled={isBusy}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton aria-label="Eliminar" onClick={() => remove(d._id)} disabled={isBusy}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Typography color="text.secondary">No hay descuentos.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    <TablePagination
                        component="div"
                        count={total}
                        page={page - 1}
                        onPageChange={(_e, p) => setPage(p + 1)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(e) => {
                            const v = Number(e.target.value) || 10;
                            setLimit(v);
                            setPage(1);
                        }}
                        labelRowsPerPage="Filas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </Stack>
            </LocalizationProvider>
        </BaseDrawerModal>
    );
}

// src/components/Modals/Orders/OrderModal.tsx
import { useMemo, useState } from "react";
import {
    Box,
    Stack,
    Typography,
    Divider,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Chip,
} from "@mui/material";
import BaseDialogModal from "../../Modals/Bases/BaseDialogModal";
import { closeModal } from "../../../signals/modal.signal";
import { useOrderByIdQuery, useUpdateOrderStatusMutation } from "../../../queries/orders.queries";

type Props = {
    orderId: string;
    currentStatus: string;
};

const STATUS_OPTIONS = [
    { value: "created", label: "Creado" },
    { value: "processing", label: "Procesando" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregado" },
    { value: "cancelled", label: "Cancelado" },
];

function statusColor(status: string): "default" | "primary" | "success" | "warning" | "info" | "error" {
    const s = (status ?? "").toLowerCase();
    if (s === "delivered") return "success";
    if (s === "shipped") return "info";
    if (s === "processing") return "warning";
    if (s === "cancelled" || s === "canceled") return "error";
    if (s === "created") return "primary";
    return "default";
}

export default function OrderModal({ orderId, currentStatus }: Props) {
    const { data } = useOrderByIdQuery(orderId);
    const [status, setStatus] = useState<string>(currentStatus);
    const mutation = useUpdateOrderStatusMutation(orderId);

    const orderTitle = useMemo(
        () => (orderId ? `#${orderId.slice(-6).toUpperCase()}` : ""),
        [orderId]
    );

    const selectedLabel = useMemo(
        () => STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status,
        [status]
    );

    const disableConfirm = mutation.isPending || !status || status === currentStatus;

    const onConfirm = async () => {
        try {
            await mutation.mutateAsync({ status });
            closeModal();
            return true;
        } catch {
            return false;
        }
    };

    return (
        <BaseDialogModal
            open
            title={`Actualizar estado ${orderTitle}`}
            onClose={closeModal}
            onConfirm={onConfirm}
            confirmText={mutation.isPending ? "Guardando..." : "Guardar"}
            disableConfirm={disableConfirm}
            loading={mutation.isPending}
        >
            <Box>
                <Stack spacing={2}>
                    <Typography color="text.secondary">
                        Selecciona el nuevo estado para este pedido.
                    </Typography>

                    <FormControl fullWidth>
                        <InputLabel id="status-label">Estado</InputLabel>
                        <Select
                            labelId="status-label"
                            value={status}
                            label="Estado"
                            onChange={(e) => setStatus(String(e.target.value))}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip
                                            size="small"
                                            label={opt.label}
                                            color={statusColor(opt.value)}
                                            variant="outlined"
                                            sx={{ fontWeight: 700, textTransform: "none" }}
                                        />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider />

                    <Stack spacing={0.5}>
                        <Typography variant="body2">
                            <strong>Pedido:</strong> {orderTitle}
                        </Typography>
                        {data?.email && (
                            <Typography variant="body2" color="text.secondary">
                                <strong>Email:</strong> {data.email}
                            </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            <strong>Estado actual:</strong> {selectedLabel}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </BaseDialogModal>
    );
}

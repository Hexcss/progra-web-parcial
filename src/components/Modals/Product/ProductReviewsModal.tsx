// src/components/Modals/Product/ProductReviewsModal.tsx
import {
  Avatar,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import BaseDrawerModal from "../Bases/BaseDrawerModal";
import type { ModalPropsMap } from "../../../utils/types/modal.type";
import { closeModal } from "../../../signals/modal.signal";
import { useProductReviews } from "../../../hooks/Forms/useProductReviews";

type Props = ModalPropsMap["productReviews"];

export default function ProductReviewsModal({ productId, productName }: Props) {
  const { page, limit, setPage, setLimit, items, total, isLoading, isBusy } = useProductReviews(productId);

  return (
    <BaseDrawerModal
      open
      title={productName ? `Reseñas: ${productName}` : "Reseñas del producto"}
      onClose={closeModal}
      onConfirm={async () => true}
      confirmText="Cerrar"
      loading={isBusy && isLoading}
      disableConfirm={false}
      width="wide"
    >
      <Stack spacing={2} sx={{ minHeight: 0, height: "100%", display: "flex" }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Historial de reseñas
        </Typography>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <List disablePadding>
              {items.map((r) => {
                const name = r.user?.displayName || r.user?.email || r.user?._id || "Usuario";
                const letter = (name || "?").slice(0, 1).toUpperCase();
                const dateStr = new Date(r.createdAt).toLocaleString();
                return (
                  <ListItem key={r._id} alignItems="flex-start" sx={{ px: 0, py: 1.25 }}>
                    <ListItemAvatar>
                      <Avatar src={r.user?.avatarUrl} sx={{ width: 36, height: 36, fontSize: 14 }}>
                        {letter}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
                          <Typography variant="body1" fontWeight={600} sx={{ mr: 0.5 }}>
                            {name}
                          </Typography>
                          <Rating value={r.score} precision={0.5} readOnly size="small" />
                          <Chip size="small" label={`${r.score} / 5`} />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                            {dateStr}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                          {r.comment || "—"}
                        </Typography>
                      }
                      primaryTypographyProps={{ component: "div" }}
                      secondaryTypographyProps={{ component: "div" }}
                      sx={{ mr: 1 }}
                    />
                  </ListItem>
                );
              })}

              {!isLoading && items.length === 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={<Typography color="text.secondary">No hay reseñas.</Typography>}
                    primaryTypographyProps={{ component: "div" }}
                  />
                </ListItem>
              )}
            </List>
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
            sx={{ px: 0 }}
          />
        </Box>
      </Stack>
    </BaseDrawerModal>
  );
}

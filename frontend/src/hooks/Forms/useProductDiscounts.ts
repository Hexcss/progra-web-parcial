// src/hooks/Forms/useProductDiscounts.ts
import { useCallback, useMemo, useState } from "react";
import { useDiscountsQuery, useCreateDiscount, useUpdateDiscount, useDeleteDiscount } from "../../queries/discounts.queries";
import type { Discount } from "../../schemas/market.schemas";
import { showSnackbar } from "../../signals/snackbar.signal";

type CreateForm = {
  discountPercent: string;
  startDate: string;
  endDate: string;
};

type EditForm = {
  discountPercent: string;
  startDate: string;
  endDate: string;
};

function isValidISO(s?: string) {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.valueOf());
}

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function useProductDiscounts(productId?: string) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const params = useMemo(
    () =>
      ({
        productId,
        page,
        limit,
      } as any),
    [productId, page, limit]
  );

  const { data, isLoading, isFetching, refetch } = useDiscountsQuery(params);

  const items = useMemo<Discount[]>(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const [createForm, setCreateForm] = useState<CreateForm>({
    discountPercent: "",
    startDate: "",
    endDate: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    discountPercent: "",
    startDate: "",
    endDate: "",
  });

  const createMutation = useCreateDiscount(productId);
  const updateMutation = useUpdateDiscount(editingId || "", productId);
  const deleteMutation = useDeleteDiscount(productId);

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const canCreate = useMemo(() => {
    const pct = clampPercent(parseFloat(createForm.discountPercent));
    if (!productId) return false;
    if (!Number.isFinite(pct)) return false;
    if (!isValidISO(createForm.startDate) || !isValidISO(createForm.endDate)) return false;
    return new Date(createForm.startDate) < new Date(createForm.endDate);
  }, [productId, createForm.discountPercent, createForm.startDate, createForm.endDate]);

  const submitCreate = useCallback(async () => {
    if (!canCreate || !productId) return;
    try {
      await createMutation.mutateAsync({
        productId,
        discountPercent: clampPercent(parseFloat(createForm.discountPercent)),
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
      });
      showSnackbar("Descuento creado", "success");
      setCreateForm({ discountPercent: "", startDate: "", endDate: "" });
      setPage(1);
      await refetch();
    } catch {
      showSnackbar("No se pudo crear el descuento", "error");
    }
  }, [canCreate, productId, createForm.discountPercent, createForm.startDate, createForm.endDate, createMutation, refetch]);

  const startEdit = useCallback((d: Discount) => {
    setEditingId(d._id as string);
    setEditForm({
      discountPercent: String(d.discountPercent),
      startDate: new Date(d.startDate).toISOString(),
      endDate: new Date(d.endDate).toISOString(),
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const canEdit = useMemo(() => {
    if (!editingId) return false;
    const pct = clampPercent(parseFloat(editForm.discountPercent));
    if (!Number.isFinite(pct)) return false;
    if (!isValidISO(editForm.startDate) || !isValidISO(editForm.endDate)) return false;
    return new Date(editForm.startDate) < new Date(editForm.endDate);
  }, [editingId, editForm.discountPercent, editForm.startDate, editForm.endDate]);

  const submitEdit = useCallback(async () => {
    if (!editingId || !canEdit) return;
    try {
      await updateMutation.mutateAsync({
        discountPercent: clampPercent(parseFloat(editForm.discountPercent)),
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: new Date(editForm.endDate).toISOString(),
      });
      showSnackbar("Descuento actualizado", "success");
      setEditingId(null);
      await refetch();
    } catch {
      showSnackbar("No se pudo actualizar el descuento", "error");
    }
  }, [editingId, canEdit, editForm.discountPercent, editForm.startDate, editForm.endDate, updateMutation, refetch]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        showSnackbar("Descuento eliminado", "success");
        const nextCount = (items?.length ?? 0) - 1;
        if (nextCount <= 0 && page > 1) setPage((p) => Math.max(1, p - 1));
        await refetch();
      } catch {
        showSnackbar("No se pudo eliminar el descuento", "error");
      }
    },
    [deleteMutation, items?.length, page, refetch]
  );

  return {
    page,
    limit,
    setPage,
    setLimit,
    items,
    total,
    isLoading,
    isBusy: isBusy || isFetching,

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
  };
}

// src/hooks/Forms/useProductForm.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProductQuery, useCreateProduct, useUpdateProduct } from "../../queries/products.queries";
import { useCategoriesQuery } from "../../queries/categories.queries";
import { useUploadFileMutation, useFilenameFromUrlQuery } from "../../queries/files.queries";
import type { CreateProductPayload, UpdateProductPayload, ProductDetail } from "../../schemas/market.schemas";
import { showSnackbar } from "../../signals/snackbar.signal";

export type ProductFormMode = "create" | "edit";

export function useProductForm(id?: string) {
  const mode: ProductFormMode = id ? "edit" : "create";

  const productQ = useProductQuery(id);
  const categoriesQ = useCategoriesQuery();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(id ?? "");

  const uploadMutation = useUploadFileMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("0");
  const [stock, setStock] = useState<string>("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const loaded: ProductDetail | undefined = productQ.data;

  useEffect(() => {
    if (mode === "edit" && loaded) {
      setName(loaded.name || "");
      setDescription(loaded.description || "");
      setPrice(String(loaded.price ?? 0));
      setStock(String(loaded.stock ?? 0));
      setCategoryId(loaded.categoryId || loaded.category || "");
      setImageUrl(loaded.imageUrl || "");
      setTagsInput(Array.isArray(loaded.tags) ? loaded.tags.join(", ") : "");
      setPendingFile(null);
    }
  }, [mode, loaded]);

  const { data: filenameFromUrl } = useFilenameFromUrlQuery(imageUrl && !pendingFile ? imageUrl : undefined);
  const shownFilename = pendingFile?.name ?? filenameFromUrl?.filename ?? "";

  const categories = categoriesQ.data ?? [];
  const isLoadingInitial = mode === "edit" ? productQ.isPending : false;

  const dirty = useMemo(() => {
    if (mode === "create") {
      return Boolean(name.trim()) || Boolean(description.trim()) || Number(price) > 0 || Number(stock) > 0 || Boolean(categoryId) || Boolean(pendingFile) || Boolean(imageUrl) || Boolean(tagsInput.trim());
    }
    if (!loaded) return false;
    const tagsChanged = (() => {
      const prev = Array.isArray(loaded.tags) ? loaded.tags.join(", ") : "";
      return prev !== tagsInput;
    })();
    return (
      name !== (loaded.name || "") ||
      (description || "") !== (loaded.description || "") ||
      Number(price) !== Number(loaded.price || 0) ||
      Number(stock) !== Number(loaded.stock || 0) ||
      (categoryId || "") !== (loaded.categoryId || loaded.category || "") ||
      Boolean(pendingFile) ||
      (imageUrl || "") !== (loaded.imageUrl || "") ||
      tagsChanged
    );
  }, [mode, loaded, name, description, price, stock, categoryId, pendingFile, imageUrl, tagsInput]);

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending ||
    isLoadingInitial;

  const canSubmit = useMemo(() => {
    const priceOk = Number.isFinite(Number(price)) && Number(price) >= 0;
    const stockOk = Number.isFinite(Number(stock)) && Number(stock) >= 0 && Number.isInteger(Number(stock));
    const nameOk = name.trim().length > 0;
    return nameOk && priceOk && stockOk && !isBusy;
  }, [name, price, stock, isBusy]);

  const parseTags = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

  const submit = useCallback(async () => {
    try {
      let finalImageUrl = imageUrl?.trim() || "";
      if (pendingFile) {
        const uploaded = await uploadMutation.mutateAsync({ file: pendingFile, folder: "products" });
        finalImageUrl = uploaded.url;
      }

      const basePayload = {
        name: name.trim(),
        description: description?.trim() || undefined,
        price: Number(price),
        stock: Number(stock),
        imageUrl: finalImageUrl || undefined,
        categoryId: categoryId || undefined,
        tags: parseTags(tagsInput),
      };

      if (mode === "create") {
        await createMutation.mutateAsync(basePayload as CreateProductPayload);
        showSnackbar("Producto creado correctamente", "success");
      } else {
        await updateMutation.mutateAsync(basePayload as UpdateProductPayload);
        showSnackbar("Producto actualizado correctamente", "success");
      }

      return true;
    } catch {
      showSnackbar("No se pudo guardar el producto", "error");
      return false;
    }
  }, [mode, name, description, price, stock, imageUrl, categoryId, tagsInput, pendingFile, uploadMutation, createMutation, updateMutation]);

  return {
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
    datasets: {
      categories,
      categoriesLoading: categoriesQ.isPending,
    },
    submit,
  };
}

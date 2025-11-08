import { useCallback, useEffect, useMemo, useState } from "react";
import { useCategoryQuery, useCreateCategory, useUpdateCategory } from "../../queries/categories.queries";
import { showSnackbar } from "../../signals/snackbar.signal";

export function useCategroyForm(id?: string) {
  const mode: "create" | "edit" = id ? "edit" : "create";
  const q = useCategoryQuery(id);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(id || "");

  const [name, setName] = useState<string>("");
  const [icon, setIcon] = useState<string>("");

  useEffect(() => {
    if (mode === "edit" && q.data) {
      setName(q.data.name || "");
      setIcon(q.data.icon || "");
    }
  }, [mode, q.data]);

  const initial = useMemo(() => {
    if (mode === "edit" && q.data) return { name: q.data.name || "", icon: q.data.icon || "" };
    return { name: "", icon: "" };
  }, [mode, q.data]);

  const dirty = useMemo(() => {
    if (mode === "create") return Boolean(name.trim()) && Boolean(icon.trim());
    return name.trim() !== initial.name.trim() || icon.trim() !== initial.icon.trim();
  }, [mode, name, icon, initial]);

  const loading = createMutation.isPending || updateMutation.isPending || q.isFetching;
  const ready = mode === "create" ? true : !q.isPending && !q.isFetching;
  const disableConfirm = mode === "create"
    ? !(name.trim() && icon.trim()) || loading
    : (!dirty || !(name.trim() && icon.trim()) || loading);

  const onConfirm = useCallback(async () => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({ name: name.trim(), icon: icon.trim() });
        showSnackbar?.("Categoría creada correctamente", "success");
        return true;
      } else {
        const payload: Record<string, string> = {};
        if (name.trim() !== initial.name.trim()) payload.name = name.trim();
        if (icon.trim() !== initial.icon.trim()) payload.icon = icon.trim();
        if (Object.keys(payload).length === 0) return true;
        await updateMutation.mutateAsync(payload as any);
        showSnackbar?.("Cambios guardados", "success");
        return true;
      }
    } catch {
      showSnackbar?.("No se pudieron guardar los cambios", "error");
      return false;
    }
  }, [mode, name, icon, initial, createMutation, updateMutation]);

  return { mode, ready, loading, name, icon, setName, setIcon, dirty, disableConfirm, onConfirm };
}

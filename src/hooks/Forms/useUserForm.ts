// src/hooks/Forms/useUserForm.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { useUserQuery, useCreateUser, useUpdateUser, usersKey } from "../../queries/users.queries";
import { useUploadFileMutation, useDeleteFileByUrlMutation } from "../../queries/files.queries";
import { useQueryClient } from "@tanstack/react-query";
import { showSnackbar } from "../../signals/snackbar.signal";
import { closeModal } from "../../signals/modal.signal";

type Role = "user" | "admin";

type FormState = {
  email: string;
  displayName?: string;
  role: Role;
  avatarUrl?: string;
  password?: string;
};

type CreateUserInput = {
  email: string;
  displayName?: string;
  role: Role;
  avatarUrl?: string;
  password: string;
};

type UpdateUserInput = Partial<Omit<CreateUserInput, "email">> & { password?: string };

export function useUserForm(id?: string) {
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const { data: fetched } = useUserQuery(isEdit ? id : undefined);

  const [state, setState] = useState<FormState>({
    email: "",
    displayName: "",
    role: "user",
    avatarUrl: "",
    password: "",
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isEdit || !fetched) return;
    setState({
      email: fetched.email,
      displayName: fetched.displayName ?? "",
      role: fetched.role,
      avatarUrl: fetched.avatarUrl,
      password: "",
    });
    setPendingFile(null);
  }, [isEdit, fetched]);

  const uploadMutation = useUploadFileMutation();
  const deleteFileMutation = useDeleteFileByUrlMutation();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(id || "");

  const isBusy =
    uploadMutation.isPending ||
    deleteFileMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending;

  const canSave = useMemo(() => {
    if (isBusy) return false;
    if (!state.email?.trim()) return false;
    if (!state.role) return false;
    if (!isEdit) {
      const pwd = state.password ?? "";
      if (pwd.length < 6) return false;
    }
    return true;
  }, [isBusy, state.email, state.role, state.password, isEdit]);

  const onConfirm = useCallback(async () => {
    try {
      let avatarUrl = state.avatarUrl || "";
      const prevAvatar = fetched?.avatarUrl;

      if (pendingFile) {
        const uploaded = await uploadMutation.mutateAsync({ file: pendingFile, folder: "avatars" });
        avatarUrl = uploaded.url;
      }

      if (isEdit) {
        const payload: UpdateUserInput = {
          displayName: state.displayName?.trim() || undefined,
          role: state.role,
          avatarUrl: avatarUrl || undefined,
        };
        await updateMutation.mutateAsync(payload);
        if (pendingFile && prevAvatar) deleteFileMutation.mutate({ url: prevAvatar });
        showSnackbar("Usuario actualizado correctamente", "success");
        qc.invalidateQueries({ queryKey: usersKey.byId(id!) });
        qc.invalidateQueries({ queryKey: usersKey.root });
      } else {
        const payload: CreateUserInput = {
          email: state.email.trim(),
          displayName: state.displayName?.trim() || undefined,
          role: state.role,
          avatarUrl: avatarUrl || undefined,
          password: (state.password || "").trim(),
        };
        await createMutation.mutateAsync(payload);
        showSnackbar("Usuario creado correctamente", "success");
        qc.invalidateQueries({ queryKey: usersKey.root });
      }

      closeModal();
      return true;
    } catch {
      showSnackbar(isEdit ? "No se pudo actualizar el usuario" : "No se pudo crear el usuario", "error");
      return false;
    }
  }, [
    isEdit,
    state.email,
    state.displayName,
    state.role,
    state.avatarUrl,
    state.password,
    pendingFile,
    fetched?.avatarUrl,
    uploadMutation,
    deleteFileMutation,
    createMutation,
    updateMutation,
    qc,
    id,
  ]);

  const createdAt = fetched?.createdAt ? new Date(fetched.createdAt) : null;
  const updatedAt = fetched?.updatedAt ? new Date(fetched.updatedAt) : null;

  const initialLetter = useMemo(
    () => (state.displayName || state.email || "?").slice(0, 1).toUpperCase(),
    [state.displayName, state.email]
  );

  return {
    state,
    setState,
    pendingFile,
    setPendingFile,
    isEdit,
    isBusy,
    canSave,
    createdAt,
    updatedAt,
    initialLetter,
    onConfirm,
  };
}

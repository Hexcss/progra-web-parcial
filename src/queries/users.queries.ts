// src/queries/users.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersAPI, type UpdateProfileInput, type UserListParams, type PaginatedUsers } from "../backend/apis/users.api";
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function";
import type { User } from "../schemas/auth.schemas";

export const usersKey = {
  root: ["users"] as const,
  profile: () => [...usersKey.root, "profile"] as const,
  list: (params: UserListParams = {}) => [...usersKey.root, "list", params] as const,
  byId: (id: string) => [...usersKey.root, id] as const,
};

export function useProfileQuery(enabled = true) {
  return useQuery<User | null>({
    queryKey: usersKey.profile(),
    queryFn: async () => unwrapApiCall(await UsersAPI.getProfile()),
    enabled,
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation<User, Error, UpdateProfileInput>({
    mutationFn: async (input) => unwrapApiCall(await UsersAPI.updateProfile(input)),
    onSuccess: (updatedUser) => {
      qc.setQueryData<User | null>(usersKey.profile(), updatedUser);
      qc.invalidateQueries({ queryKey: usersKey.root });
    },
  });
}

export function useUsersQuery(params: UserListParams = {}) {
  return useQuery<PaginatedUsers>({
    queryKey: usersKey.list(params),
    queryFn: async () => unwrapApiCall(await UsersAPI.list(params)),
  });
}

export function useUserQuery(id?: string) {
  return useQuery<User | null>({
    queryKey: id ? usersKey.byId(id) : usersKey.byId(""),
    queryFn: async () => unwrapApiCall(await UsersAPI.getById(id!)),
    enabled: !!id,
  });
}

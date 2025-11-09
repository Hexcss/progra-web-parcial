import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthAPI, type RegisterInput, type LoginInput, type OAuthIntent } from "../backend/apis/auth.api";
import { unwrapApiCall } from "../utils/functions/unwrap-api-call.function";
import type { Session, User } from "../schemas/auth.schemas";

export const authKey = {
  root: ["auth"] as const,
  session: () => [...authKey.root, "session"] as const,
};

export function useSessionQuery() {
  return useQuery<Session>({
    queryKey: authKey.session(),
    queryFn: async () => unwrapApiCall(await AuthAPI.getSession()),
    retry: 1,
    staleTime: Infinity,
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation<User, Error, RegisterInput>({
    mutationFn: async (input) => unwrapApiCall(await AuthAPI.register(input)).user,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKey.session() });
      qc.invalidateQueries({ queryKey: ["users", "profile"] });
    },
  });
}

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation<User, Error, LoginInput>({
    mutationFn: async (input) => unwrapApiCall(await AuthAPI.login(input)).user,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKey.session() });
      qc.invalidateQueries({ queryKey: ["users", "profile"] });
    },
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => unwrapApiCall(await AuthAPI.logout()),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function startGoogleOAuth(intent: OAuthIntent = "login", redirect?: string) {
  AuthAPI.startGoogleOAuth(intent, redirect);
}

export function startGithubOAuth(intent: OAuthIntent = "login", redirect?: string) {
  AuthAPI.startGithubOAuth(intent, redirect);
}

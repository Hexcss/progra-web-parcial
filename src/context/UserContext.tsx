// src/context/UserContext.tsx
import { createContext, useContext, useMemo, useCallback } from "react";
import { useSessionQuery, useLoginMutation, useLogoutMutation } from "../queries/auth.queries";
import { useProfileQuery, usersKey } from "../queries/users.queries";
import type { Session, User } from "../schemas/auth.schemas";
import type { LoginInput } from "../backend/apis/auth.api";
import { useQueryClient } from "@tanstack/react-query";

type AuthStatus = "checking" | "authenticated" | "guest";

interface UserContextValue {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  ready: boolean;
  refresh: () => void;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  setPostLoginRedirect: (path: string) => void;
  getPostLoginRedirect: () => string | null;
  clearPostLoginRedirect: () => void;
}

const POST_LOGIN_REDIRECT = "postLoginRedirect";
const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const sessionQ = useSessionQuery();

  const status: AuthStatus = useMemo(() => {
    if (sessionQ.isPending) return "checking";
    if (sessionQ.isError) return "guest";
    return sessionQ.data ? "authenticated" : "guest";
  }, [sessionQ.isPending, sessionQ.isError, sessionQ.data]);

  const profileQ = useProfileQuery(status === "authenticated");

  const ready = useMemo(() => {
    if (status === "checking") return false;
    if (status === "guest") return true;
    return profileQ.status !== "pending";
  }, [status, profileQ.status]);

  const user: User | null = useMemo(() => {
    if (status !== "authenticated") return null;
    return profileQ.data ?? null;
  }, [status, profileQ.data]);

  const session: Session | null = useMemo(() => sessionQ.data ?? null, [sessionQ.data]);

  const refresh = useCallback(() => {
    sessionQ.refetch();
    qc.invalidateQueries({ queryKey: usersKey.profile() });
    qc.refetchQueries({ queryKey: usersKey.profile() });
  }, [sessionQ, qc]);

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const login = useCallback(
    async (input: LoginInput) => {
      const u = await loginMutation.mutateAsync(input);
      await sessionQ.refetch();
      await qc.invalidateQueries({ queryKey: usersKey.profile() });
      await qc.refetchQueries({ queryKey: usersKey.profile() });
      return u;
    },
    [loginMutation, sessionQ, qc]
  );

  const logout = useCallback(() => {
    logoutMutation.mutate(void 0, {
      onSuccess: () => {
        qc.removeQueries({ queryKey: ["auth"] });
        qc.removeQueries({ queryKey: usersKey.root });
      },
    });
  }, [logoutMutation, qc]);

  const setPostLoginRedirect = useCallback((path: string) => {
    try { localStorage.setItem(POST_LOGIN_REDIRECT, path); } catch {}
  }, []);
  const getPostLoginRedirect = useCallback(() => {
    try { return localStorage.getItem(POST_LOGIN_REDIRECT); } catch { return null; }
  }, []);
  const clearPostLoginRedirect = useCallback(() => {
    try { localStorage.removeItem(POST_LOGIN_REDIRECT); } catch {}
  }, []);

  const value: UserContextValue = useMemo(
    () => ({
      user,
      session,
      status,
      ready,
      refresh,
      login,
      logout,
      setPostLoginRedirect,
      getPostLoginRedirect,
      clearPostLoginRedirect,
    }),
    [user, session, status, ready, refresh, login, logout, setPostLoginRedirect, getPostLoginRedirect, clearPostLoginRedirect]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx.user;
}
export function useSession() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useSession must be used within a UserProvider");
  return ctx.session;
}
export function useAuthStatus() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useAuthStatus must be used within a UserProvider");
  return { status: ctx.status, ready: ctx.ready };
}
export function useAuthActions() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useAuthActions must be used within a UserProvider");
  return {
    refresh: ctx.refresh,
    login: ctx.login,
    logout: ctx.logout,
    setPostLoginRedirect: ctx.setPostLoginRedirect,
    getPostLoginRedirect: ctx.getPostLoginRedirect,
    clearPostLoginRedirect: ctx.clearPostLoginRedirect,
  };
}

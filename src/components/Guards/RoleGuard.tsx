// src/components/Guards/RoleGuard.tsx
import React from "react";
import { useAuthStatus, useSession, useUser } from "../../context/UserContext";

type Role = "user" | "admin";

type Props = {
  children: React.ReactNode;
  minRole?: Role;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
};

const rank: Record<Role, number> = { user: 1, admin: 2 };

export const RoleGuard: React.FC<Props> = ({
  children,
  minRole = "user",
  requireAuth = true,
  fallback = null,
}) => {
  const { status, ready } = useAuthStatus();
  const session = useSession();
  const user = useUser();

  if (!ready || status === "checking") return <>{fallback}</>;
  if (requireAuth && status !== "authenticated") return <>{fallback}</>;

  const role: Role | undefined = (session?.role as Role) ?? (user?.role as Role) ?? undefined;
  if (requireAuth && !role) return <>{fallback}</>;

  if (minRole && role) {
    if (rank[role] < rank[minRole]) return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Convenience wrappers
export const IfAuthenticated: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => <RoleGuard requireAuth minRole="user" fallback={fallback}>{children}</RoleGuard>;

export const IfAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => <RoleGuard requireAuth minRole="admin" fallback={fallback}>{children}</RoleGuard>;

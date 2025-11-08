// src/layouts/PortalLayout.tsx
import { Suspense } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";
import { useAuthStatus, useSession, useUser } from "../context/UserContext";

export default function PortalLayout() {
  const { status, ready } = useAuthStatus();
  const session = useSession();
  const user = useUser();
  const role = (session?.role ?? user?.role) as "admin" | "user" | undefined;

  if (!ready || status === "checking") {
    return <AppLoader open message="Cargando portal…" />;
  }

  if (status !== "authenticated" || role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Suspense fallback={<AppLoader open message="Cargando portal…" />}>
      <Outlet />
    </Suspense>
  );
}

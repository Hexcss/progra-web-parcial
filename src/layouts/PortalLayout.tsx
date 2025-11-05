// src/layouts/PortalLayout.tsx
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";

export default function PortalLayout() {
  return (
    <Suspense fallback={<AppLoader open message="Cargando portal…" />}>
      <Outlet />
    </Suspense>
  );
}

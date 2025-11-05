import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";

export default function AnonLayout() {
  return (
    <Suspense fallback={<AppLoader open message="Cargando…" />}>
      <Outlet />
    </Suspense>
  );
}

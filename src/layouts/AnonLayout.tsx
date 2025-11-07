import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";
import { MarketParticles } from "../components/Particles/MarketParticles";

export default function AnonLayout() {
  return (
    <Suspense fallback={<AppLoader open message="Cargando…" />}>
      <div style={{ zIndex: -1 }}>
        <MarketParticles />
      </div>
      <Outlet />
    </Suspense>
  );
}

// src/layouts/RootLayout.tsx
import React, { Suspense, useMemo } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import { Fade } from "@mui/material";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import AppLoader from "../components/Loaders/AppLoader";
import { categoriesMutationKey } from "../queries/categories.queries";
import { UserProvider } from "../context/UserContext";

const RootLayout: React.FC = () => {
  const navigation = useNavigation();

  const filteredFetching = useIsFetching();
  const filteredMutating = useIsMutating({
    predicate: (m) => {
      const key = (m.options as any)?.mutationKey as unknown[] | undefined;
      if (!Array.isArray(key)) return true;
      const isThumbRefresh =
        key.includes(categoriesMutationKey.refreshThumbnail[0]) &&
        key.includes(categoriesMutationKey.refreshThumbnail[1]) &&
        key.includes(categoriesMutationKey.refreshThumbnail[2]);
      return !isThumbRefresh;
    },
  });

  const navState = navigation.state;
  const navLoading = navState === "loading" || navState === "submitting";
  const open = navLoading || filteredFetching > 0 || filteredMutating > 0;

  const message = useMemo(() => {
    if (navState === "submitting") return "Enviando datos…";
    if (navState === "loading") return "Cargando página…";
    if (filteredMutating > 0) return "Guardando cambios…";
    if (filteredFetching > 0) return "Sincronizando datos…";
    return "Cargando…";
  }, [navState, filteredFetching, filteredMutating]);

  return (
    <UserProvider>
      <Suspense
        fallback={
          <Fade in timeout={200}>
            <div>
              <AppLoader open message="Preparando tu experiencia…" />
            </div>
          </Fade>
        }
      >
        <Outlet />
      </Suspense>

      <AppLoader
        open={open}
        message={message}
        tips={[
          "Compilando ofertas de tecnología…",
          "Precalentando caché de imágenes…",
          "Conectando con inventario en tiempo real…",
          "Verificando tu sesión…",
          "Activando modo turbo…",
        ]}
      />
    </UserProvider>
  );
};

export default RootLayout;

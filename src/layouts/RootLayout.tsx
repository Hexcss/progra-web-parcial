import React, { Suspense, useMemo } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import { Fade } from "@mui/material";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import AppLoader from "../components/Loaders/AppLoader";

const RootLayout: React.FC = () => {
  const navigation = useNavigation();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const navState = navigation.state;
  const navLoading = navState === "loading" || navState === "submitting";
  const open = navLoading || isFetching > 0 || isMutating > 0;

  const message = useMemo(() => {
    if (navState === "submitting") return "Enviando datos…";
    if (navState === "loading") return "Cargando página…";
    if (isMutating > 0) return "Guardando cambios…";
    if (isFetching > 0) return "Sincronizando datos…";
    return "Cargando…";
  }, [navState, isFetching, isMutating]);

  return (
    <>
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
    </>
  );
};

export default RootLayout;

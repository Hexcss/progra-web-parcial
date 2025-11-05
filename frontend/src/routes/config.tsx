import { type RouteObject, Navigate } from "react-router-dom";
import AppLoader from "../components/Loaders/AppLoader";
import type { LazyRouteModule } from "../utils/types/route.type";

const RootLayout = () =>
  import("../layouts/RootLayout").then((m) => ({ Component: m.default })) as Promise<LazyRouteModule>;

const MarketLayout = () =>
  import("../layouts/MarketLayout").then((m) => ({ Component: m.default })) as Promise<LazyRouteModule>;

const PortalLayout = () =>
  import("../layouts/PortalLayout").then((m) => ({ Component: m.default })) as Promise<LazyRouteModule>;

const AnonLayout = () =>
  import("../layouts/AnonLayout").then((m) => ({ Component: m.default })) as Promise<LazyRouteModule>;

export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: RootLayout,
    HydrateFallback: () => <AppLoader open message="Preparando tu experiencia…" />,
    children: [
      { index: true, element: <Navigate to="/market" replace /> },

      {
        id: "market",
        path: "market",
        lazy: MarketLayout,
        children: [
          {
            id: "market-home",
            index: true,
            lazy: () =>
              import("../views/market/pages").then((m) => ({
                Component: m.default,
                loadingMessage: "Cargando inicio…",
              })),
          },
          {
            id: "market-products",
            path: "products",
            children: [
              {
                index: true,
                lazy: () =>
                  import("../views/market/pages/products").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando productos…",
                  })),
              },
              {
                id: "market-product-detail",
                path: ":productId",
                lazy: () =>
                  import("../views/market/pages/products/detail").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando producto…",
                  })),
              },
            ],
          },
          {
            id: "market-categories",
            path: "categories",
            children: [
              {
                index: true,
                lazy: () =>
                  import("../views/market/pages/categories").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando categorías…",
                  })),
              },
              {
                id: "market-category-detail",
                path: ":category",
                lazy: () =>
                  import("../views/market/pages/categories/detail").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando categoría…",
                  })),
              },
            ],
          },
          {
            id: "market-search",
            path: "search",
            lazy: () =>
              import("../views/market/pages/search").then((m) => ({
                Component: m.default,
                loadingMessage: "Buscando…",
              })),
          },
          {
            id: "market-chat",
            path: "chat",
            lazy: () =>
              import("../views/market/pages/chat").then((m) => ({
                Component: m.default,
                loadingMessage: "Abriendo chat…",
              })),
          },
          {
            id: "market-about",
            path: "about",
            lazy: () =>
              import("../views/market/pages/about").then((m) => ({
                Component: m.default,
                loadingMessage: "Cargando información…",
              })),
          },
        ],
      },

      {
        id: "portal",
        path: "portal",
        lazy: PortalLayout,
        children: [
          {
            id: "portal-home",
            index: true,
            lazy: () =>
              import("../views/portal/pages").then((m) => ({
                Component: m.default,
                loadingMessage: "Cargando panel…",
              })),
          },
          {
            id: "portal-products",
            path: "products",
            children: [
              {
                index: true,
                lazy: () =>
                  import("../views/portal/pages/products").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando productos…",
                  })),
              },
            ],
          },
          {
            id: "portal-users",
            path: "users",
            children: [
              {
                index: true,
                lazy: () =>
                  import("../views/portal/pages/users").then((m) => ({
                    Component: m.default,
                    loadingMessage: "Cargando usuarios…",
                  })),
              },
            ],
          },
        ],
      },

      {
        path: "",
        lazy: AnonLayout,
        children: [
          {
            id: "login",
            path: "login",
            lazy: () =>
              import("../views/auth/login").then((m) => ({
                Component: m.default,
                loadingMessage: "Cargando acceso…",
              })),
          },
          {
            id: "signup",
            path: "signup",
            lazy: () =>
              import("../views/auth/signup").then((m) => ({
                Component: m.default,
                loadingMessage: "Cargando registro…",
              })),
          },
        ],
      },

      {
        id: "unauthorized",
        path: "unauthorized",
        lazy: () =>
          import("../views/auth/unauthorized").then((m) => ({
            Component: m.default,
            loadingMessage: "Cargando…",
          })),
      },

      { path: "*", element: <Navigate to="/market" replace /> },
    ],
  },
];

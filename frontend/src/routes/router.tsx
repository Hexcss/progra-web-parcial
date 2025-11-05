import { createBrowserRouter } from "react-router-dom";
import { routes } from "./config";

export const router = createBrowserRouter(routes, {
  future: {
    v7_partialHydration: false,
  },
});

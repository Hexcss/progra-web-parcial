// vite.config.ts
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import compression from "vite-plugin-compression2";

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  const plugins: PluginOption[] = [
    react(),
    ...(isProd
      ? [
          compression({
            algorithms: ["gzip", "brotli"],
            threshold: 10_240,
            deleteOriginalAssets: false,
            filename: (file) => `${file}.compressed`,
          }),
        ]
      : []),
  ];

  return {
    plugins,

    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },

    preview: {
      port: 5173,
      strictPort: true,
      host: true,
    },

    build: {
      target: "es2020",
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react";
              if (id.includes("@mui")) return "mui";
              if (
                id.includes("lucide-react") ||
                id.includes("hamburger-react") ||
                id.includes("react-loader-spinner")
              )
                return "icons";
              if (id.includes("framer-motion")) return "motion";
              if (id.includes("@tsparticles")) return "particles";
              if (
                id.includes("axios") ||
                id.includes("clean-deep") ||
                id.includes("zod")
              )
                return "utils";
              if (id.includes("react-hook-form")) return "forms";
              if (
                id.includes("@tanstack/react-query") ||
                id.includes("lottie-react") ||
                id.includes("@preact/signals-react")
              )
                return "vendor";
            }
          },
        },
      },
      minify: "esbuild",
      minifyOptions: isProd
        ? {
            drop: ["console", "debugger"],
          }
        : undefined,
      assetsInlineLimit: 4096,
    },
  };
});

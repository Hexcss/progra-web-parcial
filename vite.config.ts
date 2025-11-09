import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { compression } from "vite-plugin-compression2";

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  return {
    plugins: [
      react(),
      isProd &&
        compression({
          algorithms: ["gzip", "brotli"],
          threshold: 10_240,
          deleteOriginalAssets: false,
          filename: (file) => `${file}.compressed`,
        }),
    ].filter(Boolean),

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
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
            icons: [
              "@mui/icons-material",
              "lucide-react",
              "hamburger-react",
              "react-loader-spinner",
            ],
            motion: ["framer-motion"],
            particles: [
              "@tsparticles/engine",
              "@tsparticles/react",
              "@tsparticles/slim",
            ],
            utils: [
              "axios",
              "clean-deep",
              "zod",
            ],
            forms: [
              "react-hook-form",
            ],
            vendor: [
              "@tanstack/react-query",
              "lottie-react",
              "@preact/signals-react",
            ],
          },
        },
      },
      minify: "esbuild",
      assetsInlineLimit: 4096,
    },

    esbuild: isProd ? { drop: ["console", "debugger"] } : undefined,
  };
});

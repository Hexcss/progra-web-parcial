// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { Box, GlobalStyles } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSignals } from "@preact/signals-react/runtime";
import { router } from "./routes/router";
import LazySnackbar from "./providers/LazySnackbar";

const App = () => {
  useSignals();

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <GlobalStyles
          styles={(theme) => {
            const track = theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.08)
              : "#f0f0f0";
            const thumb = theme.palette.primary.main;
            const thumbHover = theme.palette.primary.dark;

            return {
              /* Reserve space for scrollbars to avoid layout shift */
              html: { scrollbarGutter: "stable" },

              /* Chrome / Edge / Safari */
              "*::-webkit-scrollbar": { width: "10px", height: "10px" },
              "*::-webkit-scrollbar-track": {
                backgroundColor: track,
                borderRadius: 8,
              },
              "*::-webkit-scrollbar-thumb": {
                backgroundColor: thumb,
                borderRadius: 8,
                minHeight: 24,
                border: `2px solid ${track}`,
              },
              "*::-webkit-scrollbar-thumb:hover": {
                backgroundColor: thumbHover,
              },
              "*::-webkit-scrollbar-corner": { backgroundColor: "transparent" },

              /* Generic fallback (ignored by WebKit, used by Firefox) */
              "*": {
                scrollbarColor: `${thumb} ${track}`,
              },

              /* Firefox-specific: make it thicker (thin is too skinny) */
              "@supports (scrollbar-width: auto)": {
                "*": {
                  scrollbarWidth: "auto", // thicker than "thin"
                },
              },
            };
          }}
        />
        <RouterProvider router={router} />
      </Box>

      <LazySnackbar />
    </>
  );
};

export default App;

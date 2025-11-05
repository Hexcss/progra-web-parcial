import { RouterProvider } from "react-router-dom";
import { Box, GlobalStyles } from "@mui/material";
import { useSignals } from "@preact/signals-react/runtime";
import { router } from "./routes/router";
import LazySnackbar from "./providers/LazySnackbar";

const App = () => {
  useSignals();

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <GlobalStyles
          styles={(theme) => ({
            "*::-webkit-scrollbar": { width: "6px", height: "6px" },
            "*::-webkit-scrollbar-track": {
              backgroundColor: "#f0f0f0",
              borderRadius: 8,
            },
            "*::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.primary.main,
              borderRadius: 8,
              minHeight: 24,
              border: "2px solid #f0f0f0",
            },
            "*::-webkit-scrollbar-thumb:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "*::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
            "*": {
              scrollbarWidth: "thin",
              scrollbarColor: `${theme.palette.primary.main} #f0f0f0`,
            },
          })}
        />
        <RouterProvider router={router} />
      </Box>

      <LazySnackbar />
    </>
  );
};

export default App;

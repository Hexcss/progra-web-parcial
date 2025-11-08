// src/theme/index.ts
import { createTheme } from "@mui/material";
import { esES } from "@mui/material/locale";

const ORANGE_MAIN = "#E67E22"; // carrot
const ORANGE_LIGHT = "#F5B041"; // warm light
const ORANGE_DARK = "#D35400"; // deeper carrot

const SLATE_MAIN = "#1F2937";  // deep slate for text/secondary
const SLATE_LIGHT = "#4B5563";
const SLATE_DARK = "#111827";

export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: {
        main: ORANGE_MAIN,
        light: ORANGE_LIGHT,
        dark: ORANGE_DARK,
        contrastText: "#ffffff",
      },
      secondary: {
        main: SLATE_MAIN,
        light: SLATE_LIGHT,
        dark: SLATE_DARK,
        contrastText: "#ffffff",
      },
      error: {
        main: "#EF4444",
        light: "#FCA5A5",
        dark: "#B91C1C",
        contrastText: "#ffffff",
      },
      warning: {
        main: "#F59E0B",
        light: "#FCD34D",
        dark: "#B45309",
        contrastText: "#1F2937",
      },
      info: {
        main: "#3B82F6",
        light: "#93C5FD",
        dark: "#1D4ED8",
        contrastText: "#ffffff",
      },
      success: {
        main: "#16A34A",
        light: "#86EFAC",
        dark: "#166534",
        contrastText: "#ffffff",
      },
      background: {
        default: "#FFF8F1", // warm off-white (orange-50 vibe)
        paper: "#ffffff",
      },
      text: {
        primary: SLATE_MAIN,
        secondary: "#6B7280",
      },
      divider: "rgba(230, 126, 34, 0.18)", // tinted by orange
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: `'Inter', sans-serif`,
      h1: {
        fontWeight: 800,
        letterSpacing: "0.02rem",
        color: SLATE_MAIN,
      },
      h2: {
        fontWeight: 800,
        color: ORANGE_MAIN,
      },
      h3: {
        fontWeight: 700,
        color: SLATE_MAIN,
      },
      h4: {
        fontWeight: 700,
        color: SLATE_MAIN,
      },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiMenuItem: {
        styleOverrides: { root: { fontSize: "14px !important", whiteSpace: "nowrap" } },
      },
      MuiFormControlLabel: {
        styleOverrides: { root: { "& .MuiFormControlLabel-label": { fontSize: "14px" } } },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: "48px",
            "&.Mui-disabled": { cursor: "not-allowed" },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontSize: "14px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: "48px",
            "&.Mui-disabled": { cursor: "not-allowed" },
          },
          asterisk: { color: "#EF4444" },
        },
      },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiSelect: {
        defaultProps: { size: "small" },
        styleOverrides: { root: { listbox: { fontSize: "14px" } } as any },
      },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiAutocomplete: {
        defaultProps: { size: "small" },
        styleOverrides: {
          root: {
            "&.Mui-disabled": { cursor: "not-allowed" },
            option: { fontSize: "14px", whiteSpace: "nowrap" },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: "14px",
            "&.Mui-disabled": { cursor: "not-allowed" },
          },
          input: {
            fontSize: "14px",
            "&.Mui-disabled": { cursor: "not-allowed" },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "&.Mui-disabled": { cursor: "not-allowed" },
            "& input.Mui-disabled": { cursor: "not-allowed" },
            // subtle orange hover/focus ring to match your topbar inputs
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: ORANGE_MAIN },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ORANGE_DARK },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: { root: { "&.Mui-disabled": { cursor: "not-allowed" } } },
      },
      MuiButton: {
        styleOverrides: {
          root: { "&.MuiButton-containedPrimary": { boxShadow: "none" } },
          containedPrimary: {
            backgroundColor: ORANGE_MAIN,
            "&:hover": { backgroundColor: ORANGE_DARK, boxShadow: "none" },
          },
          containedSecondary: {
            "&:hover": { backgroundColor: SLATE_DARK, boxShadow: "none" },
          },
          outlinedPrimary: {
            borderColor: `rgba(230, 126, 34, 0.5)`,
            "&:hover": { borderColor: ORANGE_MAIN, backgroundColor: "rgba(230,126,34,0.08)" },
          },
        },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 12 } } },
      MuiDialogContent: { styleOverrides: { root: { padding: "24px" } } },
      MuiDivider: {
        styleOverrides: { root: { borderColor: "rgba(230, 126, 34, 0.18)" } },
      },
      MuiChip: {
        styleOverrides: {
          filledPrimary: { backgroundColor: ORANGE_MAIN, color: "#fff" },
          outlinedPrimary: { borderColor: ORANGE_MAIN, color: ORANGE_MAIN },
        },
      },
    },
  },
  esES
);

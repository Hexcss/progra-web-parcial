// src/layouts/Wrappers/PortalLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Paper, Drawer, IconButton, Tooltip } from "@mui/material";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { useSignals } from "@preact/signals-react/runtime";
import { openDrawer } from "../../signals/drawer.signal";
import { theme } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import DrawerList from "../../components/Drawers/AppDrawer";
import PortalTopBar from "../../components/TopBars/PortalTopBar";

type PortalLayoutProps = {
  topContent?: React.ReactNode;
  lateralContent?: React.ReactNode;
  lateralWidth?: number;
  children: React.ReactNode;
  noMainContentPadding?: boolean;
  contentZoomable?: boolean;
  allowScrolling?: boolean;
};

const PortalLayout: React.FC<PortalLayoutProps> = ({
  topContent,
  lateralContent,
  children,
  lateralWidth = 200,
  noMainContentPadding = false,
  contentZoomable = false,
  allowScrolling = false,
}) => {
  useSignals();

  const drawerWidth = 284;
  const collapsedWidth = "90px";
  const [zoomed, setZoomed] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  useEffect(() => {
    if (!contentZoomable) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";
      if (editable) return;
      if (e.ctrlKey && e.altKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        setZoomed((z) => !z);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contentZoomable]);

  const paperPadding = useMemo(
    () => (noMainContentPadding ? 0 : "24px"),
    [noMainContentPadding]
  );

  return (
    <>
      <PortalTopBar />

      <Drawer
        variant="permanent"
        sx={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          "& .MuiDrawer-paper": {
            width: openDrawer.value ? drawerWidth : collapsedWidth,
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            overflowX: "hidden",
            border: "none",
          },
        }}
      >
        <div style={{ ...theme.mixins.toolbar }} />
        <DrawerList />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          pt: 9,
          backgroundColor: "#F5F5F5",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          ml: openDrawer.value ? `${drawerWidth}px` : collapsedWidth,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {topContent ? <Box sx={{ px: 3, mb: "8px" }}>{topContent}</Box> : <Box sx={{ my: 2 }} />}

        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            width: "100%",
            overflow: "hidden",
            px: 3,
          }}
        >
          {lateralContent && (
            <Box
              sx={{
                width: lateralWidth,
                flexShrink: 0,
                pr: 3,
                display: "flex",
                flexDirection: "column",
                maxHeight: "100%",
                mb: 3,
              }}
            >
              {lateralContent}
            </Box>
          )}

          <Box
            sx={{
              position: "relative",
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AnimatePresence>
              {zoomed && (
                <motion.div
                  key="zoom-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.08 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "#000",
                    zIndex: theme.zIndex.drawer + 1,
                  }}
                  onClick={() => setZoomed(false)}
                />
              )}
            </AnimatePresence>

            <Paper
              component={motion.div}
              layout
              layoutId="zoomable-paper"
              initial={false}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              elevation={0}
              sx={{
                flex: 1,
                minHeight: 0,
                backgroundColor: "#fff",
                borderRadius: "4px",
                mb: 3,
                display: "flex",
                flexDirection: "column",
                overflow: allowScrolling ? "auto" : "hidden",
                p: paperPadding,
                isolation: "isolate",
                contain: "layout paint",
                transition: theme.transitions.create(
                  ["inset", "border-radius", "margin", "padding", "box-shadow", "background-color"],
                  { duration: 280, easing: theme.transitions.easing.easeInOut }
                ),
                ...(zoomed && {
                  position: "fixed",
                  inset: 0,
                  zIndex: theme.zIndex.drawer + 2,
                  borderRadius: 0,
                  m: 0,
                }),
              }}
            >
              {children}
            </Paper>

            {zoomed && (
              <Box
                sx={{
                  "& .MuiAutocomplete-popper, & .MuiPopper-root, & .MuiPopover-root, & .MuiMenu-root, & .MuiPickersPopper-root, & .MuiModal-root":
                    { zIndex: (t) => t.zIndex.modal + 5 },
                }}
              />
            )}

            {contentZoomable && (
              <Tooltip
                title={zoomed ? "Salir de modo ampliado" : "Ampliar contenido"}
                open={tipOpen}
                onOpen={() => setTipOpen(true)}
                onClose={() => setTipOpen(false)}
                disableFocusListener
                disableTouchListener
                arrow
              >
                <IconButton
                  component={motion.button}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Alternar zoom de contenido"
                  size="small"
                  onClick={() => {
                    setTipOpen(false);
                    setZoomed((z) => !z);
                  }}
                  sx={{
                    position: zoomed ? "fixed" : "absolute",
                    top: zoomed ? 16 : 8,
                    right: zoomed ? 16 : 8,
                    zIndex: (t) => (zoomed ? t.zIndex.modal + 3 : t.zIndex.appBar + 1),
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: 1,
                    transition: theme.transitions.create(["top", "right", "box-shadow", "transform"], {
                      duration: 240,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                    "&:hover": { bgcolor: "white" },
                  }}
                >
                  {zoomed ? <ZoomOutMapIcon fontSize="small" /> : <ZoomInMapIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PortalLayout;

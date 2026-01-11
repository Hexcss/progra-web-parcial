import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface FrontendTableLayoutProps {
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
  addButton?: React.ReactNode;
  extraActions?: React.ReactNode;
  extraActionsLeft?: React.ReactNode;
  children: React.ReactNode;
  inheritPortalScroll?: boolean;
  allowInnerScroll?: boolean;
}

export const TableLayout: React.FC<FrontendTableLayoutProps> = ({
  title,
  onAdd,
  addLabel = "Añadir",
  addButton,
  extraActions,
  extraActionsLeft,
  children,
  inheritPortalScroll = false,
  allowInnerScroll = false,
}) => {
  const useInnerScroll = allowInnerScroll && !inheritPortalScroll;
  const scrollingEnabled = inheritPortalScroll || useInnerScroll;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: useInnerScroll ? "auto" : inheritPortalScroll ? "visible" : "hidden",
          pb: scrollingEnabled ? 2 : 0,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{
            flexShrink: 0,
            position: scrollingEnabled ? "sticky" : "static",
            top: 0,
            zIndex: (t) => t.zIndex.appBar,
            bgcolor: "background.paper",
            py: 1,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            {title && (
              <Typography variant="h5" fontWeight={800}>
                {title}
              </Typography>
            )}
            {extraActionsLeft && <Box>{extraActionsLeft}</Box>}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            {extraActions}
            {addButton ? (
              addButton
            ) : (
              onAdd && (
                <Button
                  variant="text"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={onAdd}
                >
                  {addLabel}
                </Button>
              )
            )}
          </Stack>
        </Stack>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

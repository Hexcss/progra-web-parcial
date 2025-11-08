// src/components/Drawer/DrawerList.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Fragment, useMemo } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignals } from "@preact/signals-react/runtime";
import {
  type DrawerItem,
  type DrawerSection,
} from "../../utils/types/route.type";
import { openDrawer } from "../../signals/drawer.signal";
import { createDrawerSections } from "../../utils/functions/create-drawer-sections.function";

export type DrawerRenderContext = {
  [key: string]: unknown;
};

export type DrawerListProps = {
  sections?: DrawerSection[];
  getDynamicPath?: (item: DrawerItem) => string | undefined | null;
  context?: DrawerRenderContext;
};

const DrawerList: React.FC<DrawerListProps> = ({ context = {} }) => {
  useSignals();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedBg = alpha(theme.palette.primary.main, 0.12);
  const hoverBg = alpha(theme.palette.primary.main, 0.06);
  const selectedColor = theme.palette.primary.dark;
  const iconDefault = theme.palette.text.secondary;
  const textDefault = theme.palette.text.primary;
  const sectionTitleColor = theme.palette.text.secondary;
  const dividerColor = theme.palette.divider;

  const textVariants = {
    open: { opacity: 1, width: "auto", transition: { duration: 0.25 } },
    closed: { opacity: 0, width: 0, transition: { duration: 0.2 } },
  };

  const resolvedSections = useMemo<DrawerSection[]>(() => {
    const base = createDrawerSections();

    const filtered = base
      .filter((sec) =>
        typeof sec.conditionalRender === "function"
          ? !!sec.conditionalRender(context)
          : true
      )
      .map((sec) => {
        const validItems = sec.items.filter((item) => {
          const condition =
            typeof item.conditionalRender === "function"
              ? !!item.conditionalRender(context)
              : true;
        return condition;
        });
        return { ...sec, items: validItems };
      })
      .filter((sec) => sec.items.length > 0);

    return filtered;
  }, [context]);

  const resolveItemPath = (item: DrawerItem) => {
    if (typeof item.getPath === "function") {
      const p = item.getPath(context);
      if (p) return p;
    }
    return item.path;
  };

  const isSegmentPrefix = (curr: string, prefix: string) => {
    if (!curr.startsWith(prefix)) return false;
    if (curr.length === prefix.length) return true;
    const next = curr[prefix.length];
    return next === "/";
  };

  const activeItem = useMemo<DrawerItem | null>(() => {
    let best: DrawerItem | null = null;
    let bestScore = -1;
    const curr = location.pathname;
    for (const sec of resolvedSections) {
      for (const item of sec.items) {
        for (const sp of item.selectedPaths) {
          if (isSegmentPrefix(curr, sp)) {
            const exactBonus = curr.length === sp.length ? 0.5 : 0;
            const score = sp.length + exactBonus;
            if (score > bestScore) {
              bestScore = score;
              best = item;
            }
          }
        }
      }
    }
    return best;
  }, [resolvedSections, location.pathname]);

  const handleMenuItemClick = (item: DrawerItem) => {
    const path = resolveItemPath(item);
    if (!path) return;
    if (item.openInNewTab) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(path);
  };

  return (
    <Box
      role="presentation"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {resolvedSections.map((section, sectionIndex) => (
          <Fragment key={sectionIndex}>
            <motion.div layout>
              <List
                sx={{
                  borderRight: "none",
                  pt: 0,
                  pb: 0,
                  px: 0,
                  mt: sectionIndex === 0 ? 0.5 : 0,
                }}
              >
                <AnimatePresence initial={false}>
                  {section.showTitle && (
                    <motion.div
                      key={`section-title-${sectionIndex}`}
                      layout
                      initial={{ height: 0, opacity: 0, y: -6 }}
                      animate={
                        openDrawer.value
                          ? { height: "auto", opacity: 1, y: 0 }
                          : { height: 0, opacity: 0, y: -6 }
                      }
                      exit={{ height: 0, opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        overflow: "hidden",
                        paddingTop: openDrawer.value
                          ? sectionIndex === 0
                            ? "8px"
                            : "4px"
                          : "0px",
                        marginBottom: openDrawer.value
                          ? sectionIndex === 0
                            ? "8px"
                            : "4px"
                          : "0px",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          px: 2.5,
                          py: 0.5,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          color: sectionTitleColor,
                          visibility: openDrawer.value ? "visible" : "hidden",
                        }}
                      >
                        {section.title || ""}
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>

                {section.items.map((item, index) => {
                  const isSelected = item === activeItem;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={(item.path || "") + index}
                      layout
                      transition={{ duration: 0.22 }}
                    >
                      <ListItemButton
                        sx={{
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: isSelected ? selectedBg : "transparent",
                          "&:hover": {
                            backgroundColor: isSelected ? selectedBg : hoverBg,
                          },
                        }}
                        id={`DrawerItem-${sectionIndex}-${index}`}
                        onClick={() => handleMenuItemClick(item)}
                        disabled={item.disabled}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: openDrawer.value ? 2 : 0,
                            justifyContent: "flex-start",
                            pl: 2,
                          }}
                        >
                          <Tooltip
                            title={!openDrawer.value ? item.text : ""}
                            placement="right"
                            arrow
                          >
                            <IconButton
                              size="small"
                              disableRipple
                              sx={{
                                transition: "none",
                                backgroundColor: "transparent !important",
                                "&:hover": {
                                  backgroundColor: "transparent !important",
                                },
                              }}
                            >
                              <Icon
                                sx={{
                                  color: isSelected ? selectedColor : iconDefault,
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </ListItemIcon>

                        <AnimatePresence initial={false}>
                          {openDrawer.value && (
                            <motion.div
                              initial="closed"
                              animate="open"
                              exit="closed"
                              variants={textVariants}
                              style={{
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <ListItemText
                                primary={item.text}
                                sx={{
                                  "&&": {
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? selectedColor : textDefault,
                                    pt: 0.2,
                                  },
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </ListItemButton>
                    </motion.div>
                  );
                })}
              </List>
            </motion.div>

            {sectionIndex < resolvedSections.length - 1 && (
              <Divider
                sx={{
                  borderColor: dividerColor,
                  width: "100%",
                  alignSelf: "center",
                }}
              />
            )}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default DrawerList;

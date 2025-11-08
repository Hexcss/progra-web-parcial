import React, { useState } from "react";
import { Box, IconButton, TableCell, TableRow, Tooltip } from "@mui/material";
import type { SxProps } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import RowActionsMenu from "../RowActions";
import { getCellContent } from "../helpers";
import type { Action } from "../helpers";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { ITableColumn } from "../../../../utils/types/table.type";

type Props<T> = {
  data: T[];
  columns: ITableColumn<T>[];
  actions?: (row: T, index: number) => Action[];
  cellSx: SxProps;
  collapsible?: boolean;
  renderRowDetail?: (row: T) => React.ReactNode;
  totalCols: number;
};

const MotionTableRow = motion(TableRow);

export function TableRows<T>({
  data,
  columns,
  actions,
  cellSx,
  collapsible = false,
  renderRowDetail,
  totalCols,
}: Props<T>) {
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});

  const toggleRow = (idx: number) =>
    setOpenRows((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <AnimatePresence initial={false}>
      {data.map((row, rowIndex) => {
        const isOpen = Boolean(openRows[rowIndex]);
        return (
          <React.Fragment key={`row-${rowIndex}`}>
            <MotionTableRow
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22 }}
            >
              {collapsible && (
                <TableCell
                  padding="checkbox"
                  align="center"
                  sx={{
                    ...cellSx,
                    width: 36,
                    minWidth: 36,
                    maxWidth: 36,
                    p: 0,
                    px: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => toggleRow(rowIndex)}
                    sx={{ p: 0.5 }}
                    aria-expanded={isOpen}
                    aria-label="toggle-row"
                  >
                    {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </TableCell>
              )}

              {columns.map((column) => {
                const content = getCellContent(column, row);
                const isClickable = Boolean(column.onClick && content !== "-");
                return (
                  <TableCell
                    key={String(column.id)}
                    sx={{
                      ...cellSx,
                      ...(isClickable && { cursor: "pointer", textDecoration: "underline" }),
                    }}
                    align={column.align}
                    onClick={isClickable ? () => column.onClick?.(row, rowIndex) : undefined}
                  >
                    {content}
                  </TableCell>
                );
              })}

              {actions && (
                <TableCell align="right" sx={cellSx}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5 }}>
                    {actions(row, rowIndex)
                      .filter((a) => a.outsideMenu)
                      .map((action) => (
                        <Tooltip key={action.id} title={action.name}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => action.onClick(rowIndex, () => {})}
                              disabled={action.disabled}
                            >
                              {action.icon}
                            </IconButton>
                          </span>
                        </Tooltip>
                      ))}
                    <RowActionsMenu
                      index={rowIndex}
                      actions={actions(row, rowIndex).filter((a) => !a.outsideMenu)}
                    />
                  </Box>
                </TableCell>
              )}
            </MotionTableRow>

            <AnimatePresence initial={false}>
              {collapsible && isOpen && renderRowDetail && (
                <MotionTableRow
                  key={`detail-${rowIndex}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  sx={{ "& > *": { border: 0 } }}
                >
                  <TableCell colSpan={totalCols} sx={{ p: 0, border: "none" }}>
                    <Box
                      component={motion.div}
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      sx={{ overflow: "hidden" }}
                    >
                      {renderRowDetail(row)}
                    </Box>
                  </TableCell>
                </MotionTableRow>
              )}
            </AnimatePresence>
          </React.Fragment>
        );
      })}
    </AnimatePresence>
  );
}

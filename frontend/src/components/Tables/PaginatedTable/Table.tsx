import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableHead,
  TablePagination,
  TableRow,
  CircularProgress,
  Typography,
} from "@mui/material";
import { usePagination } from "./hooks";
import { useScrollSync } from "./hooks";
import { useSort } from "./hooks";
import {
  BORDER,
  headerRowHeight,
  buildHeaderCellSx,
  buildCellSx,
  rowSx,
} from "./helpers";
import { TableHeader, TableRows } from "./components";
import type { Action } from "./helpers";
import TablePaginationActions from "./TablePaginationActions";
import type { ITableColumn } from "../../../utils/types/table.type";

interface PaginatedTableProps<T> {
  data: T[];
  columns: ITableColumn<T>[];
  actions?: (row: T, index: number) => Action[];
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  isLoading?: boolean;
  tableName?: string;
  rounded?: boolean;
  wrap?: boolean;
  collapsible?: boolean;
  renderRowDetail?: (row: T) => React.ReactNode;
}

function PaginatedTable<T>({
  data,
  columns,
  actions,
  rowsPerPageOptions = [10, 20, 30],
  defaultRowsPerPage = 10,
  isLoading = false,
  tableName,
  rounded = true,
  wrap = false,
  collapsible = false,
  renderRowDetail,
}: PaginatedTableProps<T>) {
  const cardBorderRadius = rounded ? 8 : 0;

  const { sortConfig, sortedData, handleSort } = useSort<T>(data);

  const {
    page,
    rowsPerPage,
    paginatedData,
    handleChangePage,
    handleChangeRowsPerPage,
  } = usePagination<T>(sortedData, defaultRowsPerPage);

  const { bodyScrollRef, scrollLeft, handleBodyScroll } = useScrollSync();

  const headerCellSx = buildHeaderCellSx(wrap, headerRowHeight);
  const cellSx = buildCellSx(wrap);

  const hasActions = Boolean(actions);
  const totalCols =
    columns.length + (collapsible ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <Box
      key={tableName}
      sx={{
        backgroundColor: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        border: `1px solid ${BORDER}`,
        borderRadius: `${cardBorderRadius}px`,
      }}
    >
      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <Box
          sx={{
            flexShrink: 0,
            overflow: "hidden",
            borderTopLeftRadius: `${cardBorderRadius}px`,
            borderTopRightRadius: `${cardBorderRadius}px`,
          }}
        >
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <Box
              sx={{
                transform: `translateX(-${scrollLeft}px)`,
                transition: "transform 0.02s linear",
              }}
            >
              <Table sx={{ tableLayout: "fixed", width: "100%" }}>
                {collapsible && (
                  <colgroup>
                    <col style={{ width: 36 }} />
                  </colgroup>
                )}
                <TableHead>
                  <TableRow sx={rowSx(headerRowHeight)}>
                    <TableHeader
                      columns={columns}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      headerCellSx={headerCellSx}
                      hasActions={hasActions}
                      collapsible={collapsible}
                    />
                  </TableRow>
                </TableHead>
              </Table>
            </Box>
          </Box>
        </Box>

        <Box
          ref={bodyScrollRef}
          onScroll={handleBodyScroll}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: paginatedData.length > 0 ? "auto" : "hidden",
            overflowX: "auto",
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : paginatedData.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                p: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No hay datos para mostrar.
              </Typography>
            </Box>
          ) : (
            <Table sx={{ tableLayout: "fixed", width: "100%" }}>
              {collapsible && (
                <colgroup>
                  <col style={{ width: 36 }} />
                </colgroup>
              )}
              <TableBody>
                <TableRows<T>
                  data={paginatedData}
                  columns={columns}
                  actions={actions}
                  cellSx={cellSx}
                  collapsible={collapsible}
                  renderRowDetail={renderRowDetail}
                  totalCols={totalCols}
                />
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <TablePagination
          sx={{
            backgroundColor: "#fff",
            borderTop: `1px solid ${BORDER}`,
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            borderRadius: rounded ? "0 0 8px 8px" : 0,
            "& .MuiTablePagination-toolbar": { px: 2 },
            "& .MuiTablePagination-select": { color: "#424242" },
          }}
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={TablePaginationActions}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Box>
    </Box>
  );
}

export default PaginatedTable;

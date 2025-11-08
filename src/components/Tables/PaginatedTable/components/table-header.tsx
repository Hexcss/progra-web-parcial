import { TableCell, TableSortLabel } from "@mui/material";
import type { SxProps } from "@mui/material";
import type { SortConfig } from "../hooks/use-sort";
import type { ITableColumn } from "../../../../utils/types/table.type";

type Props<T> = {
  columns: ITableColumn<T>[];
  sortConfig: SortConfig;
  onSort: (column: ITableColumn<T>) => void;
  headerCellSx: SxProps;
  hasActions: boolean;
  collapsible?: boolean;
};

export function TableHeader<T>({
  columns,
  sortConfig,
  onSort,
  headerCellSx,
  hasActions,
  collapsible = false,
}: Props<T>) {
  return (
    <>
      {collapsible && (
        <TableCell
          padding="checkbox"
          align="center"
          sx={{
            ...headerCellSx,
            width: 36,
            minWidth: 36,
            maxWidth: 36,
            p: 0,
            px: 0.5,
          }}
        />
      )}
      {columns.map((column) => (
        <TableCell
          key={String(column.id)}
          align={column.align}
          sx={headerCellSx}
          onClick={() => column.sortable && onSort(column)}
        >
          {column.sortable ? (
            <TableSortLabel
              active={sortConfig.columnId === column.id}
              direction={sortConfig.columnId === column.id ? sortConfig.direction : "asc"}
            >
              {column.label}
            </TableSortLabel>
          ) : (
            column.label
          )}
        </TableCell>
      ))}
      {hasActions && <TableCell sx={headerCellSx} />}
    </>
  );
}

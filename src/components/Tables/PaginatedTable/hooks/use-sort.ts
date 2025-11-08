import { useMemo, useState } from "react";
import type { ITableColumn } from "../../../../utils/types/table.type";

export type SortConfig = { columnId: string | null; direction: "asc" | "desc" };

export function useSort<T>(data: T[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    columnId: null,
    direction: "asc",
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.columnId) return data;

    const key = sortConfig.columnId as keyof T | string;

    const sorted = [...data].sort((a, b) => {
      const aValue = (a as any)[key];
      const bValue = (b as any)[key];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (column: ITableColumn<T>) => {
    if (!column.sortable) return;
    setSortConfig((prev) => {
      if (prev.columnId === column.id) {
        const newDir = prev.direction === "asc" ? "desc" : "asc";
        return { columnId: String(column.id), direction: newDir };
      }
      return { columnId: String(column.id), direction: "asc" };
    });
  };

  return { sortConfig, sortedData, handleSort };
}

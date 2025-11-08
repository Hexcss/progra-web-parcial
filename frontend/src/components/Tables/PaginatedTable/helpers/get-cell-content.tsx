import React from "react";
import type { ITableColumn } from "../../../../utils/types/table.type";

export function getCellContent<T>(column: ITableColumn<T>, row: T): React.ReactNode {
  const rawValue = (row as any)[column.id];

  if (column.render) {
    return column.render(rawValue, row);
  }

  if (
    typeof rawValue === "string" ||
    typeof rawValue === "number" ||
    typeof rawValue === "boolean" ||
    React.isValidElement(rawValue)
  ) {
    return rawValue;
  }

  if (rawValue == null) return "-";

  try {
    return JSON.stringify(rawValue);
  } catch {
    return String(rawValue);
  }
}

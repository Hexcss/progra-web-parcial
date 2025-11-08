export interface ITableColumn<T> {
  id: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  onClick?: (row: T, index: number) => void;
  sortable?: boolean | "asc" | "desc";
}

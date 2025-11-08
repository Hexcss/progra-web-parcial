export const BORDER = "#E0E0E0";
export const headerRowHeight = 50;
export const cellHeight = 50;

export const buildHeaderCellSx = (wrap: boolean, height: number) => ({
  backgroundColor: "#E0E0E0",
  paddingY: "8px",
  paddingX: "16px",
  fontSize: "14px",
  whiteSpace: wrap ? "normal" : "nowrap",
  textOverflow: wrap ? "unset" : "ellipsis",
  height: `${height}px`,
  maxWidth: "100%",
  borderBottom: `1px solid ${BORDER}`,
});

export const buildCellSx = (wrap: boolean) => ({
  backgroundColor: "#fff",
  paddingY: "12px",
  paddingX: "16px",
  fontSize: "14px",
  overflow: "hidden",
  whiteSpace: wrap ? "normal" : "nowrap",
  textOverflow: wrap ? "unset" : "ellipsis",
  wordBreak: wrap ? "break-word" : "normal",
  maxWidth: "100%",
  height: wrap ? "auto" : `${cellHeight}px`,
  minHeight: `${cellHeight}px`,
});

export const rowSx = (height: number) => ({ height: `${height}px` });

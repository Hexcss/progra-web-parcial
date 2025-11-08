import { Box, IconButton, Tooltip } from "@mui/material";
import type { Action } from "../helpers";

export function ActionButtons({
  items,
  rowIndex,
}: {
  items: Action[];
  rowIndex: number;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5 }}>
      {items.map((action) => (
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
    </Box>
  );
}

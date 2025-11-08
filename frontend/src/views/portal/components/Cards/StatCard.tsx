import { alpha, Box, Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LaunchIcon from "@mui/icons-material/Launch";

export function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  to?: string;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 200,
        p: 2.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.18),
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(
          theme.palette.background.paper,
          1
        )})`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.2,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" fontWeight={800}>
          {value}
        </Typography>
        {to && (
          <Button
            component={RouterLink}
            to={to}
            size="small"
            endIcon={<LaunchIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Ver
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
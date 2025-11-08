import { useMemo, useState, useCallback, lazy, Suspense } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { icons as LucideIconMap } from "lucide-react";
import * as LucideNamed from "lucide-react";
import ClearIcon from "@mui/icons-material/Clear";

const LucideModal = lazy(() => import("../Modals/Special/LucideModal")); 

interface IconSelectorProps {
  label: string;
  value?: string;
  onChange: (iconName: string) => void;
  helperText?: string;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

function getIconComponent(name?: string) {
  if (!name) return null;
  const fromMap = (LucideIconMap as any)[name];
  if (fromMap) return fromMap;
  const fromNamed = (LucideNamed as any)[name];
  if (fromNamed && name[0] === name[0].toUpperCase()) return fromNamed;
  return null;
}

export function IconSelector({
  label,
  value,
  onChange,
  helperText,
  placeholder,
  fullWidth = false,
  disabled = false,
}: IconSelectorProps) {
  const [open, setOpen] = useState(false);

  const CurrentIcon = useMemo(() => getIconComponent(value), [value]);

  const handleOpen = useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handlePick = useCallback(
    (iconName: string) => {
      onChange(iconName);
      setOpen(false);
    },
    [onChange]
  );

  const handleClearClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onChange("");
    },
    [onChange]
  );

  const handleClearMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClearKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <>
      <TextField
        label={label}
        value={value || ""}
        placeholder={placeholder}
        helperText={helperText}
        fullWidth={fullWidth}
        InputProps={{
          readOnly: true,
          startAdornment: CurrentIcon ? (
            <InputAdornment position="start">
              <CurrentIcon size={22} />
            </InputAdornment>
          ) : null,
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClearClick}
                onMouseDown={handleClearMouseDown}
                onKeyDown={handleClearKeyDown}
                edge="end"
                disabled={disabled}
                aria-label={"Limpiar"}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        onClick={handleOpen}
        disabled={disabled}
        sx={{
          cursor: disabled ? "not-allowed" : "pointer",
          "& .MuiInputBase-input": {
            cursor: disabled ? "not-allowed" : "pointer",
          },
        }}
        inputProps={{
          style: { cursor: disabled ? "not-allowed" : "pointer" },
          readOnly: true,
        }}
      />

      {open && (
        <Suspense
          fallback={
            <CircularProgress
              size={28}
              sx={{ position: "fixed", inset: 0, m: "auto", zIndex: 1300 }}
            />
          }
        >
          <LucideModal
            open={open}
            value={value}
            onClose={handleClose}
            onSelect={handlePick}
          />
        </Suspense>
      )}
    </>
  );
}

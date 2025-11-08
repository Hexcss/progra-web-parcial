// src/components/Inputs/FileUploadField.tsx
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { AttachFile } from "@mui/icons-material";
import { useRef } from "react";
import { showSnackbar } from "../../signals/snackbar.signal";

interface FileUploadFieldProps {
  value: string;
  onFileChange: (file: File | null) => void;
  label: string;
  error?: boolean;
  errorText?: string;
  downloadFile?: () => void;
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function FileUploadField({
  value,
  onFileChange,
  label,
  error,
  errorText,
  downloadFile,
  accept = "image/*",
  disabled = false,
  placeholder,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE = 10 * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (file.size > MAX_SIZE) {
        const mb = Math.round(MAX_SIZE / 1024 / 1024);
        showSnackbar(`El archivo es demasiado grande. Tamaño máximo: ${mb} MB.`, "error");
        return;
      }
      onFileChange(file);
    } else {
      onFileChange(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleDownloadFile = () => {
    if (!downloadFile) {
      showSnackbar("No hay archivo para descargar.", "error");
      return;
    }
    try {
      downloadFile();
    } catch {
      showSnackbar("Error al descargar el archivo.", "error");
    }
  };

  return (
    <>
      <TextField
        fullWidth
        variant="outlined"
        label={label}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleClick}
                disabled={disabled}
                sx={{ backgroundColor: "white", borderRadius: "50%", p: 1 }}
                aria-label="Adjuntar archivo"
              >
                <AttachFile />
              </IconButton>
            </InputAdornment>
          ),
          readOnly: true,
        }}
        size="small"
        error={error}
        helperText={error ? errorText : ""}
        onClick={downloadFile ? handleDownloadFile : undefined}
        sx={{
          "& .MuiOutlinedInput-input": {
            cursor: disabled ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          "& .MuiInputLabel-root": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: "20px",
          },
          ...(disabled && {
            cursor: "not-allowed",
            "& .MuiOutlinedInput-root": { cursor: "not-allowed" },
            "& .MuiOutlinedInput-input": { cursor: "not-allowed" },
            "& .MuiInputAdornment-root": { cursor: "not-allowed" },
          }),
        }}
      />
      <input
        accept={accept}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        ref={inputRef}
        disabled={disabled}
      />
    </>
  );
}

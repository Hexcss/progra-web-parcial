// src/views/auth/signup/index.tsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  TextField,
  Button,
  Divider,
  Alert,
  Link,
  InputAdornment,
  useTheme,
  alpha,
  LinearProgress,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { User, KeyRound, Mail, ArrowRight, Github } from "lucide-react";
import { useRegisterMutation } from "../../../queries/auth.queries";
import { useAuthActions } from "../../../context/UserContext";
import GoogleIcon from "../../../components/Icons/GoogleIcon";

const ZRegisterSchema = z.object({
  displayName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});
type RegisterSchema = z.infer<typeof ZRegisterSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login, getPostLoginRedirect, clearPostLoginRedirect } = useAuthActions();
  const registerMutation = useRegisterMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(ZRegisterSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterSchema) => {
    setApiError(null);
    try {
      await registerMutation.mutateAsync(data);
      // Inicia sesión automáticamente tras registrarte
      await login({ email: data.email, password: data.password });

      const redirectPath = getPostLoginRedirect() || "/market";
      clearPostLoginRedirect();
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      setApiError(error?.message || "Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        position: "relative",
        minHeight: "100vh",
        bgcolor: "background.default",
        background: `radial-gradient(1200px 700px at 10% -10%, ${alpha(theme.palette.warning.main, 0.08)} 0%, transparent 60%),
                     radial-gradient(900px 600px at 100% 0%, ${alpha(theme.palette.warning.light, 0.10)} 0%, transparent 60%)`,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 4, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 820,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            backdropFilter: "blur(6px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            px: { xs: 2.5, md: 5 },
            py: { xs: 3, md: 5 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          {(isSubmitting || registerMutation.isPending) && (
            <LinearProgress
              color="warning"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 4,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            />
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 5 }}
            alignItems="stretch"
            justifyContent="space-between"
          >
            {/* Lado izquierdo: branding y texto — igual que login */}
            <Stack
              spacing={1.25}
              sx={{
                flex: 1.05,
                textAlign: { xs: "center", md: "left" },
                alignItems: { xs: "center", md: "flex-start" },
                justifyContent: "center",
                display: "flex",
                pt: { xs: 0.5, md: 1 },
              }}
            >
              <Box
                component={RouterLink}
                to="/market"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  textDecoration: "none",
                  color: "inherit",
                  mb: 1,
                }}
              >
                <Box
                  component="img"
                  src="/logos/app.png"
                  alt="NeoTech"
                  loading="eager"
                  decoding="async"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    display: "block",
                  }}
                />
                <Typography variant="h6" fontWeight={900} letterSpacing={0.2}>
                  Neo
                  <Box component="span" sx={{ color: "warning.main", ml: 0.25 }}>
                    Tech
                  </Box>
                </Typography>
              </Box>

              <Typography variant="h4" fontWeight={900}>
                Crear Cuenta
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.7 }}>
                Únete a NeoTech para descubrir ofertas, guardar favoritos y comprar más rápido.
              </Typography>
            </Stack>

            {/* Lado derecho: formulario */}
            <Box sx={{ flex: 0.95 }}>
              <Stack spacing={2.25} component="form" onSubmit={handleSubmit(onSubmit)}>
                {apiError && <Alert severity="error">{apiError}</Alert>}

                <Controller
                  name="displayName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre Completo"
                      color="warning"
                      error={!!errors.displayName}
                      helperText={errors.displayName?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} color={theme.palette.text.secondary} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      color="warning"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} color={theme.palette.text.secondary} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contraseña"
                      type="password"
                      color="warning"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyRound size={18} color={theme.palette.text.secondary} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="warning"
                  size="large"
                  loading={isSubmitting || registerMutation.isPending}
                  endIcon={<ArrowRight />}
                  sx={{ textTransform: "none", fontSize: "1.05rem", py: 1.25 }}
                >
                  Crear Cuenta
                </LoadingButton>

                <Divider>O regístrate con</Divider>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    sx={{ borderColor: "divider", textTransform: "none", display: "flex", gap: 1 }}
                  >
                    <GoogleIcon sx={{ width: 20 }} />
                    Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    startIcon={<Github size={18} />}
                    sx={{ borderColor: "divider", textTransform: "none" }}
                  >
                    GitHub
                  </Button>
                </Stack>

                <Typography variant="body2" sx={{ textAlign: "center", pt: 0.5 }}>
                  ¿Ya tienes una cuenta?{" "}
                  <Link component={RouterLink} to="/login" fontWeight={600} color="warning.main">
                    Inicia sesión
                  </Link>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

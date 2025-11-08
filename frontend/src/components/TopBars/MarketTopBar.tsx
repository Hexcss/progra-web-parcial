// src/components/TopBars/MarketTopBar.tsx
import { useMemo, useState, useCallback } from "react";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import {
  Menu,
  Search,
  ShoppingCart,
  Store,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useAuthActions, useAuthStatus } from "../../context/UserContext";
import { useLocalShoppingCart } from "../../hooks/useLocalShoppingCart";
import { openModal } from "../../signals/modal.signal";
import { IfAuthenticated, IfAdmin } from "../Guards/RoleGuard";

export default function MarketTopBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 6 });

  const { status, ready } = useAuthStatus();
  const { logout } = useAuthActions();
  const isAuthed = ready && status === "authenticated";

  const { totals } = useLocalShoppingCart();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      navigate(`/market/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    setOpen(false);
    navigate("/market");
  }, [logout, navigate]);

  const openCartModal = useCallback(() => {
    setOpen(false);
    openModal("shoppingCart", {});
  }, []);

  const openProfileModal = useCallback(() => {
    setOpen(false);
    openModal("profile", {});
  }, []);

  const navLinks = useMemo(
    () => [
      { to: "/market", label: "Inicio", end: true },
      { to: "/market/products", label: "Productos" },
      { to: "/market/categories", label: "Categorías" },
      ...(isAuthed ? [{ to: "/market/chat", label: "Chat" }] : []),
      { to: "/market/about", label: "Acerca" },
    ],
    [isAuthed]
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          backgroundImage: scrolled
            ? "linear-gradient(90deg, rgba(255,153,51,0.10), rgba(255,255,255,0.95), rgba(255,186,73,0.12))"
            : "linear-gradient(90deg, rgba(255,153,51,0.06), rgba(255,255,255,0.85), rgba(255,186,73,0.08))",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,165,0,0.25)",
          transition: "background-color .2s ease, background-image .2s ease, border-color .2s ease",
        }}
      >
        <Toolbar disableGutters sx={{ width: "100%" }}>
          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, width: "100%" }}>
            <Box sx={{ width: "100%", maxWidth: 1536, mx: "auto" }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
                  <IconButton onClick={() => setOpen(true)} aria-label="Abrir menú" sx={{ color: "text.primary" }}>
                    <Menu />
                  </IconButton>
                </Box>

                <Button
                  component={RouterLink}
                  to="/market"
                  sx={{
                    gap: 1,
                    px: 0,
                    minWidth: 0,
                    marginLeft: 0,
                    color: "text.primary",
                    textTransform: "none",
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(255,165,0,0.15)",
                      border: "1px solid rgba(255,165,0,0.35)",
                    }}
                  >
                    <Store size={18} color="#e67e22" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800} letterSpacing={0.3}>
                    <Box component="span" sx={{ color: "text.primary" }}>
                      Neo
                    </Box>
                    <Box component="span" sx={{ color: "#e67e22" }}>
                      Tech
                    </Box>
                  </Typography>
                </Button>

                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ display: { xs: "none", md: "flex" } }}>
                  {navLinks.map((l) => (
                    <Button
                      key={l.to}
                      component={NavLink}
                      to={l.to}
                      end={(l as any).end}
                      sx={{
                        fontSize: 14,
                        textTransform: "none",
                        color: "text.secondary",
                        borderRadius: 1.5,
                        px: 1.5,
                        "&.active": {
                          bgcolor: "rgba(255,165,0,0.16)",
                          color: "#d35400",
                          boxShadow: "inset 0 0 0 1px rgba(230,126,34,0.35)",
                        },
                        "&:hover": { bgcolor: "rgba(255,165,0,0.12)", color: "#d35400" },
                      }}
                    >
                      {l.label}
                    </Button>
                  ))}
                </Stack>

                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <Box component="form" onSubmit={onSearch} sx={{ width: "100%", maxWidth: 620 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar tecnología…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ pr: 0.5 }}>
                            <Search size={18} color="#e67e22" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "rgba(255,165,0,0.08)",
                          borderRadius: 2,
                          transition: "box-shadow .18s ease, border-color .18s ease",
                          "& fieldset": { borderColor: "rgba(255,165,0,0.35)" },
                          "&:hover fieldset": { borderColor: "rgba(230,126,34,0.8)" },
                          "&.Mui-focused fieldset": { borderColor: "rgba(230,126,34,1)" },
                          "&:hover": { boxShadow: "0 6px 20px rgba(230,126,34,0.12)" },
                          "&.Mui-focused": { boxShadow: "0 10px 26px rgba(230,126,34,0.18)" },
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ display: { xs: "none", md: "flex" } }}>
                  <IfAdmin>
                    <Button
                      component={RouterLink}
                      to="/portal"
                      startIcon={<LayoutDashboard size={16} />}
                      sx={{
                        textTransform: "none",
                        height: 40,
                        color: "text.secondary",
                        borderRadius: 1.5,
                        "&:hover": { bgcolor: "rgba(255,165,0,0.12)", color: "#d35400" },
                      }}
                    >
                      Portal
                    </Button>
                  </IfAdmin>

                  {!isAuthed ? (
                    <>
                      <Button
                        component={RouterLink}
                        to="/login"
                        startIcon={<LogIn size={16} />}
                        sx={{
                          textTransform: "none",
                          height: 40,
                          color: "text.secondary",
                          borderRadius: 1.5,
                          "&:hover": { bgcolor: "rgba(255,165,0,0.12)", color: "#d35400" },
                        }}
                      >
                        Iniciar sesión
                      </Button>
                      <Button
                        component={RouterLink}
                        to="/signup"
                        sx={{
                          textTransform: "none",
                          height: 40,
                          px: 2.2,
                          bgcolor: "#f39c12",
                          color: "#fff",
                          "&:hover": { bgcolor: "#e67e22" },
                          borderRadius: 1.5,
                        }}
                      >
                        Crear cuenta
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleLogout}
                      startIcon={<LogOut size={16} />}
                      sx={{
                        textTransform: "none",
                        height: 40,
                        color: "text.secondary",
                        borderRadius: 1.5,
                        "&:hover": { bgcolor: "rgba(255,165,0,0.12)", color: "#d35400" },
                      }}
                    >
                      Cerrar sesión
                    </Button>
                  )}

                  <IfAuthenticated>
                    <IconButton
                      aria-label="Mi perfil"
                      onClick={openProfileModal}
                      sx={{
                        color: "#e67e22",
                        borderRadius: 1.5,
                        "&:hover": { bgcolor: "rgba(255,165,0,0.12)" },
                      }}
                    >
                      <User />
                    </IconButton>

                    <Box sx={{ position: "relative", display: "inline-flex" }}>
                      <IconButton
                        aria-label="Carrito"
                        onClick={openCartModal}
                        sx={{
                          color: "#e67e22",
                          borderRadius: 1.5,
                          "&:hover": { bgcolor: "rgba(255,165,0,0.12)" },
                        }}
                      >
                        <ShoppingCart />
                      </IconButton>
                      {totals.count > 0 && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: "90%",
                            bottom: -2,
                            transform: "translateX(-50%)",
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            bgcolor: "#e67e22",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            boxShadow: "0 2px 6px rgba(230,126,34,0.35)",
                            border: "1px solid rgba(255,255,255,0.9)",
                            pointerEvents: "none",
                            lineHeight: 1,
                          }}
                          aria-label={`${totals.count} artículos en el carrito`}
                        >
                          {totals.count}
                        </Box>
                      )}
                    </Box>
                  </IfAuthenticated>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,186,73,0.10))",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(255,165,0,0.15)",
                border: "1px solid rgba(255,165,0,0.35)",
              }}
            >
              <Store size={16} color="#e67e22" />
            </Box>
            <Typography fontWeight={800}>
              Neo<Box component="span" sx={{ color: "#e67e22" }}>Tech</Box>
            </Typography>
          </Stack>

          <Box component="form" onSubmit={onSearch} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar tecnología…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#e67e22" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,165,0,0.08)",
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,165,0,0.35)" },
                  "&:hover fieldset": { borderColor: "rgba(230,126,34,0.8)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(230,126,34,1)" },
                },
              }}
            />
          </Box>

          <List dense>
            {navLinks.map((l) => (
              <ListItemButton
                key={l.to}
                component={RouterLink}
                to={l.to}
                onClick={() => setOpen(false)}
                sx={{
                  borderRadius: 1,
                  "&.MuiListItemButton-root.Mui-focusVisible": { bgcolor: "rgba(255,165,0,0.12)" },
                }}
              >
                <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            ))}

            <IfAdmin>
              <ListItemButton
                component={RouterLink}
                to="/portal"
                onClick={() => setOpen(false)}
                sx={{
                  borderRadius: 1,
                  "&.MuiListItemButton-root.Mui-focusVisible": { bgcolor: "rgba(255,165,0,0.12)" },
                }}
              >
                <ListItemText primary="Portal" primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            </IfAdmin>
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            <IfAuthenticated>
              <Button
                fullWidth
                startIcon={<User size={16} />}
                sx={{ textTransform: "none", borderRadius: 1.2 }}
                onClick={openProfileModal}
              >
                Mi perfil
              </Button>

              <Button
                fullWidth
                startIcon={<ShoppingCart size={16} />}
                sx={{ textTransform: "none", borderRadius: 1.2 }}
                onClick={openCartModal}
              >
                Ver carrito {totals.count > 0 ? `(${totals.count})` : ""}
              </Button>
            </IfAuthenticated>

            <IfAdmin>
              <Button
                component={RouterLink}
                to="/portal"
                fullWidth
                startIcon={<LayoutDashboard size={16} />}
                sx={{ textTransform: "none", borderRadius: 1.2 }}
                onClick={() => setOpen(false)}
              >
                Ir al Portal
              </Button>
            </IfAdmin>

            {!isAuthed ? (
              <Stack direction="row" spacing={1}>
                <Button
                  component={RouterLink}
                  to="/login"
                  fullWidth
                  startIcon={<LogIn size={16} />}
                  sx={{ textTransform: "none", borderRadius: 1.2 }}
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Button>
                <Button
                  component={RouterLink}
                  to="/signup"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    bgcolor: "#f39c12",
                    color: "#fff",
                    "&:hover": { bgcolor: "#e67e22" },
                    borderRadius: 1.2,
                  }}
                  onClick={() => setOpen(false)}
                >
                  Crear cuenta
                </Button>
              </Stack>
            ) : (
              <Button
                fullWidth
                startIcon={<LogOut size={16} />}
                sx={{ textTransform: "none", borderRadius: 1.2 }}
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

// src/views/market/components/Sections/Hero/HeroSearch.tsx
import { Box, Button, Divider, InputAdornment, TextField } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

export const HeroSearch = memo(function HeroSearch({
  variants,
  custom = 3,
}: {
  variants: Variants;
  custom?: number;
}) {
  const [q, setQ] = useState("")

  const navigate = useNavigate();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      navigate(`/market/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <Box
      component={motion.form}
      variants={variants}
      custom={custom}
      onSubmit={onSearch}
      sx={{ width: "100%", maxWidth: 760 }}
    >
      <TextField
        fullWidth
        placeholder="Buscar laptops, monitores, audio…"
        onChange={(e) => setQ(e.target.value)}
        size="medium"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ pr: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Search size={18} color="#e67e22" />
                <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(230,126,34,0.35)" }} />
              </Box>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end" sx={{ pl: 1 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  textTransform: "none",
                  px: 2.5,
                  borderRadius: 2,
                  bgcolor: "#f39c12",
                  color: "#fff",
                  boxShadow: "0 6px 18px rgba(243,156,18,0.30)",
                  transition: "transform .18s ease, box-shadow .18s ease, background-color .18s ease",
                  "&:hover": {
                    bgcolor: "#e67e22",
                    transform: "translateY(-1px)",
                    boxShadow: "0 10px 28px rgba(230,126,34,0.40)",
                  },
                }}
                endIcon={<ArrowRight size={16} />}
              >
                Buscar
              </Button>
            </InputAdornment>
          ),
        }}
        sx={{
          "@keyframes shimmerSlide": {
            "0%": { transform: "translateX(-120%)" },
            "100%": { transform: "translateX(120%)" },
          },
          "@keyframes glowPulse": {
            "0%": { boxShadow: "0 0 0 0 rgba(243,156,18,0.10)" },
            "50%": { boxShadow: "0 0 20px 2px rgba(243,156,18,0.18)" },
            "100%": { boxShadow: "0 0 0 0 rgba(243,156,18,0.10)" },
          },
          "& .MuiOutlinedInput-root": {
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            bgcolor: "rgba(255,165,0,0.10)",
            backdropFilter: "blur(6px)",
            transition: "box-shadow .2s ease, background-color .2s ease, border-color .2s ease",
            "& fieldset": { borderColor: "rgba(255,165,0,0.35)" },
            "&:hover fieldset": { borderColor: "rgba(230,126,34,0.8)" },
            "&.Mui-focused fieldset": { borderColor: "rgba(230,126,34,1)" },
            "&:hover": {
              boxShadow: "0 10px 28px rgba(230,126,34,0.15), inset 0 0 24px rgba(255,177,66,0.12)",
            },
            "&.Mui-focused": {
              boxShadow: "0 14px 36px rgba(230,126,34,0.22), inset 0 0 28px rgba(255,177,66,0.16)",
              animation: "glowPulse 1.6s ease-in-out 1",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, transparent 0%, rgba(255,177,66,0.10) 45%, rgba(243,156,18,0.18) 60%, rgba(255,177,66,0.10) 75%, transparent 100%)",
              transform: "translateX(-120%)",
              pointerEvents: "none",
            },
            "&:hover::before": {
              animation: "shimmerSlide 0.9s ease forwards",
            },
          },
          "& input::placeholder": { color: "text.secondary", opacity: 0.9 },
        }}
      />
    </Box>
  );
});

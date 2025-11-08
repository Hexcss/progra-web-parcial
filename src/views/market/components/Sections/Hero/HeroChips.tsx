// src/views/market/components/Sections/Hero/HeroChips.tsx
import { memo, useMemo } from "react"
import { Stack, Chip } from "@mui/material"
import { motion, type Variants } from "framer-motion"
import { Link as RouterLink } from "react-router-dom"
import { useCategoriesQuery } from "../../../../../queries/categories.queries"
import { IconFromName } from "../../../../../utils/functions/icons.function"

export const HeroChips = memo(function HeroChips({
  variants,
  custom = 4,
}: {
  variants: Variants
  custom?: number
}) {
  const { data } = useCategoriesQuery()
  console.log(data);
  const arr = Array.isArray(data) ? data : (data as any)?.items ?? []
  const top = useMemo(
    () =>
      (arr as Array<{ _id: string; name: string; icon?: string; productCount?: number }>)
        .slice()
        .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
        .slice(0, 4),
    [arr]
  )

  return (
    <Stack
      component={motion.div}
      variants={variants}
      custom={custom}
      direction="row"
      spacing={1}
      sx={{ flexWrap: "wrap" }}
    >
      {top.map((c, idx) => {
        const slug = (c.name ?? "").toLowerCase().replace(/\s+/g, "-")
        return (
          <motion.div
            key={c._id ?? `${slug}-${idx}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * idx, duration: 0.25 } }}
            style={{ display: "inline-flex" }}
          >
            <Chip
              component={RouterLink}
              to={`/market/categories/${encodeURIComponent(slug)}`}
              clickable
              icon={<IconFromName icon={c.icon} />}
              label={c.name ?? "Categoría"}
              sx={{
                mr: 0.5,
                mb: 0.5,
                px: 0.5,
                bgcolor: "rgba(255,165,0,0.10)",
                color: "text.primary",
                border: "1px solid",
                borderColor: "rgba(255,165,0,0.35)",
                backdropFilter: "blur(4px)",
                transition: "all .25s ease",
                position: "relative",
                overflow: "hidden",
                "& .MuiChip-label": { px: 1 },
                "& .MuiChip-icon": { color: "#e67e22", transition: "transform .25s ease, color .25s ease" },
                "&:hover .MuiChip-icon": { transform: "rotate(-6deg) scale(1.05)", color: "#f39c12" },
                "&:hover": {
                  bgcolor: "rgba(255,165,0,0.16)",
                  borderColor: "rgba(255,165,0,0.55)",
                  boxShadow:
                    "0 0 0 3px rgba(255,165,0,0.12), 0 6px 18px rgba(230,126,34,0.20), inset 0 0 18px rgba(255,177,66,0.18)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(120deg, transparent 0%, rgba(255,177,66,0.18) 30%, rgba(243,156,18,0.22) 50%, rgba(255,177,66,0.18) 70%, transparent 100%)",
                  transform: "translateX(-100%)",
                  transition: "transform .8s ease",
                  pointerEvents: "none",
                },
                "&:hover::before": { transform: "translateX(0%)" },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: -1,
                  borderRadius: "inherit",
                  padding: "1px",
                  background:
                    "linear-gradient(180deg, rgba(255,177,66,0.35), rgba(230,126,34,0.25))",
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  opacity: 0,
                  transition: "opacity .25s ease",
                },
                "&:hover::after": { opacity: 1 },
              }}
            />
          </motion.div>
        )
      })}
    </Stack>
  )
})

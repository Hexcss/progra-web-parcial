// src/views/market/components/Sections/Hero/HeroArt.tsx
import { Box } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import { memo } from "react";
import { LazyLottie } from "../../../../../components/Animations/LazyLottie";

export const HeroArt = memo(function HeroArt({
    variants,
}: {
    variants: Variants;
    mdUp: boolean;
}) {
    return (
        <Box component={motion.div} variants={variants} custom={1} sx={{ width: { xs: 280, sm: 340, md: 420 }, pointerEvents: "none" }}>
            <LazyLottie file="hero.json" width="100%" height="100%" />
        </Box>
    );
});

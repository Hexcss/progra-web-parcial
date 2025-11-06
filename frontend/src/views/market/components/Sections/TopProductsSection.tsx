import { useCallback } from "react";
import {
    Box,
    Typography,
    IconButton,
    Card,
    CardContent,
    Skeleton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useTopProductsQuery } from "../../../../queries/products.queries";
import ProductCard from "../Cards/ProductCard";

export default function TopProductsSection() {
    const theme = useTheme();
    const { data: items = [], isLoading } = useTopProductsQuery(10);

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: "start",
            loop: true,
            slidesToScroll: 1,
            containScroll: "trimSnaps",
        },
        [Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })]
    );

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    return (
        <Box sx={{ position: "relative", pt: 6, pb: 8 }}>
            <Box sx={{ textAlign: "center", mb: 4, px: { xs: 2, md: 3 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} gutterBottom>
                    Nuestros Productos Estrella
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Explora la selección preferida por nuestra comunidad.
                </Typography>
            </Box>

            <Box
                sx={{
                    position: "relative",
                    px: { xs: 1.5, sm: 2, md: 3 },
                    "&:hover .nav-arrow": { opacity: 1, transform: "translateY(-50%) scale(1)" },
                }}
            >
                <Box
                    ref={emblaRef}
                    sx={{
                        overflow: "hidden",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") scrollPrev();
                        if (e.key === "ArrowRight") scrollNext();
                    }}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Productos mejor valorados"
                    tabIndex={0}
                >
                    <Box
                        className="embla__container"
                        sx={{
                            display: "flex",
                            gap: "12px",
                        }}
                    >
                        {isLoading &&
                            Array.from({ length: 5 }).map((_, i) => (
                                <Box
                                    key={`sk-${i}`}
                                    className="embla__slide"
                                    sx={{
                                        flex: "0 0 80%",
                                        "@media (min-width:600px)": { flex: "0 0 45%" },
                                        "@media (min-width:900px)": { flex: "0 0 30%" },
                                        "@media (min-width:1200px)": { flex: "0 0 22%" },
                                        minWidth: 0,
                                    }}
                                >
                                    <Card sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                                        <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "4 / 3" }} />
                                        <CardContent>
                                            <Skeleton width="80%" />
                                            <Skeleton width="50%" sx={{ mt: 1 }} />
                                            <Skeleton width="60%" sx={{ mt: 0.5 }} />
                                        </CardContent>
                                    </Card>
                                </Box>
                            ))}

                        {!isLoading &&
                            items.map((p) => (
                                <Box
                                    key={p._id}
                                    className="embla__slide"
                                    sx={{
                                        flex: "0 0 80%",
                                        "@media (min-width:600px)": { flex: "0 0 45%" },
                                        "@media (min-width:900px)": { flex: "0 0 30%" },
                                        "@media (min-width:1200px)": { flex: "0 0 22%" },
                                        minWidth: 0,
                                    }}
                                >
                                    <ProductCard product={p} />
                                </Box>
                            ))}
                    </Box>
                </Box>

                <IconButton
                    className="nav-arrow"
                    aria-label="Anterior"
                    onClick={scrollPrev}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: 8,
                        transform: "translateY(-50%) scale(0.9)",
                        opacity: 0,
                        transition: "all .25s ease",
                        zIndex: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        "&:hover": { bgcolor: alpha(theme.palette.background.paper, 0.95) },
                    }}
                >
                    <ChevronLeft />
                </IconButton>
                <IconButton
                    className="nav-arrow"
                    aria-label="Siguiente"
                    onClick={scrollNext}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: "50%",
                        right: 8,
                        transform: "translateY(-50%) scale(0.9)",
                        opacity: 0,
                        transition: "all .25s ease",
                        zIndex: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.7),
                        "&:hover": { bgcolor: alpha(theme.palette.background.paper, 0.95) },
                    }}
                >
                    <ChevronRight />
                </IconButton>
            </Box>
        </Box>
    );
}
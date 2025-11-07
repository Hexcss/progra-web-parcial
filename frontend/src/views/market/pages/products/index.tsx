import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Box,
    Container,
    Grid,
    Typography,
    Stack,
    Pagination,
    Skeleton,
    Paper,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Drawer,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { ListFilter, X } from "lucide-react";
import { useProductsQuery } from "../../../../queries/products.queries";
import { useCategoriesQuery } from "../../../../queries/categories.queries";
import type { ProductListParams } from "../../../../backend/apis/product.api";
import ProductCard from "../../components/Cards/ProductCard";

const DEBOUNCE_DELAY = 500;

// Helper component for filter section titles
const FilterHeader = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {children}
    </Typography>
);

function ProductFilters({ params, onParamsChange }: { params: ProductListParams, onParamsChange: (newParams: ProductListParams) => void }) {
    const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
    const [priceRange, setPriceRange] = useState<number[]>([params.minPrice ?? 0, params.maxPrice ?? 500]);
    const priceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setPriceRange([params.minPrice ?? 0, params.maxPrice ?? 500]);
    }, [params.minPrice, params.maxPrice]);

    const handlePriceChange = (_event: Event, newValue: number | number[]) => {
        setPriceRange(newValue as number[]);
        clearTimeout(priceTimeoutRef.current!);
        priceTimeoutRef.current = setTimeout(() => {
            onParamsChange({ ...params, minPrice: (newValue as number[])[0], maxPrice: (newValue as number[])[1], page: 1 });
        }, DEBOUNCE_DELAY);
    };

    const handleClearFilters = () => {
        // We keep the sort param when clearing others
        const clearedParams: ProductListParams = { sort: params.sort };
        onParamsChange(clearedParams);
    };

    const filterContent = (
        <Stack spacing={3}>
            <Box>
                <FilterHeader>Buscar</FilterHeader>
                <TextField
                    fullWidth
                    placeholder="Nombre del producto..."
                    size="small"
                    value={params.q || ""}
                    onChange={(e) => onParamsChange({ ...params, q: e.target.value || undefined, page: 1 })}
                />
            </Box>
            <Box>
                <FilterHeader>Categoría</FilterHeader>
                <FormControl fullWidth size="small">
                    <Select
                        value={params.categoryId || "all"}
                        onChange={(e) => onParamsChange({ ...params, categoryId: e.target.value === "all" ? undefined : e.target.value, page: 1 })}
                        disabled={categoriesLoading}
                    >
                        <MenuItem value="all">Todas las categorías</MenuItem>
                        {categories.map((cat) => (
                            <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Box>
                <FilterHeader>Rango de Precio</FilterHeader>
                <Slider
                    value={priceRange}
                    onChange={handlePriceChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={500}
                    step={10}
                    valueLabelFormat={(value) => `€${value}`}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption">€{priceRange[0]}</Typography>
                    <Typography variant="caption">€{priceRange[1]}</Typography>
                </Stack>
            </Box>
            <Button
                variant="outlined"
                color="inherit"
                onClick={handleClearFilters}
                sx={{ textTransform: 'none' }}
            >
                Limpiar Filtros
            </Button>
        </Stack>
    );

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                borderRadius: 2.5,
                borderColor: 'divider',
                height: '100%',
            }}
        >
            {filterContent}
        </Paper>
    );
}


// Main Page Component
export default function ProductsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);

    const queryParams: ProductListParams = useMemo(() => ({
        q: searchParams.get("q") || undefined,
        categoryId: searchParams.get("categoryId") || undefined,
        limit: Number(searchParams.get("limit")) || 24,
        page: Number(searchParams.get("page")) || 1,
        sort: (searchParams.get("sort") as ProductListParams["sort"]) || "new",
        minPrice: searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    }), [searchParams]);

    const { data, isLoading } = useProductsQuery(queryParams);

    const handleParamsChange = (newParams: ProductListParams) => {
        const updated = new URLSearchParams();
        Object.entries(newParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                updated.set(key, String(value));
            }
        });
        setSearchParams(updated, { replace: true });
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        handleParamsChange({ ...queryParams, page: value });
        window.scrollTo(0, 0);
    };

    const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
    const items = data?.items ?? [];

    return (
        <Box sx={{ py: { xs: 4, md: 6 } }}>
            <Container maxWidth="xl">
                {/* Header Section */}
                <Stack spacing={1} sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
                    <Typography variant="h3" component="h1" fontWeight={800}>
                        Nuestro Catálogo
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Descubre productos de calidad, seleccionados especialmente para ti.
                    </Typography>
                </Stack>

                {/* Main Content Grid */}
                <Grid container spacing={4}>
                    {/* Filter Sidebar (Desktop) */}
                    {!isMobile && (
                        <Grid size={{ md: 3 }}>
                            <Box sx={{ position: 'sticky', top: 100 }}>
                                <ProductFilters params={queryParams} onParamsChange={handleParamsChange} />
                            </Box>
                        </Grid>
                    )}

                    {/* Products Grid and Controls */}
                    <Grid size={{ xs: 12, md: 9}}>
                        <Stack spacing={3}>
                            {/* Toolbar: Sort + Filter Toggle */}
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <Box>
                                    {isMobile && (
                                        <Button
                                            startIcon={<ListFilter />}
                                            onClick={() => setFilterDrawerOpen(true)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Filtros
                                        </Button>
                                    )}
                                    {!isMobile && data && (
                                         <Typography variant="body2" color="text.secondary">
                                            Mostrando <b>{items.length}</b> de <b>{data.total}</b> productos
                                        </Typography>
                                    )}
                                </Box>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Ordenar por</InputLabel>
                                    <Select
                                        value={queryParams.sort}
                                        label="Ordenar por"
                                        onChange={(e) => handleParamsChange({ ...queryParams, sort: e.target.value as ProductListParams["sort"] })}
                                    >
                                        <MenuItem value="new">Más Recientes</MenuItem>
                                        <MenuItem value="rating">Mejor Valorados</MenuItem>
                                        <MenuItem value="priceAsc">Precio: Menor a Mayor</MenuItem>
                                        <MenuItem value="priceDesc">Precio: Mayor a Menor</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            {/* Product Grid */}
                            <Grid container spacing={{ xs: 2, sm: 3 }}>
                                {isLoading &&
                                    Array.from({ length: 12 }).map((_, i) => (
                                        <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: '100%', aspectRatio: '1 / 1.15' }} />
                                        </Grid>
                                    ))}

                                {!isLoading && items.length > 0 &&
                                    items.map((p) => (
                                        <Grid key={p._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <ProductCard product={p} />
                                        </Grid>
                                    ))}
                                
                                {!isLoading && items.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Paper sx={{ textAlign: 'center', p: 5, borderRadius: 2.5 }}>
                                            <Typography variant="h6" gutterBottom>No se encontraron productos</Typography>
                                            <Typography color="text.secondary">
                                                Intenta ajustar tus filtros o busca algo diferente.
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Stack alignItems="center" sx={{ pt: 3 }}>
                                    <Pagination
                                        page={queryParams.page}
                                        count={totalPages}
                                        onChange={handlePageChange}
                                        color="primary"
                                    />
                                </Stack>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            {/* Filter Drawer (Mobile) */}
            <Drawer
                anchor="left"
                open={isFilterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
            >
                <Box sx={{ width: 300, p: 2.5, pt: 1 }}>
                     <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Filtros</Typography>
                        <IconButton onClick={() => setFilterDrawerOpen(false)}>
                            <X />
                        </IconButton>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <ProductFilters params={queryParams} onParamsChange={handleParamsChange} />
                </Box>
            </Drawer>
        </Box>
    );
}
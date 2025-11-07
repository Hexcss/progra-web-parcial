import { useMemo } from "react";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Container,
    Grid,
    Typography,
    Stack,
    Pagination,
    Skeleton,
    Paper,
    Button,
    Select,
    MenuItem,
    FormControl,
    Breadcrumbs,
    Link,
    alpha,
    useTheme,
} from "@mui/material";
import { Home, ChevronRight } from "lucide-react";
import { useCategoryQuery } from "../../../../../queries/categories.queries";
import { useProductsQuery } from "../../../../../queries/products.queries";
import type { ProductListParams } from "../../../../../backend/apis/product.api";
import ProductCard from "../../../components/Cards/ProductCard";

function CategoryPageSkeleton() {
    return (
        <Container maxWidth="lg">
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 4 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Skeleton width="20%" />
                <Skeleton width="15%" />
            </Stack>
            <Grid container spacing={3}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: '100%', aspectRatio: '1 / 1.15' }} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default function CategoryDetailPage() {
    const { category: categoryId } = useParams<{ category: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = useTheme();

    const { data: category, isLoading: isCategoryLoading, isError: isCategoryError } = useCategoryQuery(categoryId);

    const queryParams: ProductListParams = useMemo(() => ({
        categoryId: categoryId,
        limit: 16,
        page: Number(searchParams.get("page")) || 1,
        sort: (searchParams.get("sort") as ProductListParams["sort"]) || "new",
    }), [categoryId, searchParams]);
    
    const { data: productsData, isLoading: areProductsLoading } = useProductsQuery(queryParams);

    const handleSortChange = (newSort: ProductListParams["sort"]) => {
        setSearchParams({ page: '1', sort: newSort || 'new' }, { replace: true });
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setSearchParams({ sort: queryParams.sort || 'new', page: String(value) });
        window.scrollTo(0, 0);
    };

    const isLoading = isCategoryLoading || areProductsLoading;
    const items = productsData?.items ?? [];
    const totalPages = productsData ? Math.ceil(productsData.total / productsData.limit) : 1;

    if (isLoading) {
        return (
            <Box sx={{ py: { xs: 4, md: 6 } }}>
                <CategoryPageSkeleton />
            </Box>
        );
    }
    
    if (isCategoryError || !category) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>Categoría No Encontrada</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    La categoría que buscas no existe o ha sido eliminada.
                </Typography>
                <Button component={RouterLink} to="/market/categories" variant="contained" startIcon={<ChevronRight />}>
                    Ver todas las categorías
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={{ py: { xs: 2, md: 4 } }}>
            <Container maxWidth="lg">
                <Paper
                    sx={{
                        p: { xs: 3, md: 5 },
                        mb: { xs: 4, md: 5 },
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        color: 'common.white',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: `url(${category.thumbnail || 'https://placehold.co/1200x400?text=Categor%C3%ADa'})`,
                    }}
                >
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: alpha(theme.palette.common.black, 0.55),
                        zIndex: 1,
                    }}/>
                    <Stack spacing={2} sx={{ position: 'relative', zIndex: 2, alignItems: 'center', textAlign: 'center' }}>
                         <Breadcrumbs separator={<ChevronRight size={16} />} sx={{ color: 'inherit' }}>
                            <Link component={RouterLink} to="/market" sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                                <Home size={16} style={{ marginRight: '8px' }}/>
                                Inicio
                            </Link>
                            <Link component={RouterLink} to="/market/categories" sx={{ color: 'inherit' }}>
                                Categorías
                            </Link>
                            <Typography sx={{ fontWeight: 700, color: 'inherit' }}>{category.name}</Typography>
                        </Breadcrumbs>
                        <Typography variant="h2" component="h1" fontWeight={800}>
                            {category.name}
                        </Typography>
                        <Typography variant="body1" sx={{ maxWidth: '600px', opacity: 0.9 }}>
                           Explora {category.productCount} productos únicos en esta colección.
                        </Typography>
                    </Stack>
                </Paper>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                     <Typography variant="body1" color="text.secondary">
                        <b>{productsData?.total ?? 0}</b> productos encontrados
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            value={queryParams.sort}
                            onChange={(e) => handleSortChange(e.target.value as ProductListParams["sort"])}
                        >
                            <MenuItem value="new">Más Recientes</MenuItem>
                            <MenuItem value="rating">Mejor Valorados</MenuItem>
                            <MenuItem value="priceAsc">Precio: Menor a Mayor</MenuItem>
                            <MenuItem value="priceDesc">Precio: Mayor a Menor</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
                
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    {items.length > 0 ? (
                        items.map((p) => (
                            <Grid key={p._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <ProductCard product={p} />
                            </Grid>
                        ))
                    ) : (
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ textAlign: 'center', p: 5, borderRadius: 2.5 }}>
                                <Typography variant="h6" gutterBottom>No hay productos aquí todavía</Typography>
                                <Typography color="text.secondary">
                                    Vuelve pronto para ver los nuevos productos en la categoría "{category.name}".
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                {totalPages > 1 && (
                    <Stack alignItems="center" sx={{ pt: 5 }}>
                        <Pagination
                            page={queryParams.page}
                            count={totalPages}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Stack>
                )}
            </Container>
        </Box>
    );
}
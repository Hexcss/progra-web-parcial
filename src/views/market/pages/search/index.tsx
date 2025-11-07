import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Container,
    Grid,
    Typography,
    Stack,
    Skeleton,
    Paper,
    TextField,
    Button,
    InputAdornment,
    Divider,
} from "@mui/material";
import { Search, ChevronRight } from "lucide-react";
import { useProductsQuery } from "../../../../queries/products.queries";
import { useCategoriesQuery } from "../../../../queries/categories.queries";
import ProductCard from "../../components/Cards/ProductCard";
import CategoryCard from "../../components/Cards/CategoryCard";

const SectionHeader = ({ title, count }: { title: string, count: number }) => (
    <Box>
        <Typography variant="h5" component="h2" fontWeight={800} gutterBottom>
            {title} ({count})
        </Typography>
        <Divider />
    </Box>
);

function ProductResults({ searchQuery }: { searchQuery: string }) {
    const { data, isLoading } = useProductsQuery({ q: searchQuery, limit: 8 });
    const products = data?.items ?? [];

    if (isLoading) {
        return (
            <Stack spacing={4}>
                <Skeleton width="40%" height={40} />
                <Grid container spacing={3}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Grid key={`psk-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: '100%', aspectRatio: '1 / 1.15' }} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <Stack spacing={3}>
            <SectionHeader title="Productos Encontrados" count={data?.total ?? 0} />
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {products.map((p) => (
                    <Grid key={p._id} size={{ xs: 12, sm: 6, md: 3 }}>
                        <ProductCard product={p} />
                    </Grid>
                ))}
            </Grid>
            {data && data.total > products.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                        component={RouterLink}
                        to={`/market/products?q=${encodeURIComponent(searchQuery)}`}
                        variant="outlined"
                        endIcon={<ChevronRight />}
                    >
                        Ver todos los {data.total} productos
                    </Button>
                </Box>
            )}
        </Stack>
    );
}

function CategoryResults({ searchQuery }: { searchQuery: string }) {
    const { data: allCategories = [], isLoading } = useCategoriesQuery();

    const filteredCategories = useMemo(() => {
        return allCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allCategories, searchQuery]);

    if (isLoading) {
        return (
             <Stack spacing={4}>
                <Skeleton width="40%" height={40} />
                <Grid container spacing={3}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Grid key={`csk-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: '100%', aspectRatio: '4 / 3' }} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        );
    }

    if (filteredCategories.length === 0) {
        return null;
    }

    return (
        <Stack spacing={3}>
            <SectionHeader title="Categorías Relacionadas" count={filteredCategories.length} />
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {filteredCategories.map((c) => (
                    <Grid key={c._id} size={{ xs: 12, sm: 6, md: 3 }}>
                        <CategoryCard category={c} />
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}


export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get("q") || "";
    const [inputValue, setInputValue] = useState(query);

    const { data: productsData, isLoading: productsLoading } = useProductsQuery({ q: query, limit: 1 });
    const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesQuery();
    
    const filteredCategoryCount = useMemo(() => {
        if (!categoriesData) return 0;
        return categoriesData.filter(cat => cat.name.toLowerCase().includes(query.toLowerCase())).length;
    }, [categoriesData, query]);
    
    useEffect(() => {
        setInputValue(query);
    }, [query]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedValue = inputValue.trim();
        if (trimmedValue) {
            navigate(`/market/search?q=${encodeURIComponent(trimmedValue)}`);
        }
    };
    
    const isLoading = productsLoading || categoriesLoading;
    const hasNoResults = !isLoading && query && productsData?.total === 0 && filteredCategoryCount === 0;

    return (
        <Box sx={{ py: { xs: 4, md: 6 } }}>
            <Container maxWidth="lg">
                <Stack spacing={{ xs: 4, md: 6 }}>
                    <Stack component="form" onSubmit={handleSearchSubmit} spacing={1.5} alignItems="center">
                        <Typography variant="h4" component="h1" fontWeight={800}>
                            {query ? `Resultados para "${query}"` : "Realiza una búsqueda"}
                        </Typography>
                        <TextField
                            placeholder="Buscar productos o categorías..."
                            variant="outlined"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            sx={{
                                maxWidth: '600px',
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '999px',
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={20} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>

                    {query && !hasNoResults && (
                        <>
                            <ProductResults searchQuery={query} />
                            <CategoryResults searchQuery={query} />
                        </>
                    )}

                    {hasNoResults && (
                        <Paper sx={{ textAlign: 'center', p: { xs: 3, md: 6 }, borderRadius: 2.5 }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                No se encontraron resultados
                            </Typography>
                            <Typography color="text.secondary">
                                No pudimos encontrar nada para tu búsqueda. Intenta con palabras clave diferentes.
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}
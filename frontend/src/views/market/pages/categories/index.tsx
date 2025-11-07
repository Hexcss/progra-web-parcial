import { useState, useMemo } from "react";
import {
    Box,
    Container,
    Grid,
    Typography,
    Stack,
    Skeleton,
    Paper,
    TextField,
    InputAdornment,
} from "@mui/material";
import { Search } from "lucide-react";
import { useCategoriesQuery } from "../../../../queries/categories.queries";
import CategoryCard from "../../components/Cards/CategoryCard";

export default function CategoriesPage() {
    const { data: categories = [], isLoading } = useCategoriesQuery();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCategories = useMemo(() => {
        if (!searchQuery) {
            return categories;
        }
        return categories.filter((category) =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    return (
        <Box sx={{ py: { xs: 4, md: 6 } }}>
            <Container maxWidth="lg">
                <Stack spacing={2} sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
                    <Typography variant="h3" component="h1" fontWeight={800}>
                        Explora por Categoría
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Navega a través de todas nuestras colecciones de productos y encuentra exactamente lo que necesitas.
                    </Typography>
                </Stack>

                <Stack alignItems="center" sx={{ mb: 5 }}>
                    <TextField
                        placeholder="Buscar categorías..."
                        variant="outlined"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{
                            maxWidth: '500px',
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

                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    {isLoading &&
                        Array.from({ length: 8 }).map((_, i) => (
                            <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: '100%', aspectRatio: '4 / 3' }} />
                            </Grid>
                        ))}

                    {!isLoading && filteredCategories.length > 0 &&
                        filteredCategories.map((category) => (
                            <Grid key={category._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <CategoryCard category={category} />
                            </Grid>
                        ))}

                    {!isLoading && filteredCategories.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ textAlign: 'center', p: 5, borderRadius: 2.5 }}>
                                <Typography variant="h6" gutterBottom>
                                    No se encontraron categorías
                                </Typography>
                                <Typography color="text.secondary">
                                    {searchQuery 
                                        ? "Intenta con otro término de búsqueda." 
                                        : "Parece que aún no hemos añadido ninguna categoría."
                                    }
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}
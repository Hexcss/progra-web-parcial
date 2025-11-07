// src/views/market/pages/products/detail/index.tsx
import { useParams, Link as RouterLink } from "react-router-dom"
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Skeleton,
  Paper,
  Button,
  Chip,
  Rating,
  Divider,
  Alert,
  useTheme,
} from "@mui/material"
import { ShoppingCart, PackageCheck, PackageX, ChevronLeft } from "lucide-react"
import { useProductQuery, useTopProductsQuery } from "../../../../../queries/products.queries"
import ProductCard from "../../../components/Cards/ProductCard"
import { useMemo } from "react"
import { useLocalShoppingCart } from "../../../../../hooks/useLocalShoppingCart"
import ReviewSection from "../../../components/Sections/ReviewSection"

function ProductDetailsSkeleton() {
  return (
    <Grid container spacing={{ xs: 3, md: 5 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Skeleton variant="rectangular" sx={{ borderRadius: 3, width: "100%", aspectRatio: "1 / 1" }} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={2}>
          <Skeleton width="40%" />
          <Skeleton width="80%" height={40} />
          <Skeleton width="50%" />
          <Skeleton width="30%" height={35} />
          <Skeleton width="60%" />
          <Divider />
          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
          <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
        </Stack>
      </Grid>
    </Grid>
  )
}

function TopProductsSection() {
  const { data: topProducts, isLoading } = useTopProductsQuery(5)
  return (
    <Box sx={{ mt: { xs: 6, md: 8 }, py: { xs: 4, md: 6 }, bgcolor: "action.hover", borderRadius: 3 }}>
      <Typography variant="h5" component="h2" fontWeight={800} sx={{ textAlign: "center", mb: 4 }}>
        También te podría interesar
      </Typography>
      <Grid container spacing={2} sx={{ px: { xs: 1, md: 2 } }}>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, width: "100%", aspectRatio: "1 / 1.15" }} />
            </Grid>
          ))}
        {topProducts?.map((product) => (
          <Grid key={product._id} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const { data: product, isLoading, isError } = useProductQuery(productId)
  const theme = useTheme()
  const { addProduct } = useLocalShoppingCart()

  const finalPrice = useMemo(() => {
    if (!product) return 0
    const discount = product.activeDiscount?.discountPercent ?? 0
    return product.price * (1 - discount / 100)
  }, [product])

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <ProductDetailsSkeleton />
      </Container>
    )
  }

  if (isError || !product) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Producto No Encontrado
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Lo sentimos, no pudimos encontrar el producto que buscas.
        </Typography>
        <Button component={RouterLink} to="/market/products" variant="contained" startIcon={<ChevronLeft />}>
          Volver al Catálogo
        </Button>
      </Container>
    )
  }

  const handleAddToCart = () => {
    addProduct(product, 1)
  }

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                p: 1,
              }}
            >
              <Box
                component="img"
                src={product.imageUrl || "https://placehold.co/800x800?text=Producto"}
                alt={product.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 2.5,
                }}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5} divider={<Divider />}>
              <Stack spacing={1.5}>
                {product.category && (
                  <Chip
                    label={product.category}
                    size="small"
                    component={RouterLink}
                    to={`/market/products?category=${product.category}`}
                    clickable
                    sx={{ width: "fit-content" }}
                  />
                )}
                <Typography variant="h3" component="h1" fontWeight={800}>
                  {product.name}
                </Typography>
                {product.reviewCount && product.reviewCount > 0 && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating value={product.avgRating} readOnly precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                      ({product.reviewCount} {product.reviewCount === 1 ? "opinión" : "opiniones"})
                    </Typography>
                  </Stack>
                )}
              </Stack>

              <Stack spacing={1.5}>
                {product.activeDiscount && (
                  <Alert severity="success" variant="outlined" sx={{ borderColor: "success.main", color: "success.dark" }}>
                    ¡Oferta Especial! Ahorra un <b>{product.activeDiscount.discountPercent}%</b> por tiempo limitado.
                  </Alert>
                )}
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    €{finalPrice.toFixed(2)}
                  </Typography>
                  {product.activeDiscount && (
                    <Typography variant="h6" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                      €{product.price.toFixed(2)}
                    </Typography>
                  )}
                </Stack>
                <Chip
                  icon={product.stock > 0 ? <PackageCheck size={16} /> : <PackageX size={16} />}
                  label={product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
                  color={product.stock > 0 ? "success" : "error"}
                  variant="outlined"
                  size="small"
                  sx={{ width: "fit-content", fontWeight: 500 }}
                />
              </Stack>

              <Box>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {product.description || "No hay descripción disponible para este producto."}
                </Typography>
              </Box>

              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<ShoppingCart />}
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                sx={{ py: 1.5, textTransform: "none", fontSize: "1.1rem" }}
              >
                {product.stock > 0 ? "Añadir al Carrito" : "Producto Agotado"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <ReviewSection productId={product._id} avgRating={product.avgRating} reviewCount={product.reviewCount} />

        <TopProductsSection />
      </Container>
    </Box>
  )
}

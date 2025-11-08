import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import { BrainCircuit, Gem, Users, Leaf } from "lucide-react";

// Helper component for section headers
const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <Stack spacing={1.5} sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
    <Typography variant="h3" component="h2" fontWeight={800}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
      {subtitle}
    </Typography>
  </Stack>
);

// Helper component for value cards
const ValueCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        textAlign: 'center',
        height: '100%',
        borderRadius: 2.5,
        borderColor: 'divider',
        bgcolor: 'background.default',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.1)}`,
          borderColor: alpha(theme.palette.warning.main, 0.6),
        }
      }}
    >
      <Box sx={{ color: 'warning.main', mb: 1.5 }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Paper>
  );
};

// Main About Page Component
export default function AboutPage() {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 4}, pb: 3 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 6 },
            borderRadius: 3,
            background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.05)} 0%, transparent 60%)`,
          }}
        >
          <Typography variant="h2" component="h1" fontWeight={800} gutterBottom>
            Sobre NeoTech
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400} sx={{ maxWidth: '750px', mx: 'auto' }}>
            No solo vendemos tecnología, diseñamos el futuro. Creamos herramientas que potencian la creatividad humana y conectan el mundo digital con el real.
          </Typography>
        </Box>

        {/* Nuestra Historia Section */}
        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center" sx={{ mb: { xs: 6, md: 8 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src="/images/hqs.jpg"
              alt="Oficinas de NeoTech"
              sx={{
                width: '100%',
                borderRadius: 2.5,
                objectFit: 'cover',
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>Nuestra Historia</Typography>
            <Typography color="text.secondary" paragraph>
              NeoTech nació en 2042 en un garaje iluminado por hologramas, fundado por la visionaria Elara Vance. Su objetivo era simple pero audaz: democratizar la tecnología del mañana, hoy. Lo que comenzó como un proyecto para crear asistentes personales de IA más intuitivos, se ha convertido en un ecosistema de productos que redefinen la interacción humana con el mundo digital.
            </Typography>
            <Typography color="text.secondary">
              Creemos que la tecnología más avanzada es aquella que se siente invisible, la que se integra tan perfectamente en nuestras vidas que simplemente amplifica nuestro potencial. Esa es la magia que buscamos en cada circuito, en cada línea de código.
            </Typography>
          </Grid>
        </Grid>

        {/* Nuestros Valores Section */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <SectionHeader
            title="Nuestros Valores"
            subtitle="Son los pilares que guían cada decisión, cada producto y cada interacción que tenemos. Son el ADN de NeoTech."
          />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ValueCard icon={<BrainCircuit size={32} />} title="Innovación Radical">
                No seguimos las tendencias, las creamos. Desafiamos lo imposible para construir lo inimaginable.
              </ValueCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ValueCard icon={<Gem size={32} />} title="Calidad Cuántica">
                Cada producto es una obra de arte de la ingeniería, fabricado con una precisión y atención al detalle obsesivas.
              </ValueCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ValueCard icon={<Users size={32} />} title="Comunidad Conectada">
                Nuestros clientes son nuestros colaboradores. Crecemos, aprendemos y construimos el futuro juntos.
              </ValueCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ValueCard icon={<Leaf size={32} />} title="Futuro Sostenible">
                Innovamos con conciencia. Desarrollamos tecnología que no solo es poderosa, sino también respetuosa con nuestro planeta.
              </ValueCard>
            </Grid>
          </Grid>
        </Box>

        {/* Nuestro Compromiso (Policies) */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 5, md: 7 },
            px: { xs: 2, md: 4 },
            borderRadius: 3,
            mb: { xs: 6, md: 8 },
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" component="h2" fontWeight={800} gutterBottom>
            Nuestro Compromiso Contigo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
            Tu confianza es nuestro activo más valioso. Por eso, nos comprometemos a una total transparencia en nuestras políticas de privacidad y a ofrecer una garantía de satisfacción en todos nuestros productos. Si no estás completamente satisfecho con tu compra, nuestro equipo de soporte está aquí para ayudarte. Tu tranquilidad es nuestra prioridad.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
import { Container, Typography, Box } from "@mui/material";

function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🏠 Accueil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenue sur Score Tracker
        </Typography>
      </Box>
    </Container>
  );
}

export default Home;

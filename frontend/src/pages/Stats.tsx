import { Container, Typography, Box } from "@mui/material";

function Stats() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📊 Statistiques
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vos statistiques de jeu
        </Typography>
      </Box>
    </Container>
  );
}

export default Stats;

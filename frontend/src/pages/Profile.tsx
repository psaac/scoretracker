import { Container, Typography, Box } from "@mui/material";

function Profile() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          👤 Profil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Votre profil utilisateur
        </Typography>
      </Box>
    </Container>
  );
}

export default Profile;

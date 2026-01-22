import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import HomeIcon from "@mui/icons-material/Home";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ffa726",
    },
    background: {
      default: "#1a1a1a",
      paper: "#242424",
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "games":
        return <Games />;
      case "stats":
        return <Stats />;
      case "profile":
        return <Profile />;
      default:
        return <Home />;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          maxWidth: { xs: "100%", md: "100%" },
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: { xs: 2, md: 3 },
            pb: { xs: 10, md: 3 },
            ml: { xs: 0, md: 0 },
          }}
        >
          {renderContent()}
        </Box>

        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
          elevation={3}
        >
          <BottomNavigation
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
            }}
            showLabels
          >
            <BottomNavigationAction
              label="Accueil"
              value="home"
              icon={<HomeIcon />}
            />
            <BottomNavigationAction
              label="Parties"
              value="games"
              icon={<SportsEsportsIcon />}
            />
            <BottomNavigationAction
              label="Stats"
              value="stats"
              icon={<BarChartIcon />}
            />
            <BottomNavigationAction
              label="Profil"
              value="profile"
              icon={<PersonIcon />}
            />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Fab,
  Stack,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import EditIcon from "@mui/icons-material/Edit";
import CreateGameDialog from "../components/CreateGameDialog";
import StopGameDialog from "../components/StopGameDialog";
import Backend from "../Backend";

interface GameSession {
  id: string;
  startTime: string;
  endTime: string | null;
}

interface GameFull {
  id: string;
  name: string;
  started: boolean;
  gameSessions: GameSession[];
  attributes: {
    bggId: string;
    playerIds: string[];
    havePassedPlayerIds: string[];
    firstPlayerId: string;
    scoring: number[];
    overDate: string | null;
  };
}

interface Player {
  id: string;
  name: string;
}

interface BGGInfo {
  thumbnailUrl: string | null;
  imageUrl: string | null;
}

function Games() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [games, setGames] = useState<GameFull[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bggInfo, setBggInfo] = useState<Record<string, BGGInfo>>({});
  const [loading, setLoading] = useState(true);
  const [runningGamesDurations, setRunningGamesDurations] = useState<
    Map<string, string>
  >(new Map());

  // Charger les parties et les joueurs
  useEffect(() => {
    fetchGames();
    fetchPlayers();
  }, []);

  // Mettre à jour les durées des parties en cours toutes les secondes
  useEffect(() => {
    const intervalId = setInterval(() => {
      const updatedDurations = new Map<string, string>();
      games.forEach((game) => {
        let duration = 0;
        game.gameSessions.forEach((session) => {
          duration +=
            (new Date(session.endTime ?? new Date().toISOString()).getTime() -
              new Date(session.startTime).getTime()) /
            1000;
        });

        const diffMs = duration * 1000;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        const durationStr = `${diffHrs}h ${diffMins}m ${diffSecs}s`;
        updatedDurations.set(game.id, durationStr);
      });
      setRunningGamesDurations(updatedDurations);
    }, 1000);

    // Cleanup: arrêter l'interval quand le composant est démonté
    return () => clearInterval(intervalId);
  }, [games]); // Re-créer l'interval quand games change

  const fetchGames = async () => {
    const fetchBGGInfo = async (gamesData: GameFull[]) => {
      const bggIds = gamesData
        .map((g) => g.attributes.bggId)
        .filter((id) => id);

      if (bggIds.length === 0) return;

      try {
        // Récupérer les infos pour chaque jeu
        const promises = bggIds.map(async (bggId) => {
          const json = await Backend.get({ path: `bgg/thing/${bggId}` });
          if (json) {
            return {
              bggId,
              info: {
                thumbnailUrl: json.attributes.thumbnailUrl,
                imageUrl: json.attributes.imageUrl,
              },
            };
          }
          return null;
        });

        const results = await Promise.all(promises);
        const bggInfoMap: Record<string, BGGInfo> = {};
        results.forEach((result) => {
          if (result) {
            bggInfoMap[result.bggId] = result.info;
          }
        });
        setBggInfo(bggInfoMap);
      } catch (error) {
        console.error("Erreur lors du chargement des infos BGG:", error);
      }
    };

    try {
      const data = await Backend.get({ path: "games?active=true" });
      if (data) {
        setGames(
          data.map((game: GameFull) => {
            game.started = game.gameSessions.some(
              (session) => session.endTime === null,
            );
            return game;
          }),
        );
        // Récupérer les infos BGG pour chaque jeu
        fetchBGGInfo(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des parties:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const data = await Backend.get({ path: "players" });
      if (data) {
        setPlayers(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des joueurs:", error);
    }
  };

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Joueur inconnu";
  };

  const handleCreateGame = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async (gameData: {
    gameId: string;
    gameName: string;
    playerIds: string[];
  }) => {
    try {
      // Créer la partie dans le backend
      const data = await Backend.post({
        path: "game",
        body: {
          name: gameData.gameName,
          attributes: {
            bggId: gameData.gameId,
            playerIds: gameData.playerIds,
            havePassedPlayerIds: [],
            firstPlayerId: gameData.playerIds[0], // Premier joueur = premier de la liste
            scoring: [],
          },
        },
      });

      if (data) {
        // Rafraîchir la liste des parties
        await fetchGames();

        setDialogOpen(false);
      } else {
        console.error("Erreur lors de la création de la partie");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const startGame = async (gameId: string) => {
    try {
      await Backend.post({
        path: `game/${gameId}/session`,
        body: { startTime: new Date() },
      }).then(async (data) => {
        if (data) {
          // Rafraîchir la liste des parties
          await fetchGames();
        } else {
          console.error("Erreur lors du démarrage de la partie");
        }
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const endGame = async (gameId: string) => {
    try {
      await Backend.post({ path: `game/${gameId}/end` }).then(async (data) => {
        if (data) {
          // Rafraîchir la liste des parties
          await fetchGames();
          setStopDialogOpen(false);
        } else {
          console.error("Erreur lors de la fin de la partie");
        }
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const endCurrentSession = async (gameId: string) => {
    try {
      const game = games.find((g) => g.id === gameId);
      if (!game) return;

      const currentSession = game.gameSessions.find((s) => s.endTime === null);
      if (!currentSession) return;

      await Backend.post({
        path: `game/${gameId}/session/${currentSession.id}`,
        body: {
          startTime: currentSession.startTime,
          endTime: new Date().toISOString(),
        },
      }).then(async (data) => {
        if (data) {
          await fetchGames();
          setStopDialogOpen(false);
        } else {
          console.error("Erreur lors de la fin de la session");
        }
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleStopClick = (gameId: string) => {
    setSelectedGameId(gameId);
    setStopDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h3" component="h1">
            🎮 Parties
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGame}
          >
            Add
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : games.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Aucune partie pour le moment. Créez-en une !
          </Typography>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1, mb: 6 }}>
            {games.map((game) => (
              <Grid key={game.id} size={12}>
                <Card
                  sx={{
                    position: "relative",
                    borderLeft: game.started ? 5 : 0,
                    borderColor: "green",
                  }}
                >
                  {!game.started && (game.attributes.overDate ?? "") === "" && (
                    <Fab
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                      }}
                      onClick={() => {
                        startGame(game.id);
                      }}
                      disabled={(game.attributes.playerIds ?? []).length === 0}
                    >
                      <PlayArrowIcon />
                    </Fab>
                  )}

                  {game.started && (
                    <Fab
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                      }}
                      onClick={() => {
                        handleStopClick(game.id);
                      }}
                      disabled={(game.attributes.overDate ?? null) !== null}
                    >
                      <StopIcon />
                    </Fab>
                  )}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      right: 16,
                    }}
                    onClick={() => {
                      // TODO: Implémenter l'édition
                      console.log("Edit game", game.id);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <CardContent sx={{ pr: 8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {bggInfo[game.attributes.bggId]?.thumbnailUrl && (
                        <img
                          src={bggInfo[game.attributes.bggId].thumbnailUrl!}
                          alt={game.name}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      )}
                      <Typography variant="h6" component="div" gutterBottom>
                        {game.name}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={{ xs: 1, sm: 2 }}
                      useFlexGap
                      sx={{ mt: 2, flexWrap: "wrap" }}
                    >
                      <Paper sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {game.attributes.playerIds?.map((playerId) => (
                          <Chip
                            key={playerId}
                            label={getPlayerName(playerId)}
                            size="medium"
                            color={
                              playerId === game.attributes.firstPlayerId
                                ? "primary"
                                : "default"
                            }
                            variant={
                              playerId === game.attributes.firstPlayerId
                                ? "filled"
                                : "outlined"
                            }
                          />
                        ))}
                      </Paper>
                    </Stack>
                    <Stack sx={{ mt: 2 }} direction="row" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Running since:{" "}
                        {runningGamesDurations.get(game.id) || "N/A"}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <CreateGameDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
      />

      <StopGameDialog
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        onEndSession={() => selectedGameId && endCurrentSession(selectedGameId)}
        onEndGame={() => selectedGameId && endGame(selectedGameId)}
      />
    </Container>
  );
}

export default Games;

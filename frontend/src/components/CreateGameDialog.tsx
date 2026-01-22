import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

interface GameOption {
  id: string;
  label: string;
  attributes: {
    type: string;
    yearPublished: number | null;
    thumbnailUrl: string | null;
    imageUrl: string | null;
  };
}

interface Player {
  id: string;
  name: string;
}

interface CreateGameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (gameData: {
    gameId: string;
    gameName: string;
    playerIds: string[];
  }) => void;
}

function CreateGameDialog({ open, onClose, onSubmit }: CreateGameDialogProps) {
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);
  const [gameOptions, setGameOptions] = useState<GameOption[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gameSearchInput, setGameSearchInput] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [playerSearchInput, setPlayerSearchInput] = useState("");

  // Charger tous les joueurs au montage
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("http://localhost:3001/players");
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des joueurs:", error);
      }
    };
    if (open) {
      fetchPlayers();
    }
  }, [open]);

  // Recherche de jeux avec debounce
  useEffect(() => {
    if (!gameSearchInput || gameSearchInput.length < 3) {
      setGameOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingGames(true);
      try {
        const response = await fetch(
          `http://localhost:3001/bgg/search?query=${encodeURIComponent(gameSearchInput)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setGameOptions(data);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche de jeux:", error);
      } finally {
        setLoadingGames(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gameSearchInput]);

  const handleAddPlayer = async (
    player: Player | null,
    inputValue?: string,
  ) => {
    // Si un joueur existant est sélectionné
    if (player && !selectedPlayers.find((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
      setPlayerSearchInput(""); // Vider le champ de recherche
      return;
    }

    // Si un nouveau nom est entré (pas dans la liste)
    if (
      inputValue &&
      inputValue.trim() &&
      !players.find((p) => p.name.toLowerCase() === inputValue.toLowerCase())
    ) {
      try {
        const response = await fetch("http://localhost:3001/player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: inputValue.trim(),
          }),
        });

        if (response.ok) {
          const newPlayer = await response.json();
          // Ajouter le nouveau joueur à la liste
          setPlayers([...players, newPlayer]);
          setSelectedPlayers([...selectedPlayers, newPlayer]);
          setPlayerSearchInput(""); // Vider le champ de recherche
        }
      } catch (error) {
        console.error("Erreur lors de la création du joueur:", error);
      }
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const handleMovePlayer = (index: number, direction: "up" | "down") => {
    const newPlayers = [...selectedPlayers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newPlayers.length) {
      [newPlayers[index], newPlayers[targetIndex]] = [
        newPlayers[targetIndex],
        newPlayers[index],
      ];
      setSelectedPlayers(newPlayers);
    }
  };

  const handleSubmit = () => {
    if (!selectedGame || selectedPlayers.length === 0) {
      return;
    }

    onSubmit({
      gameId: selectedGame.id,
      gameName: selectedGame.label,
      playerIds: selectedPlayers.map((p) => p.id),
    });

    // Reset
    setSelectedGame(null);
    setSelectedPlayers([]);
    setPlayerSearchInput("");
    setGameSearchInput("");
  };

  const canSubmit = selectedGame && selectedPlayers.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Créer une nouvelle partie</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          {/* Sélection du jeu */}
          <Autocomplete
            autoFocus
            options={gameOptions}
            getOptionLabel={(option) =>
              `${option.label}${option.attributes.yearPublished ? ` (${option.attributes.yearPublished})` : ""}`
            }
            value={selectedGame}
            onChange={(_, newValue) => setSelectedGame(newValue)}
            onInputChange={(_, newValue) => setGameSearchInput(newValue)}
            loading={loadingGames}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rechercher un jeu"
                variant="outlined"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingGames ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box component="li" key={key} {...optionProps} sx={{ gap: 2 }}>
                  {option.attributes.thumbnailUrl && (
                    <img
                      src={option.attributes.thumbnailUrl}
                      alt={option.label}
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  )}
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    {option.attributes.yearPublished && (
                      <Typography variant="caption" color="text.secondary">
                        {option.attributes.yearPublished}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
          />

          {/* Sélection des joueurs */}
          <Box>
            <Autocomplete
              options={players.filter(
                (p) => !selectedPlayers.find((sp) => sp.id === p.id),
              )}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.name
              }
              onChange={(_, newValue, reason) => {
                if (reason === "selectOption") {
                  handleAddPlayer(newValue as Player);
                }
              }}
              onInputChange={(_, newInputValue, reason) => {
                if (reason === "input") {
                  setPlayerSearchInput(newInputValue);
                }
              }}
              onBlur={(event) => {
                const target = event.target as HTMLInputElement;
                const inputValue = target.value;
                if (inputValue && inputValue.trim()) {
                  // Vérifier si ce n'est pas un joueur existant
                  const existingPlayer = players.find(
                    (p) => p.name.toLowerCase() === inputValue.toLowerCase(),
                  );
                  if (!existingPlayer) {
                    handleAddPlayer(null, inputValue);
                  }
                }
              }}
              inputValue={playerSearchInput}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ajouter un joueur"
                  variant="outlined"
                  helperText="Tapez Enter pour créer un nouveau joueur"
                />
              )}
              value={null}
            />

            {selectedPlayers.length > 0 && (
              <List sx={{ mt: 2 }}>
                {selectedPlayers.map((player, index) => (
                  <ListItem
                    key={player.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText primary={player.name} />
                    <ListItemSecondaryAction sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleMovePlayer(index, "up")}
                        title="Monter"
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === selectedPlayers.length - 1}
                        onClick={() => handleMovePlayer(index, "down")}
                        title="Descendre"
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemovePlayer(player.id)}
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
        >
          Créer la partie
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateGameDialog;

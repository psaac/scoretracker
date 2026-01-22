import { Pause, Stop } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface StopGameDialogProps {
  open: boolean;
  onClose: () => void;
  onEndSession: () => void;
  onEndGame: () => void;
}

function StopGameDialog({
  open,
  onClose,
  onEndSession,
  onEndGame,
}: StopGameDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Gestion de la partie</DialogTitle>
      <DialogContent>
        <Typography>Que souhaitez-vous faire ?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onEndSession} color="primary" startIcon={<Pause />}>
          Pause
        </Button>
        <Button onClick={onEndGame} color="error" startIcon={<Stop />}>
          Terminer le jeu
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StopGameDialog;

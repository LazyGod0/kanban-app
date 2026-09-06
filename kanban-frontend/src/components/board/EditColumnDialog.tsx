import { type SubmitEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

type EditColumnDialogProps = {
  open: boolean;
  name: string;
  position: number;
  maxPosition: number;
  error: string;
  onNameChange: (name: string) => void;
  onPositionChange: (position: number) => void;
  onClose: () => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

function EditColumnDialog({
  open,
  name,
  position,
  maxPosition,
  error,
  onNameChange,
  onPositionChange,
  onClose,
  onSubmit,
}: EditColumnDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Stack component="form" onSubmit={onSubmit}>
        <DialogTitle>Edit column</DialogTitle>
        <DialogContent>
          <TextField
            label="Column name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
          <TextField
            label="Position"
            type="number"
            value={position}
            onChange={(event) => onPositionChange(Number(event.target.value))}
            slotProps={{
              htmlInput: { min: 0, max: maxPosition, step: 1 },
            }}
            helperText={`Choose a position from 0 to ${maxPosition}. Other columns will move automatically.`}
            required
            fullWidth
            sx={{ mt: 2 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || position < 0 || position > maxPosition}
          >
            Save
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

export default EditColumnDialog;

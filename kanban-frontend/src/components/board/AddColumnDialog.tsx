import type { SubmitEvent } from "react";
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

type AddColumnDialogProps = {
  open: boolean;
  columnName: string;
  isAdding: boolean;
  onColumnNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AddColumnDialog({
  open,
  columnName,
  isAdding,
  onColumnNameChange,
  onClose,
  onSubmit,
}: AddColumnDialogProps) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={() => !isAdding && onClose()}
      maxWidth="xs"
      fullWidth
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add column</DialogTitle>
        <DialogContent>
          <TextField
            label="Column name"
            value={columnName}
            onChange={(event) => onColumnNameChange(event.target.value)}
            required
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!columnName.trim() || isAdding}
          >
            {isAdding ? "Adding..." : "Add column"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

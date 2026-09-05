import {
  Button,
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
  return (
    <Dialog
      open={open}
      onClose={() => !isAdding && onClose()}
      maxWidth="xs"
      fullWidth
    >
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
        <Button onClick={onClose} disabled={isAdding}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={!columnName.trim() || isAdding}
        >
          {isAdding ? "Adding..." : "Add column"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

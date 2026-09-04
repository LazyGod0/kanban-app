import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

type DeletePopUpProps = {
  open: boolean;
  itemName?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeletePopUp({
  open,
  itemName = "this item",
  isDeleting = false,
  onClose,
  onConfirm,
}: DeletePopUpProps) {
  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete {itemName}?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeletePopUp;

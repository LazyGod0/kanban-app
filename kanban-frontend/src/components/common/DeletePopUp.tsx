import type { SubmitEvent } from "react";
import {
  Button,
  Box,
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
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Delete {itemName}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default DeletePopUp;

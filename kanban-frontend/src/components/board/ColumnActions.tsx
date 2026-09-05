import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../lib/api";
import type { Column } from "../../interfaces/Column";
import DeletePopUp from "../common/DeletePopUp";

type ColumnActionsProps = {
  boardId: string;
  column: Column;
  maxPosition: number;
  onUpdated: (column: Column) => void;
  onDeleted: (columnId: string) => void;
};

type ApiError = {
  detail?: string;
};

function ColumnActions({
  boardId,
  column,
  maxPosition,
  onUpdated,
  onDeleted,
}: ColumnActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletePopUpOpen, setIsDeletePopUpOpen] = useState(false);
  const [name, setName] = useState(column.name);
  const [position, setPosition] = useState(column.position);
  const [error, setError] = useState("");

  const updateColumn = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || position < 0 || position > maxPosition) return;

    setIsEditing(true);
    setError("");
    try {
      const response = await api.patch<Column>(
        `/board/${boardId}/column/${column.id}`,
        { name: nextName, position },
      );
      onUpdated(response.data);
      setIsEditing(false);
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to update column.",
      );
    }
  };

  const deleteColumn = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await api.delete(`/board/${boardId}/column/${column.id}`);
      onDeleted(column.id);
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to delete column.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Stack
        className="column-actions"
        direction="row"
        spacing={0.5}
        sx={{
          opacity: 0,
          transition: "opacity 160ms ease",
          flexShrink: 0,
          "&:focus-within": { opacity: 1 },
        }}
      >
        <Tooltip title="Edit column">
          <IconButton
            size="small"
            color="primary"
            aria-label={`Edit ${column.name}`}
            onClick={() => {
              setName(column.name);
              setPosition(column.position);
              setError("");
              setIsEditing(true);
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete column">
          <IconButton
            size="small"
            color="error"
            aria-label={`Delete ${column.name}`}
            onClick={() => setIsDeletePopUpOpen(true)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="xs"
        fullWidth
      >
        <Stack component="form" onSubmit={updateColumn}>
          <DialogTitle>Edit column</DialogTitle>
          <DialogContent>
            <TextField
              label="Column name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              autoFocus
              sx={{ mt: 1 }}
            />
            <TextField
              label="Position"
              type="number"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              slotProps={{
                htmlInput: { min: 0, max: maxPosition, step: 1 },
              }}
              helperText={`Choose a position from 0 to ${maxPosition}. Other columns will move automatically.`}
              required
              fullWidth
              sx={{ mt: 2 }}
            />
            {error && <p>{error}</p>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
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
      <DeletePopUp
        open={isDeletePopUpOpen}
        itemName={`column "${column.name}"`}
        isDeleting={isDeleting}
        onClose={() => setIsDeletePopUpOpen(false)}
        onConfirm={deleteColumn}
      />
    </>
  );
}

export default ColumnActions;

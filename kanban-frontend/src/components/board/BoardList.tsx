import {
  Box,
  Button,
  Card,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type SubmitEvent } from "react";
import type { Board } from "../../interfaces/Board";
import AddBoardForm from "./AddBoardForm";
import DeletePopUp from "../common/DeletePopUp";
import InviteBoardForm from "./InviteBoardForm";
import ManageMembersDialog from "./ManageMembersDialog";

type BoardListProps = {
  boards: Board[];
  onBoardCreated: (board: Board) => void;
  onBoardUpdated: (board: Board) => Promise<Board>;
  onBoardDeleted: (boardId: string) => Promise<void>;
};

function BoardList({
  boards,
  onBoardCreated,
  onBoardUpdated,
  onBoardDeleted,
}: BoardListProps) {
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [actionError, setActionError] = useState("");

  const startEditing = (board: Board) => {
    setActionError("");
    setEditingBoardId(board.id);
    setEditingName(board.name);
  };

  const cancelEditing = () => {
    setEditingBoardId(null);
    setEditingName("");
  };

  const saveBoard = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBoardId) return;

    setIsSaving(true);
    setActionError("");
    try {
      await onBoardUpdated({
        ...boards.find((board) => board.id === editingBoardId)!,
        name: editingName.trim(),
      });
      cancelEditing();
    } catch {
      setActionError("Unable to update this board.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBoard = async () => {
    if (!boardToDelete) return;

    setDeletingBoardId(boardToDelete.id);
    setActionError("");
    try {
      await onBoardDeleted(boardToDelete.id);
      setBoardToDelete(null);
    } catch {
      setActionError("Unable to delete this board.");
    } finally {
      setDeletingBoardId(null);
    }
  };

  return (
    <Card variant="outlined">
      <List disablePadding>
        <AddBoardForm onCreated={onBoardCreated} />
        {actionError && (
          <Typography color="error" sx={{ px: 2.5, pt: 2 }}>
            {actionError}
          </Typography>
        )}
        {boards.length === 0 && (
          <Box sx={{ p: 2.5 }}>
            <Typography color="text.secondary">
              You are not a member of any boards yet.
            </Typography>
          </Box>
        )}
        {boards.map((board, index) => (
          <Box key={board.id}>
            {editingBoardId === board.id ? (
              <Box component="form" onSubmit={saveBoard} sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <TextField
                    label="Board name"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    required
                    fullWidth
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", px: 2.5, py: 1 }}
              >
                <ListItemButton component="div" sx={{ minWidth: 0, px: 0 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 700 }}>
                        {board.name}
                      </Typography>
                    }
                    secondary={`Created ${new Date(board.createdAt).toLocaleDateString()}`}
                  />
                </ListItemButton>
                {board.isOwner && (
                  <>
                    <Button size="small" onClick={() => startEditing(board)}>
                      Edit
                    </Button>
                    <ManageMembersDialog
                      boardId={board.id}
                      boardName={board.name}
                    />
                    <InviteBoardForm boardId={board.id} />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setBoardToDelete(board)}
                      disabled={deletingBoardId === board.id}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Stack>
            )}
            {index < boards.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
      <DeletePopUp
        open={boardToDelete !== null}
        itemName={
          boardToDelete?.name ? `board "${boardToDelete.name}"` : "board"
        }
        isDeleting={deletingBoardId !== null}
        onClose={() => setBoardToDelete(null)}
        onConfirm={deleteBoard}
      />
    </Card>
  );
}

export default BoardList;

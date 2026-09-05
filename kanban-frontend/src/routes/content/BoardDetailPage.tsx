import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import ColumnActions from "../../components/board/ColumnActions";
import type { Board } from "../../interfaces/Board";
import type { Column } from "../../interfaces/Column";

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!boardId) return;

    const fetchBoard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const boardResponse = await api.get<Board>(`/board/${boardId}`);
        setBoard(boardResponse.data);
      } catch (requestError) {
        const responseError = requestError as AxiosError<{ detail?: string }>;
        setError(
          responseError.response?.data?.detail ??
            "Unable to load board information.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  const fetchColumns = useCallback(async () => {
    if (!boardId) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<Column[]>(`/board/${boardId}/column`);
      setColumns(
        [...response.data].sort(
          (left, right) => left.position - right.position,
        ),
      );
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      setError(
        responseError.response?.data?.detail ?? "Unable to load columns.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const handleColumnUpdated = async (_updatedColumn: Column) => {
    await fetchColumns();
  };

  const handleAddColumn = async () => {
    if (!boardId || !newColumnName.trim()) return;

    setIsAddingColumn(true);
    setError("");
    try {
      await api.post<Column[]>(`/board/${boardId}/column`, [
        { name: newColumnName.trim(), position: columns.length },
      ]);
      await fetchColumns();
      setNewColumnName("");
      setIsAddColumnOpen(false);
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      setError(responseError.response?.data?.detail ?? "Unable to add column.");
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleColumnDeleted = async (_columnId: string) => {
    await fetchColumns();
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          Board columns
        </Typography>
        {board?.isOwner && columns.length < 3 && (
          <Button
            sx={{ textTransform: "none" }}
            onClick={() => setIsAddColumnOpen(true)}
          >
            <Typography>Add Column</Typography>
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {!error && columns.length === 0 && (
        <Typography color="text.secondary">
          This board has no columns.
        </Typography>
      )}
      {!error && columns.length > 0 && (
        <Box sx={{ overflowX: "auto", pb: 1 }}>
          <Grid
            container
            columns={columns.length}
            spacing={1.5}
            wrap="nowrap"
            sx={{ minWidth: `${columns.length * 220}px` }}
          >
            {columns.map((column) => (
              <Grid
                key={column.id}
                size={1}
                sx={{
                  position: "relative",
                  minWidth: 220,
                  p: 2,
                  minHeight: 180,
                  borderRadius: 2,
                  bgcolor: "white",
                  boxShadow: "sm",
                  "&:hover .column-actions, &:focus-within .column-actions": {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {column.name}
                  </Typography>
                  {board?.isOwner && (
                    <ColumnActions
                      boardId={boardId ?? ""}
                      column={column}
                      maxPosition={columns.length - 1}
                      onUpdated={handleColumnUpdated}
                      onDeleted={handleColumnDeleted}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 4, textAlign: "center" }}
                >
                  No tasks have been added to this column.
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog
        open={isAddColumnOpen}
        onClose={() => !isAddingColumn && setIsAddColumnOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add column</DialogTitle>
        <DialogContent>
          <TextField
            label="Column name"
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
            required
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAddColumnOpen(false)}
            disabled={isAddingColumn}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddColumn}
            variant="contained"
            disabled={!newColumnName.trim() || isAddingColumn}
          >
            {isAddingColumn ? "Adding..." : "Add column"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

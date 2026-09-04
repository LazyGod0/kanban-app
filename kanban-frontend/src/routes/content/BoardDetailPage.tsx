import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import ColumnActions from "../../components/board/ColumnActions";
import type { Column } from "../../interfaces/Column";

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!boardId) return;

    const loadColumns = async () => {
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
          responseError.response?.data?.detail ??
            "Unable to load columns for this board.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadColumns();
  }, [boardId]);

  const handleColumnUpdated = (updatedColumn: Column) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === updatedColumn.id
          ? { ...column, ...updatedColumn }
          : column,
      ),
    );
  };

  const handleColumnDeleted = (columnId: string) => {
    setColumns((current) => current.filter((column) => column.id !== columnId));
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 2, fontWeight: 800 }}>
        Board columns
      </Typography>
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
                  <ColumnActions
                    boardId={boardId ?? ""}
                    column={column}
                    onUpdated={handleColumnUpdated}
                    onDeleted={handleColumnDeleted}
                  />
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
    </Box>
  );
}

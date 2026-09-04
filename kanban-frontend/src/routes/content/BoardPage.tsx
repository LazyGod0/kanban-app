import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BoardList from "../../components/board/BoardList";
import AccountCard from "../../components/board/AccountCard";
import type { Board } from "../../interfaces/Board";

function BoardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleBoardCreated = (board: Board) => {
    setBoards((current) => [board, ...current]);
  };

  const handleBoardUpdated = async (board: Board) => {
    const response = await api.patch<Board>(`/board/${board.id}`, {
      name: board.name,
    });
    setBoards((current) =>
      current.map((currentBoard) =>
        currentBoard.id === response.data.id ? response.data : currentBoard,
      ),
    );
    return response.data;
  };

  const handleBoardDeleted = async (boardId: string) => {
    await api.delete(`/board/${boardId}`);
    setBoards((current) => current.filter((board) => board.id !== boardId));
  };

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const response = await api.get<Board[]>("/board");
        setBoards(response.data);
      } catch (requestError) {
        const errorResponse = requestError as AxiosError<{ detail?: string }>;
        setError(
          errorResponse.response?.data?.detail ??
            "Unable to load your boards. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBoards();
  }, []);

  return (
    <Box sx={{ minHeight: "100svh", py: { xs: 4, md: 8 } }}>
      <Stack
        spacing={3}
        sx={{ width: "100%", maxWidth: 720, mx: "auto", px: 2 }}
      >
        <AccountCard
          user={user}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        <Box>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800, mb: 1 }}
          >
            Your boards
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Boards you created or joined.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {isLoading ? (
            <Stack sx={{ py: 6, alignItems: "center" }}>
              <CircularProgress />
            </Stack>
          ) : (
            <BoardList
              boards={boards}
              onBoardCreated={handleBoardCreated}
              onBoardUpdated={handleBoardUpdated}
              onBoardDeleted={handleBoardDeleted}
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

export default BoardPage;

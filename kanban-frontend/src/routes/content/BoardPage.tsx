import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../lib/api";
import BoardList from "../../components/board/BoardList";
import InviteList from "../../components/board/InviteList";
import type { Board, BoardInvite } from "../../interfaces/Board";

function BoardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [invites, setInvites] = useState<BoardInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [inviteActionId, setInviteActionId] = useState("");
  const [error, setError] = useState("");

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

  const loadPageData = async (showLoading = false) => {
    if (showLoading) setIsReloading(true);
    setError("");
    try {
      const [boardsResponse, invitesResponse] = await Promise.all([
        api.get<Board[]>("/board"),
        api.get<BoardInvite[]>("/board/invites"),
      ]);
      setBoards(boardsResponse.data);
      setInvites(invitesResponse.data);
    } catch (requestError) {
      const errorResponse = requestError as AxiosError<{ detail?: string }>;
      setError(
        errorResponse.response?.data?.detail ??
          "Unable to load your boards and invitations. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsReloading(false);
    }
  };

  const handleInviteAction = async (
    inviteId: string,
    action: "accept" | "reject",
  ) => {
    setInviteActionId(inviteId);
    setError("");
    try {
      await api.post(`/board/invites/${inviteId}/${action}`);
      await loadPageData();
    } catch (requestError) {
      const errorResponse = requestError as AxiosError<{ detail?: string }>;
      setError(
        errorResponse.response?.data?.detail ??
          "Unable to update this invitation. Please try again.",
      );
    } finally {
      setInviteActionId("");
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
          Your boards
        </Typography>
        <Button
          size="small"
          onClick={() => loadPageData(true)}
          disabled={isReloading || isLoading || Boolean(inviteActionId)}
        >
          {isReloading ? "Reloading..." : "Reload invitations"}
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Boards you created or joined.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {invites.length > 0 && (
        <InviteList
          invites={invites}
          inviteActionId={inviteActionId}
          handleInviteAction={handleInviteAction}
        />
      )}
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
  );
}

export default BoardPage;

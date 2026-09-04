import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BoardList from "../../components/board/BoardList";
import AccountCard from "../../components/board/AccountCard";
import type { Board, BoardInvite } from "../../interfaces/Board";

function BoardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [invites, setInvites] = useState<BoardInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [inviteActionId, setInviteActionId] = useState("");
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
            <Paper component="section" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Pending invitations
              </Typography>
              <Stack divider={<Divider />}>
                {invites.map((invite) => (
                  <Stack
                    key={invite.id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ py: 1.25, justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        {invite.boardName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Invited by {invite.inviterName}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => handleInviteAction(invite.id, "reject")}
                        disabled={Boolean(inviteActionId)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleInviteAction(invite.id, "accept")}
                        disabled={Boolean(inviteActionId)}
                      >
                        {inviteActionId === invite.id ? "Working..." : "Accept"}
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>
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
      </Stack>
    </Box>
  );
}

export default BoardPage;

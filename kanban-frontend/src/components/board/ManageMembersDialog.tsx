import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../lib/api";
import type { BoardMember } from "../../interfaces/Board";

type ManageMembersDialogProps = {
  boardId: string;
  boardName: string;
};

function ManageMembersDialog({ boardId, boardName }: ManageMembersDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loadMembers = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<BoardMember[]>(
          `/board/${boardId}/members`,
        );
        setMembers(response.data);
      } catch (requestError) {
        const errorResponse = requestError as AxiosError<{ detail?: string }>;
        setError(
          errorResponse.response?.data?.detail ??
            "Unable to load board members.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [boardId, isOpen]);

  const removeMember = async (member: BoardMember) => {
    setRemovingMemberId(member.id);
    setError("");
    try {
      await api.delete(`/board/${boardId}/members/${member.id}`);
      setMembers((current) =>
        current.filter((currentMember) => currentMember.id !== member.id),
      );
    } catch (requestError) {
      const errorResponse = requestError as AxiosError<{ detail?: string }>;
      setError(
        errorResponse.response?.data?.detail ?? "Unable to remove this member.",
      );
    } finally {
      setRemovingMemberId("");
    }
  };

  return (
    <>
      <Button
        size="small"
        aria-label={`Manage members of ${boardName}`}
        onClick={() => setIsOpen(true)}
      >
        Members
      </Button>
      <Dialog
        open={isOpen}
        onClose={removingMemberId ? undefined : () => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Members of {boardName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {isLoading ? (
              <Stack sx={{ alignItems: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : members.length === 0 ? (
              <Typography color="text.secondary">
                This board has no members yet.
              </Typography>
            ) : (
              <List disablePadding>
                {members.map((member) => (
                  <ListItem
                    key={member.id}
                    secondaryAction={
                      member.role === "member" ? (
                        <Button
                          size="small"
                          color="error"
                          aria-label={`Remove ${member.name}`}
                          onClick={() => removeMember(member)}
                          disabled={Boolean(removingMemberId)}
                        >
                          Remove
                        </Button>
                      ) : undefined
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>{member.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 700 }}>
                          {member.name} {member.role === "owner" && "(Owner)"}
                        </Typography>
                      }
                      secondary={member.email}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              onClick={() => setIsOpen(false)}
              disabled={Boolean(removingMemberId)}
            >
              Close
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ManageMembersDialog;

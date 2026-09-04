import { Paper, Typography, Stack, Divider, Box, Button } from "@mui/material";
import type { BoardInvite } from "../../interfaces/Board";

interface InviteListProps {
  invites: BoardInvite[];
  inviteActionId: string;
  handleInviteAction: (inviteId: string, type: "accept" | "reject") => void;
}

export default function InviteList({
  invites,
  handleInviteAction,
  inviteActionId,
}: InviteListProps) {
  return (
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
  );
}

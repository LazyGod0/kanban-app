import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import api from "../../lib/api";

type InviteBoardFormProps = {
  boardId: string;
};

type InviteError = {
  detail?: string | { msg: string }[];
};

function InviteBoardForm({ boardId }: InviteBoardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSending(true);

    try {
      await api.post(`/board/${boardId}/invites`, { email });
      setMessage("Invitation sent.");
      setEmail("");
    } catch (requestError) {
      const responseError = requestError as AxiosError<InviteError>;
      const detail = responseError.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(" ")
          : (detail ?? "Unable to send the invitation."),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button size="small" onClick={() => setIsOpen(true)}>
        Invite
      </Button>
      <Dialog
        open={isOpen}
        onClose={isSending ? undefined : () => setIsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Invite someone to this board</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            onSubmit={handleSubmit}
            id={`invite-form-${boardId}`}
            spacing={2}
            sx={{ pt: 1 }}
          >
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={`invite-form-${boardId}`}
            variant="contained"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send invitation"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default InviteBoardForm;

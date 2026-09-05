import { useEffect, useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Stack,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs, { type Dayjs } from "dayjs";
import api from "../../lib/api";
import type { BoardMember } from "../../interfaces/Board";
import type { Task } from "../../interfaces/Task";
import DatePickerComponent from "../common/DatePicker";

type TaskDetailDialogProps = {
  open: boolean;
  boardId: string;
  columnId: string;
  task: Task;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

type ApiError = { detail?: string };

type Assignee = Pick<BoardMember, "id" | "name" | "email"> & {
  assignedBy?: string | null;
  assignedByName?: string | null;
  assignedByEmail?: string | null;
};

export default function TaskDetailDialog({
  open,
  boardId,
  columnId,
  task,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState<Dayjs | null>(
    task.dueDate ? dayjs(task.dueDate) : null,
  );
  const [members, setMembers] = useState<Assignee[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ? dayjs(task.dueDate) : null);

    const loadDetails = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [membersResponse, assigneesResponse] = await Promise.all([
          api.get<Assignee[]>(`/board/${boardId}/members`),
          api.get<Assignee[]>(
            `/board/${boardId}/column/${columnId}/tasks/${task.id}/assignees`,
          ),
        ]);
        setMembers(membersResponse.data);
        setSelectedMembers(assigneesResponse.data);
      } catch (requestError) {
        const responseError = requestError as AxiosError<ApiError>;
        setError(
          responseError.response?.data?.detail ??
            "Unable to load task details.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [boardId, columnId, open, task]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await api.patch<Task>(
        `/board/${boardId}/column/${columnId}/tasks/${task.id}`,
        {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate?.toISOString() ?? null,
        },
      );

      const originalAssigneeIds = new Set(
        (
          await api.get<Assignee[]>(
            `/board/${boardId}/column/${columnId}/tasks/${task.id}/assignees`,
          )
        ).data.map((member) => member.id),
      );
      const selectedAssigneeIds = new Set(
        selectedMembers.map((member) => member.id),
      );

      await Promise.all([
        ...selectedMembers
          .filter((member) => !originalAssigneeIds.has(member.id))
          .map((member) =>
            api.post(
              `/board/${boardId}/column/${columnId}/tasks/${task.id}/assignees/${member.id}`,
            ),
          ),
        ...[...originalAssigneeIds]
          .filter((memberId) => !selectedAssigneeIds.has(memberId))
          .map((memberId) =>
            api.delete(
              `/board/${boardId}/column/${columnId}/tasks/${task.id}/assignees/${memberId}`,
            ),
          ),
      ]);

      onUpdated(response.data);
      onClose();
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to update task.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await api.delete(`/board/${boardId}/column/${columnId}/tasks/${task.id}`);
      onDeleted(task.id);
      onClose();
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to delete task.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const assignedBy = selectedMembers.find(
    (member) => member.assignedByName || member.assignedByEmail,
  );

  return (
    <Dialog
      open={open}
      onClose={isSubmitting || isDeleting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogTitle>Task details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {isLoading ? (
              <Stack sx={{ alignItems: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 200 } }}
                  required
                  fullWidth
                  autoFocus
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <DatePickerComponent value={dueDate} onChange={setDueDate} />
                <Autocomplete
                  multiple
                  options={members}
                  value={selectedMembers}
                  onChange={(_, nextMembers) => setSelectedMembers(nextMembers)}
                  getOptionLabel={(member) =>
                    `${member.name} (${member.email})`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderValue={(values, getItemProps) =>
                    values.map((member, index) => (
                      <Chip
                        {...getItemProps({ index })}
                        key={member.id}
                        label={member.email}
                        deleteIcon={<CloseIcon fontSize="small" />}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Assignees" />
                  )}
                />
                <Typography variant="caption" color="text.secondary">
                  Assigned by:{" "}
                  {assignedBy?.assignedByName && assignedBy.assignedByEmail
                    ? `${assignedBy.assignedByName} (${assignedBy.assignedByEmail})`
                    : "Pending"}
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={isLoading || isSubmitting || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={onClose} disabled={isSubmitting || isDeleting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isSubmitting || isDeleting || !title.trim()}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

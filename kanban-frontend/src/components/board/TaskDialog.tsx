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
  Stack,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../lib/api";
import type { BoardMember } from "../../interfaces/Board";
import type { Task } from "../../interfaces/Task";
import type { Tag } from "../../interfaces/Tag";
import DatePickerComponent from "../common/DatePicker";
import TagSelector from "./TagSelector";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

type TaskDialogProps = {
  open: boolean;
  boardId: string;
  columnId: string;
  columnName: string;
  onClose: () => void;
  onCreated?: (task: Task) => void;
  tags: Tag[];
  isLoadingTags: boolean;
  onCreateTag: (name: string) => Promise<Tag | null>;
  onDeleteTag: (tag: Tag) => Promise<void>;
};

type ApiError = { detail?: string };

export default function TaskDialog({
  open,
  boardId,
  columnId,
  columnName,
  onClose,
  onCreated,
  tags,
  isLoadingTags,
  onCreateTag,
  onDeleteTag,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duedate, setDuedate] = useState<Dayjs | null>(dayjs());
  const [selectedMembers, setSelectedMembers] = useState<BoardMember[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadMembers = async () => {
      setIsLoadingMembers(true);
      setError("");
      try {
        const response = await api.get<BoardMember[]>(
          `/board/${boardId}/members`,
        );
        setMembers(response.data);
      } catch (requestError) {
        const responseError = requestError as AxiosError<ApiError>;
        setError(
          responseError.response?.data?.detail ??
            "Unable to load board members.",
        );
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [boardId, open]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setSelectedMembers([]);
    setSelectedTags([]);
    setError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await api.post<Task>(
        `/board/${boardId}/column/${columnId}/tasks`,
        {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: duedate?.toISOString() ?? null,
          tagIds: selectedTags.map((tag) => tag.id),
        },
      );

      await Promise.all(
        selectedMembers.map((member) =>
          api.post(
            `/board/${boardId}/column/${columnId}/tasks/${response.data.id}/assignees/${member.id}`,
          ),
        ),
      );

      onCreated?.(response.data);
      reset();
      onClose();
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to create task.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Stack component="form" onSubmit={handleSubmit}>
        <DialogTitle>Add task to {columnName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
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
            <DatePickerComponent
              value={duedate}
              onChange={(newValue) => setDuedate(newValue)}
            />
            <Autocomplete
              multiple
              options={members}
              value={selectedMembers}
              onChange={(_, nextMembers) => setSelectedMembers(nextMembers)}
              getOptionLabel={(member) => `${member.name} (${member.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disabled={isLoadingMembers || isSubmitting}
              renderValue={(tagMembers, getItemProps) =>
                tagMembers.map((member, index) => (
                  <Chip
                    {...getItemProps({ index })}
                    key={member.id}
                    label={member.email}
                    deleteIcon={<CloseIcon fontSize="small" />}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignees"
                  helperText={
                    isLoadingMembers
                      ? "Loading board members..."
                      : "Optional. Select one or more board members."
                  }
                />
              )}
            />
            <TagSelector
              options={tags}
              value={selectedTags}
              loading={isLoadingTags}
              disabled={isSubmitting}
              onChange={setSelectedTags}
              onCreate={onCreateTag}
              onDelete={onDeleteTag}
            />
            {isLoadingMembers && <CircularProgress size={22} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!title.trim() || isSubmitting || isLoadingMembers}
          >
            {isSubmitting ? "Adding..." : "Add task"}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

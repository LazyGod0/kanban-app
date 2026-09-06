import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import { IconButton, Stack, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddTaskIcon from "@mui/icons-material/PlaylistAdd";
import api from "../../lib/api";
import type { Column } from "../../interfaces/Column";
import type { Task } from "../../interfaces/Task";
import type { Tag } from "../../interfaces/Tag";
import DeletePopUp from "../common/DeletePopUp";
import EditColumnDialog from "./EditColumnDialog";
import TaskDialog from "./TaskDialog";

type ColumnActionsProps = {
  boardId: string;
  column: Column;
  maxPosition: number;
  canManage: boolean;
  onUpdated: (column: Column) => void;
  onDeleted: (columnId: string) => void;
  onTaskCreated: (task: Task) => void;
  tags: Tag[];
  isLoadingTags: boolean;
  onCreateTag: (name: string) => Promise<Tag | null>;
  onDeleteTag: (tag: Tag) => Promise<void>;
};

type ApiError = {
  detail?: string;
};

function ColumnActions({
  boardId,
  column,
  maxPosition,
  canManage,
  onUpdated,
  onDeleted,
  onTaskCreated,
  tags,
  isLoadingTags,
  onCreateTag,
  onDeleteTag,
}: ColumnActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletePopUpOpen, setIsDeletePopUpOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [name, setName] = useState(column.name);
  const [position, setPosition] = useState(column.position);
  const [error, setError] = useState("");

  const updateColumn = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || position < 0 || position > maxPosition) return;

    setIsEditing(true);
    setError("");
    try {
      const response = await api.patch<Column>(
        `/board/${boardId}/column/${column.id}`,
        { name: nextName, position },
      );
      onUpdated(response.data);
      setIsEditing(false);
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to update column.",
      );
    }
  };

  const deleteColumn = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await api.delete(`/board/${boardId}/column/${column.id}`);
      onDeleted(column.id);
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      setError(
        responseError.response?.data?.detail ?? "Unable to delete column.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          flexShrink: 0,
        }}
      >
        <Tooltip title="Add task">
          <IconButton
            size="small"
            color="success"
            aria-label={`Add task to ${column.name}`}
            onClick={() => setIsTaskDialogOpen(true)}
          >
            <AddTaskIcon />
          </IconButton>
        </Tooltip>
        {canManage && (
          <>
            <Tooltip title="Edit column">
              <IconButton
                size="small"
                color="primary"
                aria-label={`Edit ${column.name}`}
                onClick={() => {
                  setName(column.name);
                  setPosition(column.position);
                  setError("");
                  setIsEditing(true);
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete column">
              <IconButton
                size="small"
                color="error"
                aria-label={`Delete ${column.name}`}
                onClick={() => setIsDeletePopUpOpen(true)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>
      <TaskDialog
        open={isTaskDialogOpen}
        boardId={boardId}
        columnId={column.id}
        columnName={column.name}
        onClose={() => setIsTaskDialogOpen(false)}
        onCreated={onTaskCreated}
        tags={tags}
        isLoadingTags={isLoadingTags}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
      />
      <EditColumnDialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        name={name}
        position={position}
        maxPosition={maxPosition}
        error={error}
        onNameChange={setName}
        onPositionChange={setPosition}
        onSubmit={updateColumn}
      />
      <DeletePopUp
        open={isDeletePopUpOpen}
        itemName={`column "${column.name}"`}
        isDeleting={isDeleting}
        onClose={() => setIsDeletePopUpOpen(false)}
        onConfirm={deleteColumn}
      />
    </>
  );
}

export default ColumnActions;

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  Breadcrumbs,
  CircularProgress,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useParams } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import AddColumnDialog from "../../components/board/AddColumnDialog";
import ColumnActions from "../../components/board/ColumnActions";
import { MAX_COLUMNS } from "../../components/board/ColumnFields";
import ExpandedTasksDialog from "../../components/board/ExpandedTasksDialog";
import TaskCard from "../../components/board/TaskCard";
import TaskDetailDialog from "../../components/board/TaskDetailDialog";
import type { Board } from "../../interfaces/Board";
import type { Column } from "../../interfaces/Column";
import type { Task } from "../../interfaces/Task";
import type { Tag } from "../../interfaces/Tag";

export default function BoardDetailPage() {
  const { user } = useAuth();
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState<{
    task: Task;
    columnId: string;
  } | null>(null);
  const [expandedColumnId, setExpandedColumnId] = useState<string | null>(null);

  const expandedColumn = columns.find(
    (column) => column.id === expandedColumnId,
  );
  const expandedTasks = expandedColumn
    ? (tasksByColumn[expandedColumn.id] ?? [])
    : [];

  useEffect(() => {
    if (!boardId) return;

    const fetchBoard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const boardResponse = await api.get<Board>(`/board/${boardId}`);
        setBoard(boardResponse.data);
      } catch (requestError) {
        const responseError = requestError as AxiosError<{ detail?: string }>;
        setError(
          responseError.response?.data?.detail ??
            "Unable to load board information.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;

    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const response = await api.get<Tag[]>(`/board/${boardId}/tags`);
        setTags(response.data);
      } catch (requestError) {
        const responseError = requestError as AxiosError<{ detail?: string }>;
        setError(
          responseError.response?.data?.detail ?? "Unable to load tags.",
        );
      } finally {
        setIsLoadingTags(false);
      }
    };

    void fetchTags();
  }, [boardId]);

  const handleCreateTag = async (name: string) => {
    if (!boardId) return null;
    try {
      const response = await api.post<Tag>(`/board/${boardId}/tags`, { name });
      setTags((current) => [...current, response.data]);
      return response.data;
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      throw new Error(
        responseError.response?.data?.detail ?? "Unable to create tag.",
        { cause: requestError },
      );
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!boardId) return;
    try {
      await api.delete(`/board/${boardId}/tags/${tag.id}`);
      setTags((current) =>
        current.filter((currentTag) => currentTag.id !== tag.id),
      );
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      throw new Error(
        responseError.response?.data?.detail ?? "Unable to delete tag.",
        { cause: requestError },
      );
    }
  };

  const fetchColumns = useCallback(async () => {
    if (!boardId) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<Column[]>(`/board/${boardId}/column`);
      const nextColumns = [...response.data].sort(
        (left, right) => left.position - right.position,
      );
      const taskResponses = await Promise.all(
        nextColumns.map(async (column) => {
          const taskResponse = await api.get<Task[]>(
            `/board/${boardId}/column/${column.id}/tasks`,
          );
          const tasks = await Promise.all(
            taskResponse.data.map(async (task) => {
              const assigneeResponse = await api.get<{ id: string }[]>(
                `/board/${boardId}/column/${column.id}/tasks/${task.id}/assignees`,
              );
              return {
                ...task,
                assigneeIds: assigneeResponse.data.map((member) => member.id),
              };
            }),
          );
          return [column.id, tasks] as const;
        }),
      );

      setColumns(nextColumns);
      setTasksByColumn(Object.fromEntries(taskResponses));
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      setError(
        responseError.response?.data?.detail ?? "Unable to load columns.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const handleColumnUpdated = async (_updatedColumn: Column) => {
    await fetchColumns();
  };

  const handleAddColumn = async () => {
    if (!boardId || !newColumnName.trim()) return;

    setIsAddingColumn(true);
    setError("");
    try {
      await api.post<Column[]>(`/board/${boardId}/column`, [
        { name: newColumnName.trim(), position: columns.length },
      ]);
      await fetchColumns();
      setNewColumnName("");
      setIsAddColumnOpen(false);
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      setError(responseError.response?.data?.detail ?? "Unable to add column.");
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleColumnDeleted = async (columnId: string) => {
    setExpandedColumnId((current) => (current === columnId ? null : current));
    await fetchColumns();
  };

  const handleTaskCreated = async (task: Task) => {
    if (!boardId) return;

    const response = await api.get<Task[]>(
      `/board/${boardId}/column/${task.columnId}/tasks`,
    );
    const tasks = await Promise.all(
      response.data.map(async (createdTask) => {
        const assigneeResponse = await api.get<{ id: string }[]>(
          `/board/${boardId}/column/${task.columnId}/tasks/${createdTask.id}/assignees`,
        );
        return {
          ...createdTask,
          assigneeIds: assigneeResponse.data.map((member) => member.id),
        };
      }),
    );
    setTasksByColumn((current) => ({
      ...current,
      [task.columnId]: tasks,
    }));
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasksByColumn((current) => ({
      ...current,
      [updatedTask.columnId]: (current[updatedTask.columnId] ?? []).map(
        (task) =>
          task.id === updatedTask.id
            ? { ...updatedTask, assigneeIds: task.assigneeIds }
            : task,
      ),
    }));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasksByColumn((current) =>
      Object.fromEntries(
        Object.entries(current).map(([columnId, tasks]) => [
          columnId,
          tasks.filter((task) => task.id !== taskId),
        ]),
      ),
    );
  };

  const handleTaskDragStart = (
    event: DragEvent<HTMLDivElement>,
    task: Task,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ taskId: task.id, columnId: task.columnId }),
    );
  };

  const handleColumnDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleColumnDrop = async (
    event: DragEvent<HTMLDivElement>,
    targetColumnId: string,
  ) => {
    event.preventDefault();
    const transferData = event.dataTransfer.getData("application/json");
    if (!transferData || !boardId) return;

    const { taskId, columnId: sourceColumnId } = JSON.parse(transferData) as {
      taskId?: string;
      columnId?: string;
    };
    if (!taskId || !sourceColumnId || sourceColumnId === targetColumnId) return;

    try {
      await api.patch(
        `/board/${boardId}/column/${sourceColumnId}/tasks/${taskId}`,
        { columnId: targetColumnId },
      );
      await fetchColumns();
    } catch (requestError) {
      const responseError = requestError as AxiosError<{ detail?: string }>;
      setError(responseError.response?.data?.detail ?? "Unable to move task.");
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ pt: 1, pb: 1 }}>
        <Link component={RouterLink} to="/boards" underline="hover">
          Boards
        </Link>
        <Typography color="text.primary" noWrap>
          {board?.name ?? "Board"}
        </Typography>
      </Breadcrumbs>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          py: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          Board columns
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Reload tasks">
            <span>
              <IconButton
                color="primary"
                aria-label="Reload tasks"
                onClick={() => fetchColumns()}
                disabled={isLoading}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          {board?.isOwner && columns.length < MAX_COLUMNS && (
            <Button onClick={() => setIsAddColumnOpen(true)}>Add column</Button>
          )}
        </Box>
      </Box>

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
                onDragOver={handleColumnDragOver}
                onDrop={(event) => handleColumnDrop(event, column.id)}
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
                  {board && (
                    <ColumnActions
                      boardId={boardId ?? ""}
                      column={column}
                      maxPosition={columns.length - 1}
                      canManage={board.isOwner}
                      onUpdated={handleColumnUpdated}
                      onDeleted={handleColumnDeleted}
                      onTaskCreated={handleTaskCreated}
                      tags={tags}
                      isLoadingTags={isLoadingTags}
                      onCreateTag={handleCreateTag}
                      onDeleteTag={handleDeleteTag}
                    />
                  )}
                </Box>
                <Box sx={{ mt: 3, minHeight: 110, pb: 5 }}>
                  {(tasksByColumn[column.id] ?? []).length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center" }}
                    >
                      No tasks have been added to this column.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {(tasksByColumn[column.id] ?? [])
                        .slice(0, 5)
                        .map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDragStart={handleTaskDragStart}
                            canDrag={task.assigneeIds?.includes(user?.id ?? "")}
                            onClick={(selected) =>
                              setSelectedTask({
                                task: selected,
                                columnId: column.id,
                              })
                            }
                          />
                        ))}
                    </Stack>
                  )}
                </Box>
                <Tooltip title="View all tasks">
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={`Expand ${column.name}`}
                    onClick={() => setExpandedColumnId(column.id)}
                    sx={{ position: "absolute", right: 8, bottom: 8 }}
                  >
                    <OpenInFullIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <AddColumnDialog
        open={isAddColumnOpen}
        columnName={newColumnName}
        isAdding={isAddingColumn}
        onColumnNameChange={setNewColumnName}
        onClose={() => setIsAddColumnOpen(false)}
        onSubmit={handleAddColumn}
      />

      <ExpandedTasksDialog
        open={Boolean(expandedColumn)}
        columnName={expandedColumn?.name}
        tasks={expandedTasks}
        onClose={() => setExpandedColumnId(null)}
        canDragTask={(task) =>
          task.assigneeIds?.includes(user?.id ?? "") ?? false
        }
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={() => setExpandedColumnId(null)}
        onTaskClick={(task: Task) =>
          setSelectedTask({
            task,
            columnId: expandedColumn?.id ?? "",
          })
        }
      />

      {selectedTask && (
        <TaskDetailDialog
          open
          boardId={boardId ?? ""}
          columnId={selectedTask.columnId}
          task={selectedTask.task}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          tags={tags}
          isLoadingTags={isLoadingTags}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
        />
      )}
    </Box>
  );
}

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import type { Task } from "../../interfaces/Task";
import TaskCard from "./TaskCard";

type ExpandedTasksDialogProps = {
  open: boolean;
  columnName?: string;
  tasks: Task[];
  onClose: () => void;
  canDragTask: (task: Task) => boolean;
  onTaskDragStart: (event: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onTaskDragEnd: () => void;
  onTaskClick: (task: Task) => void;
};

export default function ExpandedTasksDialog({
  open,
  columnName,
  tasks,
  onClose,
  canDragTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskClick,
}: ExpandedTasksDialogProps) {
  const handleContentDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{columnName}</DialogTitle>
      <DialogContent
        dividers
        onDragLeave={handleContentDragLeave}
        sx={{
          maxHeight: "calc(100vh - 180px)",
          overflowY: "auto",
        }}
      >
        {tasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No tasks have been added to this column.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onTaskDragStart}
                onDragEnd={onTaskDragEnd}
                canDrag={canDragTask(task)}
                onClick={onTaskClick}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

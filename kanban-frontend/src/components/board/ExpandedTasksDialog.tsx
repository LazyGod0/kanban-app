import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { Task } from "../../interfaces/Task";
import TaskCard from "./TaskCard";

type ExpandedTasksDialogProps = {
  open: boolean;
  columnName?: string;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
};

export default function ExpandedTasksDialog({
  open,
  columnName,
  tasks,
  onClose,
  onTaskClick,
}: ExpandedTasksDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{columnName}</DialogTitle>
      <DialogContent
        dividers
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
                onDragStart={() => undefined}
                onClick={onTaskClick}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
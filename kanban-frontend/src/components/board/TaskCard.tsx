import { Box, Paper, Typography } from "@mui/material";
import type { DragEvent } from "react";
import type { Task } from "../../interfaces/Task";
import { formatLocalDate } from "../../lib/date";

type TaskCardProps = {
  task: Task;
  onDragStart: (event: DragEvent<HTMLDivElement>, task: Task) => void;
  onClick: (task: Task) => void;
};

export default function TaskCard({
  task,
  onDragStart,
  onClick,
}: TaskCardProps) {
  return (
    <Paper
      component="article"
      draggable
      onClick={() => onClick(task)}
      onDragStart={(event: DragEvent<HTMLDivElement>) =>
        onDragStart(event, task)
      }
      sx={{
        p: 2,
        borderRadius: "2px",
        cursor: "grab",
        position: "relative",
        transform: "rotate(-0.7deg)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:active": { cursor: "grabbing" },
        "&:hover": {
          transform: "rotate(0deg) translateY(-4px)",
        },
        "&:focus-visible": {
          outline: "3px solid",
          outlineOffset: 2,
        },
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(task);
        }
      }}
    >
      <Box
        sx={{ display: "flex", p: 0, m: 0, justifyContent: "space-between" }}
      >
        <Typography variant="body1" sx={{ fontWeight: 800 }}>
          {task.title}
        </Typography>
        <Typography>{formatLocalDate(task.dueDate)}</Typography>
      </Box>
      {task.description && (
        <Typography
          noWrap
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}
        >
          {task.description}
        </Typography>
      )}
    </Paper>
  );
}

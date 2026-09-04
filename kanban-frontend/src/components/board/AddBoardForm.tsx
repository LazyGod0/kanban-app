import { useState, type SubmitEvent } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../lib/api";
import type { Board } from "../../interfaces/Board";
import ColumnFields from "./ColumnFields";

type AddBoardFormProps = {
  onCreated: (board: Board) => void;
};

type ApiError = {
  detail?: string | { msg: string }[];
};

function AddBoardForm({ onCreated }: AddBoardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addColumn = () => {
    if (columns.length < 5) {
      setColumns((current) => [...current, ""]);
    }
  };

  const updateColumn = (index: number, name: string) => {
    setColumns((current) =>
      current.map((column, columnIndex) =>
        columnIndex === index ? name : column,
      ),
    );
  };

  const removeColumn = (index: number) => {
    setColumns((current) =>
      current.filter((_, columnIndex) => columnIndex !== index),
    );
  };

  const resetForm = () => {
    setBoardName("");
    setColumns([]);
    setError("");
    setIsOpen(false);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const boardResponse = await api.post<Board>("/board", {
        name: boardName,
      });
      const validColumns = columns.filter((column) => column.trim());

      if (validColumns.length > 0) {
        await api.post(
          `/board/${boardResponse.data.id}/column`,
          validColumns.map((name, position) => ({
            name,
            position,
          })),
        );
      }

      onCreated(boardResponse.data);
      resetForm();
    } catch (requestError) {
      const responseError = requestError as AxiosError<ApiError>;
      const detail = responseError.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(" ")
          : (detail ?? "Unable to create the board."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ListItemButton onClick={() => (isOpen ? resetForm() : setIsOpen(true))}>
        <Typography sx={{ fontWeight: 700 }}>
          {isOpen ? "Close board form" : "+ Add board"}
        </Typography>
      </ListItemButton>
      <Collapse in={isOpen} unmountOnExit>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="Board name"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              required
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <ColumnFields
              columns={columns}
              onAdd={addColumn}
              onChange={updateColumn}
              onRemove={removeColumn}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create board"}
              </Button>
              <Button type="button" onClick={resetForm} disabled={isSubmitting}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
      <Divider />
    </>
  );
}

export default AddBoardForm;

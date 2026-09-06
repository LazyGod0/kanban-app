import { Button, Stack, TextField, Typography } from "@mui/material";

export const MAX_COLUMNS = 3;

type ColumnFieldsProps = {
  columns: string[];
  onAdd: () => void;
  onChange: (index: number, name: string) => void;
  onRemove: (index: number) => void;
};

function ColumnFields({
  columns,
  onAdd,
  onChange,
  onRemove,
}: ColumnFieldsProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="subtitle2">
          Columns ({columns.length}/{MAX_COLUMNS})
        </Typography>
        <Button
          type="button"
          onClick={onAdd}
          disabled={columns.length >= MAX_COLUMNS}
        >
          Add column
        </Button>
      </Stack>
      {columns.map((column, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          <TextField
            label={`Column ${index + 1}`}
            value={column}
            onChange={(event) => onChange(index, event.target.value)}
            required
            fullWidth
          />
          <Button type="button" color="error" onClick={() => onRemove(index)}>
            Remove
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}

export default ColumnFields;

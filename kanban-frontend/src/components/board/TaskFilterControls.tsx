import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Tag } from "../../interfaces/Tag";
import type { DueDateSort, TaskFilterState } from "../../lib/taskFilters";

type TaskFilterControlsProps = {
  filter: TaskFilterState;
  tags: Tag[];
  onChange: (filter: TaskFilterState) => void;
};

export default function TaskFilterControls({
  filter,
  tags,
  onChange,
}: TaskFilterControlsProps) {
  const selectedTags = tags.filter((tag) => filter.tagIds.includes(tag.id));

  const handleSortChange = (event: SelectChangeEvent<DueDateSort>) => {
    onChange({ ...filter, dueDateSort: event.target.value as DueDateSort });
  };

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ width: "100%", minWidth: 0 }}
    >
      <TextField
        size="small"
        label="Task title"
        value={filter.title}
        onChange={(event) => onChange({ ...filter, title: event.target.value })}
        sx={{ minWidth: 0, flex: "1 1 0" }}
      />
      <Autocomplete
        multiple
        size="small"
        options={tags}
        value={selectedTags}
        onChange={(_, nextTags) =>
          onChange({ ...filter, tagIds: nextTags.map((tag) => tag.id) })
        }
        getOptionLabel={(tag) => tag.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, tag) => (
          <Box component="li" {...props} key={tag.id}>
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: tag.color ?? "text.secondary",
                mr: 1,
                flexShrink: 0,
              }}
            />
            {tag.name}
          </Box>
        )}
        renderValue={(tagValues, getItemProps) =>
          tagValues.map((tag, index) => (
            <Chip
              {...getItemProps({ index })}
              key={tag.id}
              label={tag.name}
              size="small"
              sx={tag.color ? { bgcolor: tag.color } : undefined}
            />
          ))
        }
        renderInput={(params) => <TextField {...params} label="Tags" />}
        sx={{ minWidth: 0, flex: "1 1 0" }}
      />
      <FormControl size="small" sx={{ minWidth: 0, flex: "1 1 0" }}>
        <InputLabel id="task-due-date-sort-label">Sort by due date</InputLabel>
        <Select
          labelId="task-due-date-sort-label"
          value={filter.dueDateSort}
          label="Sort by due date"
          onChange={handleSortChange}
        >
          <MenuItem value="none">Default order</MenuItem>
          <MenuItem value="asc">Earliest first</MenuItem>
          <MenuItem value="desc">Latest first</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}

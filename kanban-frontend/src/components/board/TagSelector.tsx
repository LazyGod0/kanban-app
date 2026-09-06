import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Tag } from "../../interfaces/Tag";

type AddTagOption = {
  type: "add";
  name: string;
};

type TagOption = Tag | AddTagOption;

type TagSelectorProps = {
  options: Tag[];
  value: Tag[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (tags: Tag[]) => void;
  onCreate: (name: string) => Promise<Tag | null>;
  onDelete: (tag: Tag) => Promise<void>;
  readOnly?: boolean;
};

function isAddTagOption(option: TagOption): option is AddTagOption {
  return "type" in option && option.type === "add";
}

export default function TagSelector({
  options,
  value,
  disabled = false,
  loading = false,
  onChange,
  onCreate,
  onDelete,
  readOnly = false,
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState("");

  const createOption = inputValue.trim();
  const filteredTags = createFilterOptions<Tag>()(options, {
    inputValue,
    getOptionLabel: (option) => option.name,
  });
  const filteredOptions: TagOption[] =
    !readOnly &&
    createOption &&
    !options.some(
      (tag) => tag.name.toLowerCase() === createOption.toLowerCase(),
    )
      ? [...filteredTags, { type: "add", name: createOption }]
      : filteredTags;

  const handleChange = async (_: unknown, nextValue: TagOption[]) => {
    if (readOnly) return;

    const addOption = nextValue.find(isAddTagOption);
    if (!addOption) {
      onChange(
        nextValue.filter((option): option is Tag => !isAddTagOption(option)),
      );
      return;
    }

    setIsMutating(true);
    setMutationError("");
    try {
      const createdTag = await onCreate(addOption.name);
      if (createdTag) {
        onChange([...value, createdTag]);
        setInputValue("");
      }
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to create tag.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (readOnly) return;

    setIsMutating(true);
    setMutationError("");
    try {
      await onDelete(tag);
      onChange(value.filter((selectedTag) => selectedTag.id !== tag.id));
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to delete tag.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <Autocomplete<TagOption, true>
      readOnly={readOnly}
      multiple
      options={filteredOptions}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, nextInputValue) => setInputValue(nextInputValue)}
      onChange={handleChange}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selectedOption) =>
        !isAddTagOption(option) &&
        !isAddTagOption(selectedOption) &&
        option.id === selectedOption.id
      }
      filterOptions={(availableOptions) => availableOptions}
      disabled={disabled || loading || isMutating}
      loading={loading}
      slotProps={{
        listbox: {
          sx: { maxHeight: 240, overflowY: "auto" },
        },
      }}
      renderValue={(selectedTags, getItemProps) =>
        selectedTags
          .filter((tag): tag is Tag => !isAddTagOption(tag))
          .map((tag, index) => (
            <Chip
              {...getItemProps({ index })}
              key={tag.id}
              label={tag.name}
              size="small"
              sx={tag.color ? { bgcolor: tag.color } : undefined}
            />
          ))
      }
      renderOption={(props, option) => {
        if (isAddTagOption(option)) {
          if (readOnly) return null;

          return (
            <Box component="li" {...props} key={`add-${option.name}`}>
              <Button
                type="button"
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleChange(null, [...value, option]);
                }}
                fullWidth
                sx={{ justifyContent: "flex-start" }}
              >
                Add tag &quot;{option.name}&quot;
              </Button>
            </Box>
          );
        }

        return (
          <Box component="li" {...props} key={option.id}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ width: "100%", alignItems: "center" }}
            >
              <Box sx={{ flex: 1 }}>{option.name}</Box>
              {!readOnly && (
                <Tooltip title={`Delete ${option.name}`}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Delete ${option.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(option);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tags"
          helperText={
            mutationError || "Optional. Select existing tags or add a new one."
          }
          error={Boolean(mutationError)}
        />
      )}
    />
  );
}

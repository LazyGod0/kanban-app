import type { Task } from "../interfaces/Task";

export type DueDateSort = "none" | "asc" | "desc";

export type TaskFilterState = {
  title: string;
  tagIds: string[];
  dueDateSort: DueDateSort;
};

export const EMPTY_TASK_FILTER: TaskFilterState = {
  title: "",
  tagIds: [],
  dueDateSort: "none",
};

export function filterAndSortTasks(
  tasks: Task[],
  filter: TaskFilterState,
): Task[] {
  const title = filter.title.trim().toLocaleLowerCase();
  const selectedTagIds = new Set(filter.tagIds);

  const filteredTasks = tasks.filter((task) => {
    const matchesTitle =
      !title || task.title.toLocaleLowerCase().includes(title);
    const matchesTags =
      selectedTagIds.size === 0 ||
      task.tags.some((tag) => selectedTagIds.has(tag.id));

    return matchesTitle && matchesTags;
  });

  if (filter.dueDateSort === "none") {
    return filteredTasks;
  }

  return filteredTasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      if (!left.task.dueDate && !right.task.dueDate) {
        return left.index - right.index;
      }
      if (!left.task.dueDate) return 1;
      if (!right.task.dueDate) return -1;

      const difference =
        new Date(left.task.dueDate).getTime() -
        new Date(right.task.dueDate).getTime();
      return difference === 0
        ? left.index - right.index
        : filter.dueDateSort === "asc"
          ? difference
          : -difference;
    })
    .map(({ task }) => task);
}

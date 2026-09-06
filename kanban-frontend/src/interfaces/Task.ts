export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assigneeIds?: string[];
  tags: import("./Tag").Tag[];
}

// frontend/src/types/task.types.ts

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export interface TaskComment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  comments: TaskComment[];
  assignedTo: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

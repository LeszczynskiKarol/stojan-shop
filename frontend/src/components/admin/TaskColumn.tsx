// frontend/src/components/admin/TaskColumn.tsx
import React from "react";
import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "@/types/task.types";
import { useTaskStore } from "@/store/taskStore";
import { useEffect } from "react";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  status: TaskStatus;
}

export const TaskColumn = ({ title, tasks, status }: TaskColumnProps) => {
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card p-4 rounded-lg border shadow-sm"
    >
      <h3 className="font-semibold mb-4 text-lg">{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </motion.div>
  );
};

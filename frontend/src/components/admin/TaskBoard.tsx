// frontend/src/components/admin/TaskBoard.tsx

import React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Loader2 } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import { useAuthStore } from "@/store/authStore";
import { TaskColumn } from "./TaskColumn";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TaskStatus } from "@/types/task.types";

export const TaskBoard = () => {
  const { user } = useAuthStore();
  const { tasks, isLoading, createTask, fetchTasks } = useTaskStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  useEffect(() => {
    const initTasks = async () => {
      await fetchTasks();
    };
    initTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      return;
    }

    console.log("Wysyłam taska:", newTask);

    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        assignedToId: user?.id,
      });

      console.log("Task dodany");
      setNewTask({ title: "", description: "" });
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Błąd:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tablica zadań</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Nowe zadanie
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dodaj nowe zadanie"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Input
              placeholder="Tytuł zadania"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
            />
          </div>
          <div>
            <Textarea
              placeholder="Opis zadania"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Dodaj zadanie
          </Button>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          <TaskColumn
            title="Do zrobienia"
            tasks={tasks.filter((task) => task.status === TaskStatus.TODO)}
            status={TaskStatus.TODO}
          />
          <TaskColumn
            title="W trakcie"
            tasks={tasks.filter(
              (task) => task.status === TaskStatus.IN_PROGRESS
            )}
            status={TaskStatus.IN_PROGRESS}
          />
          <TaskColumn
            title="Zakończone"
            tasks={tasks.filter((task) => task.status === TaskStatus.DONE)}
            status={TaskStatus.DONE}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

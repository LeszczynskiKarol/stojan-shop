// frontend/src/app/(admin)/admin/tasks/page.tsx

"use client";
import { TaskBoard } from "@/components/admin/TaskBoard";

export default function TasksPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Zadania</h1>
      <TaskBoard />
    </div>
  );
}

// frontend/src/store/taskStore.ts

import { create } from "zustand";
import axios from "axios";

// Konfiguracja axios z tokenem
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor do dodawania tokenu do każdego requesta
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface TaskStore {
  tasks: any[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  updateTaskStatus: (taskId: number, status: string) => Promise<void>;
  addComment: (
    taskId: number,
    content: string,
    userId: number
  ) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/api/tasks");
      set({ tasks: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error("Błąd pobierania zadań:", error.response?.status);
      if (error.response?.status === 401) {
        set({
          error: "Brak autoryzacji - zaloguj się ponownie",
          isLoading: false,
        });
        // Opcjonalnie przekieruj do logowania
        // window.location.href = "/login";
      } else {
        set({
          error: "Błąd podczas pobierania zadań",
          isLoading: false,
        });
      }
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await axiosInstance.post("/api/tasks", taskData);
      set((state) => ({
        tasks: [...state.tasks, response.data.data],
        error: null,
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        set({ error: "Brak autoryzacji - zaloguj się ponownie" });
      } else {
        set({ error: "Błąd podczas tworzenia zadania" });
      }
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await axiosInstance.patch(
        `/api/tasks/${taskId}/status`,
        { status }
      );
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? response.data.data : task
        ),
        error: null,
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        set({ error: "Brak autoryzacji - zaloguj się ponownie" });
      } else {
        set({ error: "Błąd podczas aktualizacji statusu" });
      }
    }
  },

  addComment: async (taskId, content, userId) => {
    try {
      const response = await axiosInstance.post(
        `/api/tasks/${taskId}/comments`,
        {
          content,
          userId,
        }
      );
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, comments: [...task.comments, response.data.data] }
            : task
        ),
        error: null,
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        set({ error: "Brak autoryzacji - zaloguj się ponownie" });
      } else {
        set({ error: "Błąd podczas dodawania komentarza" });
      }
    }
  },

  deleteTask: async (taskId) => {
    try {
      await axiosInstance.delete(`/api/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        error: null,
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        set({ error: "Brak autoryzacji - zaloguj się ponownie" });
      } else {
        set({ error: "Błąd podczas usuwania zadania" });
      }
    }
  },
}));

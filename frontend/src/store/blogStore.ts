// frontend/src/store/blogStore.ts
import { create } from "zustand";
import { BlogPost } from "../types/blog.types";

interface BlogState {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;

  fetchPosts: () => Promise<void>;
  createPost: (
    post: Omit<BlogPost, "id" | "slug" | "created_at" | "updated_at">
  ) => Promise<BlogPost>;
  updatePost: (id: string, post: Partial<BlogPost>) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  getPostById: (id: string) => Promise<BlogPost>;
  importFromWordPress: (posts: any[]) => Promise<void>;
  fetchWordPressData: () => Promise<any>;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  currentPage: 0,
  totalPages: 1,
  itemsPerPage: 20,

  setPage: (page: number) => set({ currentPage: page }),

  setItemsPerPage: (items: number) => set({ itemsPerPage: items }),

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog`);
      const data = await response.json();

      if (data.success) {
        set({
          posts: data.data,
          loading: false,
          totalPages: Math.ceil(data.data.length / get().itemsPerPage),
        });
      } else {
        throw new Error("Błąd pobierania postów");
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
    }
  },

  createPost: async (postData) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd tworzenia posta");
      }

      const newPost = await response.json();
      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));

      return newPost;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },

  updatePost: async (id, postData) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd aktualizacji posta");
      }

      const updatedPost = await response.json();
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? updatedPost : p)),
        loading: false,
      }));

      return updatedPost;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },

  deletePost: async (id) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd usuwania posta");
      }

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },

  getPostById: async (id) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog/by-slug/${id}`);

      if (!response.ok) {
        throw new Error("Post nie został znaleziony");
      }

      const post = await response.json();
      set({ loading: false });
      return post;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },

  importFromWordPress: async (posts) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ posts }),
      });

      if (!response.ok) {
        throw new Error("Błąd importu postów");
      }

      const result = await response.json();
      await get().fetchPosts(); // Odśwież listę postów
      set({ loading: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },

  fetchWordPressData: async () => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/blog/wordpress-data`);

      if (!response.ok) {
        throw new Error("Błąd pobierania danych z WordPress");
      }

      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Wystąpił błąd",
        loading: false,
      });
      throw error;
    }
  },
}));

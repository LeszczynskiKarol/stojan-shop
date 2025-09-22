// frontend/src/store/categoryStore.ts
import { create } from "zustand";
import { ICategory } from "@/types/category.types";

interface CategoryStore {
  categories: ICategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ||
          "https://www.silniki-elektryczne.com.pl") + "/api/categories"
      );
      const data = await response.json();
      set({ categories: data.data });
    } catch (error) {
      set({ error: "Błąd podczas pobierania kategorii" });
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Błąd podczas usuwania kategorii");
      }

      // Po udanym usunięciu odświeżamy listę
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
      }));
    } catch (error) {
      console.error("Błąd:", error);
      throw error;
    }
  },
}));

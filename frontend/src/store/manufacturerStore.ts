// frontend/src/store/manufacturerStore.ts
import { create } from "zustand";
import { IManufacturer } from "@/types/manufacturer.types";

interface ManufacturerStore {
  manufacturers: IManufacturer[];
  loading: boolean;
  error: string | null;
  fetchManufacturers: () => Promise<void>;
  deleteManufacturer: (id: string) => Promise<void>;
  createManufacturer: (data: Partial<IManufacturer>) => Promise<IManufacturer>;
  updateManufacturer: (
    id: string,
    data: Partial<IManufacturer>
  ) => Promise<IManufacturer>;
}

export const useManufacturerStore = create<ManufacturerStore>((set) => ({
  manufacturers: [],
  loading: false,
  error: null,

  fetchManufacturers: async () => {
    set({ loading: true });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/manufacturers`);
      const data = await response.json();
      set({ manufacturers: data.data });
    } catch (error) {
      set({ error: "Błąd podczas pobierania producentów" });
    } finally {
      set({ loading: false });
    }
  },

  deleteManufacturer: async (id: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/manufacturers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania producenta");
      }

      set((state) => ({
        manufacturers: state.manufacturers.filter((m) => m.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  createManufacturer: async (data: Partial<IManufacturer>) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/manufacturers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas tworzenia producenta");
      }

      const result = await response.json();
      set((state) => ({
        manufacturers: [...state.manufacturers, result.data],
      }));

      return result.data;
    } catch (error) {
      throw error;
    }
  },

  updateManufacturer: async (id: string, data: Partial<IManufacturer>) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/manufacturers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas aktualizacji producenta");
      }

      const result = await response.json();
      set((state) => ({
        manufacturers: state.manufacturers.map((m) =>
          m.id === id ? { ...m, ...result.data } : m
        ),
      }));

      return result.data;
    } catch (error) {
      throw error;
    }
  },
}));

// frontend/src/store/orderStore.ts
import { create } from "zustand";
import axios from "axios";
import { Order } from "@/types/order.types";
import { api } from "@/lib/api";

interface OrderFilters {
  status?: Order["status"] | "all";
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hidePending?: boolean;
  hideCancelled?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  total: number;
  selectedOrder: Order | null;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  fetchOrders: (page?: number, limit?: number) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<void>;
  getOrderById: (id: string) => Promise<void>;
  setSelectedOrder: (order: Order | null) => void; // <- to jest poprawna definicja
  uploadInvoice: (orderId: string, file: File) => Promise<void>;
  deleteInvoice: (orderId: string, invoiceUrl: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  deleteMultipleOrders: (orderIds: string[]) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  cancelMultipleOrders: (orderIds: string[], reason: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  currentPage: 0,
  totalPages: 0,
  total: 0,
  selectedOrder: null,
  filters: {},

  setFilters: (filters: OrderFilters) => {
    set({ filters });
  },

  deleteOrder: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/orders/${orderId}`);

      if (!response.data.success) {
        throw new Error("Nie udało się usunąć zamówienia");
      }

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      // Usuń drugi parametr (searchTerm)
      await get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      console.error("Błąd podczas usuwania zamówienia:", error);
      set({ error: "Nie udało się usunąć zamówienia" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteMultipleOrders: async (orderIds: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete("/orders/bulk", {
        data: { ids: orderIds },
      });

      if (!response.data.success) {
        throw new Error("Nie udało się usunąć zamówień");
      }

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      // Usuń drugi parametr
      await get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      console.error("Błąd podczas usuwania zamówień:", error);
      set({ error: "Nie udało się usunąć zamówień" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchOrders: async (page = 0, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();

      console.log("🔥 STORE - Filtry przed wysłaniem:", filters);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.searchTerm) {
        params.append("search", filters.searchTerm);
      }
      if (filters.dateFrom) {
        params.append("dateFrom", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append("dateTo", filters.dateTo.toISOString());
      }

      // WAŻNE: Zawsze wysyłaj te parametry, nawet gdy są false
      params.append("hidePending", filters.hidePending ? "true" : "false");
      params.append("hideCancelled", filters.hideCancelled ? "true" : "false");

      if (filters.sortField) {
        params.append("sortField", filters.sortField);
      }
      if (filters.sortDirection) {
        params.append("sortDirection", filters.sortDirection.toUpperCase());
      }

      console.log(
        "🔥 STORE - URL z parametrami:",
        `/orders?${params.toString()}`
      );

      // Użyj api z axios zamiast fetch
      const response = await api.get(`/orders?${params.toString()}`);

      console.log("🔥 STORE - Odpowiedź z backendu:", {
        success: response.data.success,
        ordersCount: response.data.data?.orders?.length,
        total: response.data.data?.total,
      });

      if (response.data.success) {
        set({
          orders: response.data.data.orders,
          totalPages: response.data.data.totalPages,
          currentPage: response.data.data.currentPage,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      set({ error: error instanceof Error ? error.message : "Nieznany błąd" });
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: Order["status"]) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Nie udało się zaktualizować statusu");

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      // Usuń drugi parametr
      get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      set({ error: "Nie udało się zaktualizować statusu zamówienia" });
    } finally {
      set({ loading: false });
    }
  },

  updateOrderDataSheet: async (orderId: string, dataSheetUrl: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/datasheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataSheetUrl }),
      });

      if (!response.ok) throw new Error("Failed to update data sheet");

      return await response.json();
    } catch (error) {
      console.error("Error updating data sheet:", error);
      throw error;
    }
  },

  deleteOrderDataSheet: async (orderId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/datasheet`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) throw new Error("Failed to delete data sheet");

      return await response.json();
    } catch (error) {
      console.error("Error deleting data sheet:", error);
      throw error;
    }
  },

  getOrderById: async (id: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/orders/${id}`);
      const data = await response.json();

      if (data.success) {
        set({ selectedOrder: data.data });
      }
    } catch (error) {
      set({ error: "Nie udało się pobrać zamówienia" });
    } finally {
      set({ loading: false });
    }
  },

  uploadInvoice: async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append("invoice", file);

    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Nie udało się wysłać faktury");

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      // Usuń drugi parametr
      await get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      console.error("Błąd podczas wysyłania faktury:", error);
      throw error;
    }
  },

  deleteInvoice: async (orderId: string, fileName: string) => {
    try {
      // Użyj api z axios zamiast fetch
      const response = await api.delete(`/orders/${orderId}/invoice`, {
        data: { fileName },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Nie udało się usunąć faktury");
      }

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      await get().fetchOrders(get().currentPage, limit);
      return response.data;
    } catch (error) {
      console.error("Błąd podczas usuwania faktury:", error);

      // Sprawdzenie typu error dla TypeScript
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 405) {
          // Jeśli DELETE nie jest obsługiwane, spróbuj POST
          try {
            const response = await api.post(
              `/orders/${orderId}/invoice/delete`,
              {
                fileName,
              }
            );

            if (response.data.success) {
              const savedLimit = localStorage.getItem("ordersPerPage");
              const limit = savedLimit ? parseInt(savedLimit) : 20;
              await get().fetchOrders(get().currentPage, limit);
              return response.data;
            }
          } catch (postError) {
            console.error(
              "Błąd podczas usuwania faktury metodą POST:",
              postError
            );
            throw postError;
          }
        }

        // Rzuć błąd z komunikatem z serwera jeśli istnieje
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Nieznany błąd podczas usuwania faktury";
        throw new Error(errorMessage);
      }

      // Dla innych typów błędów
      throw error instanceof Error
        ? error
        : new Error("Nieznany błąd podczas usuwania faktury");
    }
  },

  setSelectedOrder: (order: Order | null) => set({ selectedOrder: order }),

  cancelOrder: async (orderId: string, reason: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });

      if (!response.data.success) {
        throw new Error("Nie udało się anulować zamówienia");
      }

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      await get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      console.error("Błąd podczas anulowania zamówienia:", error);
      set({ error: "Nie udało się anulować zamówienia" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  cancelMultipleOrders: async (orderIds: string[], reason: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/orders/bulk/cancel", {
        ids: orderIds,
        reason,
      });

      if (!response.data.success) {
        throw new Error("Nie udało się anulować zamówień");
      }

      const savedLimit = localStorage.getItem("ordersPerPage");
      const limit = savedLimit ? parseInt(savedLimit) : 20;

      await get().fetchOrders(get().currentPage, limit);
    } catch (error) {
      console.error("Błąd podczas anulowania zamówień:", error);
      set({ error: "Nie udało się anulować zamówień" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

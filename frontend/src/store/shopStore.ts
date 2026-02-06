// frontend/src/store/shopStore.ts
import { create } from "zustand";
import { IProduct } from "@/types/product.types";

export interface ActiveFilters {
  power: [number, number];
  rpm: [number, number];
  shaftDiameter: [number, number];
  sleeveDiameter: [number, number];
  mechanicalSize: [number, number];
  manufacturer: string;
  startType: string;
  condition: string;
  inStock: boolean;
  categoryId?: string;
  sort?: string;
  productType: string[];
}

export interface Filters {
  categoryId?: string;
  sort?: string;
  page?: number;
  limit?: number;
  skipPagination?: boolean;
  // Zmieniamy te pola na tablice dla zgodności z activeFilters
  power?: [number, number];
  rpm?: [number, number];
  shaftDiameter?: [number, number];
  manufacturer?: string;
  condition?: string;
  inStock?: boolean;
  productType?: string[];
}

interface ShopStore {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  fetchProducts: (filters?: Filters) => Promise<void>;
  itemsPerPage: number;
  totalProducts: number;
  loadMore: (filters?: any) => Promise<void>;
  applyFilter: (
    filterType: string,
    value: any,
    additionalFilters?: any
  ) => Promise<void>;
  setItemsPerPage: (value: number, additionalFilters?: any) => void;
  activeFilters: ActiveFilters;
  setFilter: (filterType: string, value: any) => void;
  ranges: {
    power: [number, number];
    rpm: [number, number];
    shaftDiameter: [number, number];
    mechanicalSize: [number, number];
  };
  fetchRanges: () => Promise<void>;
  searchResults: IProduct[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchProducts: (query: string, inStock?: boolean) => Promise<IProduct[]>;
  initializeFilters: () => void;
  initializeFiltersForCategory: (categoryId: string) => Promise<void>;
  hasActiveFilters: () => boolean;
}

export const useShopStore = create<ShopStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  itemsPerPage: 20,
  totalProducts: 0,
  ranges: {
    power: [0.0, 0],
    rpm: [0, 0],
    shaftDiameter: [0, 0],
    mechanicalSize: [0, 0],
  },

  fetchRanges: async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/products/ranges`);
      const data = await response.json();

      if (data.success) {
        set({ ranges: data.data });
      }
    } catch (error) {
      console.error("Błąd podczas pobierania zakresów:", error);
    }
  },

  activeFilters: {
    power: [0, 0],
    rpm: [0, 0],
    shaftDiameter: [0, 0],
    sleeveDiameter: [0, 0],
    mechanicalSize: [0, 0],
    manufacturer: "",
    startType: "",
    condition: "",
    inStock: true,
    productType: [],
  },

  setFilter: (filterType, value) => {
    if (filterType === "productType" && !Array.isArray(value)) {
      value = [value];
    }

    set((state) => {
      const newActiveFilters = {
        ...state.activeFilters,
        [filterType]: value,
      };

      // Zapisujemy stan filtrów w localStorage
      try {
        localStorage.setItem("shopFilters", JSON.stringify(newActiveFilters));
      } catch (e) {
        console.error("Błąd podczas zapisywania filtrów:", e);
      }

      return {
        activeFilters: newActiveFilters,
      };
    });
  },

  // Dodajemy inicjalizację filtrów z localStorage
  initializeFilters: () => {
    try {
      const savedFilters = localStorage.getItem("shopFilters");
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        set({ activeFilters: parsedFilters });
      }
    } catch (e) {
      console.error("Błąd podczas odczytywania filtrów:", e);
    }
  },
  searchResults: [],
  searchQuery: "",

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  searchProducts: async (
    query: string,
    inStock: boolean = false
  ): Promise<IProduct[]> => {
    set({ loading: true });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const queryParams = new URLSearchParams();

      queryParams.set("search", query);
      if (inStock) {
        queryParams.set("inStock", "true");
      }

      // Zmiana endpointu na /search
      const response = await fetch(
        `${baseUrl}/api/products/search?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        return data.data.products || [];
      }
      return [];
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchProducts: async (filters: Filters = {}) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const queryParams = new URLSearchParams();
      console.log("ShopStore fetchProducts - parametry wejściowe:", {
        filters,
        timestamp: new Date().toISOString(),
      });

      const activeFilters = get().activeFilters;

      const filtersToUse = {
        // 1. Podstawowe wartości z activeFilters
        ...activeFilters,

        // 2. Nadpisujemy tym co przyszło w filters
        ...filters,

        // 3. Ale productType trzymamy z activeFilters JEŚLI coś tam jest
        productType: activeFilters.productType?.length
          ? activeFilters.productType
          : filters.productType || [],
      };

      if (filtersToUse.categoryId) {
        queryParams.set("categoryId", filtersToUse.categoryId);
      }

      // Obsługa paginacji - tylko tutaj
      if (!filters.skipPagination) {
        const page = Math.max(0, filters.page || 0);
        queryParams.set("page", page.toString());
        queryParams.set(
          "limit",
          (filters.limit || get().itemsPerPage).toString()
        );
      }

      // Sortowanie
      if (filtersToUse.sort) {
        queryParams.set("sort", filtersToUse.sort);
      }

      // Konwertujemy zakresy na pojedyncze parametry
      if (filtersToUse.power) {
        queryParams.set("powerMin", filtersToUse.power[0].toString());
        queryParams.set("powerMax", filtersToUse.power[1].toString());
      }

      if (filtersToUse.rpm) {
        queryParams.set("rpmMin", filtersToUse.rpm[0].toString());
        queryParams.set("rpmMax", filtersToUse.rpm[1].toString());
      }

      if (filtersToUse.shaftDiameter) {
        queryParams.set(
          "shaftDiameterMin",
          filtersToUse.shaftDiameter[0].toString()
        );
        queryParams.set(
          "shaftDiameterMax",
          filtersToUse.shaftDiameter[1].toString()
        );
      }

      // Pozostałe filtry
      if (filtersToUse.manufacturer) {
        queryParams.set("manufacturer", filtersToUse.manufacturer);
      }

      if (filtersToUse.condition) {
        queryParams.set("condition", filtersToUse.condition);
      }

      if (filtersToUse.productType?.length) {
        queryParams.set("productType", filtersToUse.productType.join(","));
      }

      // Zawsze ustawiamy inStock na true
      queryParams.set("inStock", "true");

      const response = await fetch(`${baseUrl}/api/products?${queryParams}`);
      const data = await response.json();
      console.log("ShopStore fetchProducts - odpowiedź z API:", {
        success: data.success,
        totalProducts: data.data?.total,
        receivedProducts: data.data?.products?.length,
        url: `${baseUrl}/api/products?${queryParams}`,
        timestamp: new Date().toISOString(),
      });

      if (data.success) {
        set({
          products: data.data.products || [],
          totalProducts: data.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      set({ error: "Błąd podczas pobierania produktów" });
    } finally {
      set({ loading: false });
    }
  },

  applyFilter: async (filterType, value, additionalFilters = {}) => {
    const state = get();

    // Jeśli to reset, resetujemy wszystkie filtry
    if (filterType === "reset") {
      await state.initializeFiltersForCategory(additionalFilters.categoryId);
      return state.fetchProducts({
        categoryId: additionalFilters.categoryId,
        sort: additionalFilters.sort || "newest",
      });
    }

    if (filterType === "productType") {
      const newFilters = {
        ...state.activeFilters,
        productType: Array.isArray(value) ? value : [value],
      };
      set({ activeFilters: newFilters });

      return state.fetchProducts({
        ...newFilters,
        ...additionalFilters,
      });
    }

    // W przeciwnym razie tworzymy nowe filtry
    const newFilters = {
      ...state.activeFilters,
      [filterType]: value,
    };

    // Najpierw aktualizujemy stan
    set({ activeFilters: newFilters });

    // Potem pobieramy produkty z wszystkimi filtrami
    return state.fetchProducts({
      ...newFilters,
      ...additionalFilters,
      categoryId:
        additionalFilters.categoryId || state.activeFilters.categoryId,
    });
  },

  loadMore: async (filters = {}) => {
    const state = get();
    const currentProducts = state.products;
    set({ loading: true });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const queryParams = new URLSearchParams();
      queryParams.set("skip", currentProducts.length.toString());
      queryParams.set("limit", state.itemsPerPage.toString());
      queryParams.set("inStock", "true");

      // Dodajemy sortowanie jeśli jest
      if (filters.sort) {
        queryParams.set("sort", filters.sort);
      }

      // Dodaj pozostałe filtry
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value.toString());
      });

      const response = await fetch(`${baseUrl}/api/products?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        set({
          products: [...currentProducts, ...(data.data.products || [])],
          totalProducts: data.data.total || 0,
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      set({ error: "Błąd podczas ładowania kolejnych produktów" });
    } finally {
      set({ loading: false });
    }
  },

  setItemsPerPage: (value, additionalFilters = {}) => {
    set({ itemsPerPage: value });
    const state = get();
    state.fetchProducts(additionalFilters);
  },

  initializeFiltersForCategory: async (categoryId: string) => {
    try {
      console.log("ShopStore initializeFiltersForCategory - start:", {
        categoryId,
        timestamp: new Date().toISOString(),
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(
        `${baseUrl}/api/categories/${categoryId}/ranges`
      );
      const data = await response.json();
      console.log("ShopStore initializeFiltersForCategory - odpowiedź:", {
        success: data.success,
        ranges: data.data,
        timestamp: new Date().toISOString(),
      });

      if (data.success) {
        const newRanges = {
          power: data.data.power,
          rpm: data.data.rpm,
          shaftDiameter: data.data.shaftDiameter,
        };

        set((state) => ({
          ranges: {
            ...state.ranges,
            ...newRanges,
          },
          activeFilters: {
            ...state.activeFilters,
            power: newRanges.power,
            rpm: newRanges.rpm,
            shaftDiameter: newRanges.shaftDiameter,
            condition: "",
            manufacturer: "",
            productType: [],
          },
        }));

        localStorage.removeItem("shopFilters");
      }
    } catch (error) {
      console.error("ShopStore - Error initializing filters:", error);
    }
  },

  hasActiveFilters: () => {
    const state = get();
    const { activeFilters, ranges } = state;

    return (
      activeFilters.power[0] !== ranges.power[0] ||
      activeFilters.power[1] !== ranges.power[1] ||
      activeFilters.rpm[0] !== ranges.rpm[0] ||
      activeFilters.rpm[1] !== ranges.rpm[1] ||
      activeFilters.shaftDiameter[0] !== ranges.shaftDiameter[0] ||
      activeFilters.shaftDiameter[1] !== ranges.shaftDiameter[1] ||
      !!activeFilters.condition ||
      !!activeFilters.manufacturer ||
      activeFilters.productType.length > 0
    );
  },
}));

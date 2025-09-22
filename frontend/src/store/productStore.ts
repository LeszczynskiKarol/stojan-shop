// frontend/src/store/productStore.ts
import { create } from "zustand";
import { IProduct } from "@/types/product.types";
import { useCategoryStore } from "@/store/categoryStore";
import { api, productAPI } from "@/lib/api";

export interface FetchProductsAdminParams {
  page: number;
  limit: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

interface AllegroProductsParams {
  page: number;
  limit: number;
  phrase?: string;
  condition?: string;
  status?: string;
  priceMin?: string;
  priceMax?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

interface APIProductResponse {
  _id?: string;
  id?: string;
  [key: string]: any;
  name: string;
  manufacturer: string;
  stock: number;
}

interface APIResponse {
  success: boolean;
  data: {
    products: APIProductResponse[];
    totalPages: number;
    total: number;
  };
}

interface ProductStore {
  products: IProduct[];
  selectedProduct: IProduct | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalProducts: number;
  updateProductName: (productId: string, newName: string) => Promise<any>;
  fetchProducts: (
    params?: Record<string, unknown>
  ) => Promise<APIResponse | undefined>;
  fetchProductsAdmin: (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }) => Promise<void>;
  fetchProductsForAdmin: (params: FetchProductsAdminParams) => Promise<void>;
  setSelectedProduct: (product: IProduct | null) => void;
  createProduct: (product: Partial<IProduct>) => Promise<void>;
  updateProduct: (id: string, data: Partial<IProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateMarketplace: (
    id: string,
    marketplace: string,
    data: unknown
  ) => Promise<void>;
  setPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  updateManyCategories: (
    productIds: string[],
    categoryId: string,
    updateDataArray: any[]
  ) => Promise<void>;
  updateProductStock: (
    productId: string,
    newStock: number,
    syncWithAllegro?: boolean
  ) => Promise<any>;
  updateProductStatus: (
    productId: string,
    marketplace: "allegro" | "ownStore" | "all",
    active: boolean
  ) => Promise<any>;
  currentSearch: string;
  fetchAllegroProducts: (params: AllegroProductsParams) => Promise<void>;
  updateProductPrice: (productId: string, newPrice: number) => Promise<any>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  currentPage: 0,
  itemsPerPage: 20,
  totalPages: 0,
  totalProducts: 0,
  categories: [],
  currentSearch: "",

  updateProductName: async (productId: string, newName: string) => {
    console.log("=== updateProductName ===");
    console.log("productId:", productId);
    console.log("newName:", newName);

    // Znajdź produkt w lokalnym stanie
    const products = get().products;
    const productToUpdate = products.find(
      (p) => p.id === productId || p._id === productId
    );

    if (!productToUpdate) {
      console.error("Nie znaleziono produktu:", productId);
      return { success: false, error: "Produkt nie znaleziony" };
    }

    // Sprawdź, czy produkt ma powiązanie z Allegro
    let allegroProductId = productToUpdate?.marketplaces?.allegro?.productId;
    let foundInRelated = false;

    // Jeśli nie ma bezpośredniego ID Allegro, ale jest powiązanie z innym produktem
    if (
      !allegroProductId &&
      productToUpdate?.matched_store_product?.store_product_id
    ) {
      const relatedProductId =
        productToUpdate.matched_store_product.store_product_id;
      console.log(
        "Szukam ID Allegro w powiązanym produkcie:",
        relatedProductId
      );

      // Najpierw szukamy w lokalnym stanie
      let relatedProduct = products.find(
        (p) => p.id === relatedProductId || p._id === relatedProductId
      );

      // Jeśli nie znaleziono w lokalnym stanie, próbujemy pobrać z API
      if (!relatedProduct) {
        console.log(
          "Nie znaleziono powiązanego produktu w lokalnym stanie, próbuję pobrać z API"
        );
        try {
          const response = await api.get(`/products/${relatedProductId}`);
          if (response.data.success) {
            relatedProduct = response.data.data;
            console.log("Pobrano powiązany produkt z API:", relatedProduct);
          }
        } catch (err) {
          console.error(
            "Nie udało się pobrać powiązanego produktu z API:",
            err
          );
        }
      }

      if (relatedProduct?.marketplaces?.allegro?.productId) {
        allegroProductId = relatedProduct.marketplaces.allegro.productId;
        foundInRelated = true;
        console.log(
          "Znaleziono ID Allegro w powiązanym produkcie:",
          allegroProductId
        );
      } else {
        console.log("Powiązany produkt nie ma ID Allegro:", relatedProduct);
      }
    }

    // Aktualizuj dane lokalnie
    const updatedProducts = products.map((product) => {
      if (product.id === productId || product._id === productId) {
        return {
          ...product,
          name: newName,
        };
      }
      return product;
    });

    set({ products: updatedProducts });

    // Jeśli mamy ID Allegro, wysyłamy do API
    if (allegroProductId) {
      console.log("🔄 Wysyłanie aktualizacji nazwy do API Allegro...", {
        productId,
        allegroProductId,
        newName,
      });

      set({ loading: true, error: null });
      try {
        const response = await api.patch(
          `/allegro/offers/${allegroProductId}/name`,
          {
            newName,
          }
        );

        console.log("✅ Odpowiedź API Allegro:", response.data);

        // Przygotuj pełne dane produktu do aktualizacji - WAŻNA ZMIANA!
        const updateData: Partial<IProduct> = {
          id: productId,
          _id: productId,
          name: newName,
          manufacturer: productToUpdate.manufacturer,
          power: productToUpdate.power,
          rpm: productToUpdate.rpm,
          startType: productToUpdate.startType,
          condition: productToUpdate.condition,
          shaftDiameter: productToUpdate.shaftDiameter,
          mechanicalSize: productToUpdate.mechanicalSize,
          stock: productToUpdate.stock,
          weight: productToUpdate.weight || 0, // Upewnij się, że waga jest zdefiniowana
          categories: productToUpdate.categories || [], // Zawsze dodajemy kategorie
          marketplaces: {
            ...productToUpdate.marketplaces,
            ownStore: {
              ...productToUpdate.marketplaces?.ownStore,
              price: productToUpdate.marketplaces?.ownStore?.price || 0,
              active: productToUpdate.marketplaces?.ownStore?.active || false,
              category_path:
                productToUpdate.marketplaces?.ownStore?.category_path || "",
              slug: productToUpdate.marketplaces?.ownStore?.slug || "",
            },
          },
        };

        // Aktualizuj produkt w bazie danych z wszystkimi wymaganymi polami
        await productAPI.update(productId, updateData);

        return response.data;
      } catch (error) {
        console.error("❌ Błąd aktualizacji nazwy produktu na Allegro:", error);
        set({ error: "Błąd podczas aktualizacji nazwy produktu na Allegro" });
        throw error;
      } finally {
        set({ loading: false });
      }
    } else {
      console.error(
        "❌ Nie można synchronizować z Allegro - brak ID oferty Allegro"
      );
    }

    // Aktualizuj produkt w bazie danych (nawet jeśli nie ma aktualizacji Allegro)
    try {
      // Przygotuj pełne dane produktu do aktualizacji - WAŻNA ZMIANA!
      const updateData: Partial<IProduct> = {
        id: productId,
        _id: productId,
        name: newName,
        manufacturer: productToUpdate.manufacturer,
        power: productToUpdate.power,
        rpm: productToUpdate.rpm,
        startType: productToUpdate.startType,
        condition: productToUpdate.condition,
        shaftDiameter: productToUpdate.shaftDiameter,
        mechanicalSize: productToUpdate.mechanicalSize,
        stock: productToUpdate.stock,
        weight: productToUpdate.weight || 0, // Upewnij się, że waga jest zdefiniowana
        categories: productToUpdate.categories || [], // Zawsze dodajemy kategorie
        marketplaces: {
          ...productToUpdate.marketplaces,
          ownStore: {
            ...productToUpdate.marketplaces?.ownStore,
            price: productToUpdate.marketplaces?.ownStore?.price || 0,
            active: productToUpdate.marketplaces?.ownStore?.active || false,
            category_path:
              productToUpdate.marketplaces?.ownStore?.category_path || "",
            slug: productToUpdate.marketplaces?.ownStore?.slug || "",
          },
        },
      };

      // Aktualizuj produkt w bazie danych z wszystkimi wymaganymi polami
      await productAPI.update(productId, updateData);
    } catch (error) {
      console.error(
        "❌ Błąd aktualizacji nazwy produktu w bazie danych:",
        error
      );
      throw error;
    }

    return { success: true, data: { name: newName } };
  },

  updateProductStatus: async (
    productId: string,
    marketplace: "allegro" | "ownStore" | "all",
    active: boolean
  ) => {
    console.log("=== updateProductStatus ===");
    console.log("productId:", productId);
    console.log("marketplace:", marketplace);
    console.log("active:", active);

    // Znajdź produkt w lokalnym stanie
    const products = get().products;
    const productToUpdate = products.find(
      (p) => p.id === productId || p._id === productId
    );

    if (!productToUpdate) {
      console.error("Nie znaleziono produktu:", productId);
      return { success: false, error: "Produkt nie znaleziony" };
    }

    // Sprawdź, czy produkt ma powiązanie z Allegro
    let allegroProductId = productToUpdate?.marketplaces?.allegro?.productId;
    let foundInRelated = false;

    // Jeśli nie ma bezpośredniego ID Allegro, ale jest powiązanie z innym produktem
    if (
      !allegroProductId &&
      productToUpdate?.matched_store_product?.store_product_id &&
      (marketplace === "allegro" || marketplace === "all")
    ) {
      const relatedProductId =
        productToUpdate.matched_store_product.store_product_id;
      console.log(
        "Szukam ID Allegro w powiązanym produkcie:",
        relatedProductId
      );

      // Najpierw szukamy w lokalnym stanie
      let relatedProduct = products.find(
        (p) => p.id === relatedProductId || p._id === relatedProductId
      );

      // Jeśli nie znaleziono w lokalnym stanie, próbujemy pobrać z API
      if (!relatedProduct) {
        console.log(
          "Nie znaleziono powiązanego produktu w lokalnym stanie, próbuję pobrać z API"
        );
        try {
          const response = await api.get(`/products/${relatedProductId}`);
          if (response.data.success) {
            relatedProduct = response.data.data;
            console.log("Pobrano powiązany produkt z API:", relatedProduct);
          }
        } catch (err) {
          console.error(
            "Nie udało się pobrać powiązanego produktu z API:",
            err
          );
        }
      }

      if (relatedProduct?.marketplaces?.allegro?.productId) {
        allegroProductId = relatedProduct.marketplaces.allegro.productId;
        foundInRelated = true;
        console.log(
          "Znaleziono ID Allegro w powiązanym produkcie:",
          allegroProductId
        );
      } else {
        console.log("Powiązany produkt nie ma ID Allegro:", relatedProduct);
      }
    }

    // Aktualizuj dane lokalnie
    const updatedProducts = products.map((product) => {
      if (product.id === productId || product._id === productId) {
        const updatedMarketplaces = { ...(product.marketplaces || {}) };

        if (marketplace === "allegro" || marketplace === "all") {
          updatedMarketplaces.allegro = {
            ...(updatedMarketplaces.allegro || {}),
            active,
          };
        }

        if (marketplace === "ownStore" || marketplace === "all") {
          updatedMarketplaces.ownStore = {
            ...(updatedMarketplaces.ownStore || {}),
            active,
          };
        }

        return {
          ...product,
          marketplaces: updatedMarketplaces,
        };
      }
      return product;
    });

    set({ products: updatedProducts });

    // Jeśli aktualizujemy Allegro i mamy ID Allegro, wysyłamy do API
    if (
      (marketplace === "allegro" || marketplace === "all") &&
      allegroProductId
    ) {
      console.log("🔄 Wysyłanie aktualizacji statusu do API Allegro...", {
        productId,
        allegroProductId,
        active,
      });

      set({ loading: true, error: null });
      try {
        const response = await api.patch(
          `/allegroProducts/${allegroProductId}/status`,
          {
            active,
          }
        );

        console.log("✅ Odpowiedź API Allegro:", response.data);

        // Aktualizuj produkt w bazie danych
        await productAPI.update(productId, {
          marketplaces: updatedProducts.find(
            (p) => p.id === productId || p._id === productId
          )?.marketplaces,
        });

        return response.data;
      } catch (error) {
        console.error(
          "❌ Błąd aktualizacji statusu produktu na Allegro:",
          error
        );
        set({ error: "Błąd podczas aktualizacji statusu produktu na Allegro" });
        throw error;
      } finally {
        set({ loading: false });
      }
    } else if (
      (marketplace === "allegro" || marketplace === "all") &&
      !allegroProductId
    ) {
      console.error(
        "❌ Nie można synchronizować z Allegro - brak ID oferty Allegro"
      );
    }

    // Aktualizuj produkt w bazie danych (nawet jeśli nie ma aktualizacji Allegro)
    if (
      marketplace === "ownStore" ||
      (marketplace === "all" && !allegroProductId)
    ) {
      try {
        await productAPI.update(productId, {
          marketplaces: updatedProducts.find(
            (p) => p.id === productId || p._id === productId
          )?.marketplaces,
        });
      } catch (error) {
        console.error(
          "❌ Błąd aktualizacji statusu produktu w bazie danych:",
          error
        );
        throw error;
      }
    }

    return { success: true, data: { active } };
  },

  fetchAllegroProducts: async (params: AllegroProductsParams) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", params.page.toString());
      queryParams.append("limit", params.limit.toString());
      if (params.phrase) queryParams.append("phrase", params.phrase);
      if (params.condition) queryParams.append("condition", params.condition);
      if (params.status) queryParams.append("status", params.status);
      if (params.priceMin) queryParams.append("priceMin", params.priceMin);
      if (params.priceMax) queryParams.append("priceMax", params.priceMax);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortDirection)
        queryParams.append("sortDirection", params.sortDirection);

      const response = await api.get(
        `/allegroProducts/admin/search?${queryParams}`
      );

      if (response.data.success) {
        const { offers, totalCount, totalPages, currentPage } =
          response.data.data;

        // Sprawdzamy czy to pierwsze ładowanie (bez filtrów)
        const isInitialLoad =
          !params.phrase && !params.condition && !params.status;

        set({
          products: offers,
          totalProducts: totalCount,
          totalPages: totalPages,
          currentPage: currentPage,
          loading: false,
          // Dodajemy inicjalne wartości jeśli to pierwsze ładowanie
          ...(isInitialLoad && {
            initialTotalProducts: totalCount,
            initialTotalPages: totalPages,
          }),
        });
      } else {
        throw new Error(response.data.message || "Błąd pobierania produktów");
      }
    } catch (error) {
      console.error("Błąd pobierania produktów:", error);
      set({
        error: "Błąd podczas pobierania produktów z Allegro",
        loading: false,
      });
    }
  },

  fetchProducts: async (params: Record<string, unknown> = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await productAPI.getAllProducts(params);

      if (response.success && response.data?.products) {
        const products = response.data.products.map((product: any) => {
          return {
            ...product,
            _id: product._id || product.id,
            id: product.id || product._id,
            marketplaces: {
              ...product.marketplaces,
              allegro: product.marketplaces?.allegro || {
                active: false,
              },
            },
          };
        });

        set({
          products,
          totalProducts: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        });

        return response;
      }
      return undefined;
    } catch (error) {
      console.error("Błąd w fetchProducts:", error);
      set({ error: "Błąd podczas pobierania produktów" });
      return undefined;
    } finally {
      set({ loading: false });
    }
  },

  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchProducts();
  },

  setItemsPerPage: (count: number) => {
    set({ itemsPerPage: count, currentPage: 0 });
    get().fetchProducts();
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  // Pozostałe metody pozostają bez zmian
  createProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const productWithMarketplaces = {
        ...product,
        marketplaces: product.marketplaces || {
          allegro: { active: false },
          olx: { active: false },
          ownStore: { active: false },
        },
      };

      console.log("=== Tworzenie nowego produktu ===");
      console.log("Dane produktu:", productWithMarketplaces);

      const response = await productAPI.create(productWithMarketplaces);
      const products = get().products;

      console.log("✅ Produkt utworzony:", response.data);

      // Automatycznie twórz powiązanie z samym sobą jeśli nie istnieje
      if (response.data.id && !response.data.matched_store_product) {
        console.log(
          "🔄 Automatyczne tworzenie powiązania produktu z samym sobą..."
        );

        try {
          const updatedProduct = {
            ...response.data,
            matched_store_product: {
              store_product_id: response.data.id,
              store_product_name: response.data.name,
              matched_at: new Date(),
            },
          };

          await productAPI.update(response.data.id, updatedProduct);
          console.log("✅ Dodano automatyczne powiązanie do produktu");

          set({ products: [...products, updatedProduct] });
          return updatedProduct;
        } catch (error) {
          console.error(
            "❌ Błąd podczas dodawania automatycznego powiązania:",
            error
          );
          set({ products: [...products, response.data] });
          return response.data;
        }
      } else {
        set({ products: [...products, response.data] });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Błąd podczas tworzenia produktu";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id: string, data: Partial<IProduct>) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        console.error("Brak ID produktu w updateProduct");
        throw new Error("Brak ID produktu");
      }

      const response = await productAPI.update(id, data);

      // Aktualizuj produkt w store używając obu ID
      const products = get().products.map((p) =>
        p.id === id || p._id === id ? { ...response.data, id, _id: id } : p
      );
      set({ products });
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      set({ error: "Błąd podczas aktualizacji produktu" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await productAPI.delete(id);
      const products = get().products.filter((p) => p._id !== id);
      set({ products });
    } catch (error) {
      set({ error: "Błąd podczas usuwania produktu" });
    } finally {
      set({ loading: false });
    }
  },

  updateMarketplace: async (id, marketplace, data) => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.updateMarketplace(
        id,
        marketplace,
        data
      );
      const products = get().products.map((p) =>
        p._id === id ? response.data : p
      );
      set({ products });
    } catch (error) {
      set({ error: "Błąd podczas aktualizacji marketplace" });
    } finally {
      set({ loading: false });
    }
  },

  updateProductStock: async (
    productId: string,
    newStock: number,
    syncWithAllegro = false
  ) => {
    console.log("=== updateProductStock ===");
    console.log("productId:", productId);
    console.log("newStock:", newStock);
    console.log("syncWithAllegro:", syncWithAllegro);

    // Najpierw aktualizujemy lokalnie
    const products = get().products;
    const productToUpdate = products.find(
      (p) => p.id === productId || p._id === productId
    );

    console.log(
      "Aktualizowany produkt:",
      productToUpdate
        ? {
            id: productToUpdate.id,
            name: productToUpdate.name,
            allegroProductId: productToUpdate.marketplaces?.allegro?.productId,
            matched_store_product: productToUpdate.matched_store_product,
          }
        : "nie znaleziono"
    );

    // Sprawdzamy powiązanie z Allegro bezpośrednio
    let allegroProductId = productToUpdate?.marketplaces?.allegro?.productId;
    let foundInRelated = false;

    // Jeśli nie ma bezpośredniego ID Allegro, ale jest powiązanie z innym produktem
    if (
      !allegroProductId &&
      productToUpdate?.matched_store_product?.store_product_id
    ) {
      const relatedProductId =
        productToUpdate.matched_store_product.store_product_id;
      console.log(
        "Szukam ID Allegro w powiązanym produkcie:",
        relatedProductId
      );

      // Najpierw szukamy w lokalnym stanie
      let relatedProduct = products.find(
        (p) => p.id === relatedProductId || p._id === relatedProductId
      );

      // Jeśli nie znaleziono w lokalnym stanie, próbujemy pobrać z API
      if (!relatedProduct) {
        console.log(
          "Nie znaleziono powiązanego produktu w lokalnym stanie, próbuję pobrać z API"
        );
        try {
          const response = await api.get(`/products/${relatedProductId}`);
          if (response.data.success) {
            relatedProduct = response.data.data;
            console.log("Pobrano powiązany produkt z API:", relatedProduct);
          }
        } catch (err) {
          console.error(
            "Nie udało się pobrać powiązanego produktu z API:",
            err
          );
        }
      }

      if (relatedProduct?.marketplaces?.allegro?.productId) {
        allegroProductId = relatedProduct.marketplaces.allegro.productId;
        foundInRelated = true;
        console.log(
          "Znaleziono ID Allegro w powiązanym produkcie:",
          allegroProductId
        );
      } else {
        console.log("Powiązany produkt nie ma ID Allegro:", relatedProduct);
      }
    }

    // Aktualizuj dane lokalnie
    const updatedProducts = products.map((product) => {
      if (product.id === productId || product._id === productId) {
        // Zachowaj obecną wartość active
        const currentActive = product.marketplaces?.allegro?.active === true;

        console.log("Aktualizuję produkt lokalnie:", {
          id: product.id,
          oldStock: product.stock,
          newStock: newStock,
          allegroProductId:
            product.marketplaces?.allegro?.productId ||
            (foundInRelated ? allegroProductId : undefined),
        });

        return {
          ...product,
          stock: newStock,
          marketplaces: {
            ...product.marketplaces,
            allegro: {
              ...product.marketplaces?.allegro,
              stock: newStock,
              active: currentActive,
            },
          },
        };
      }
      return product;
    });

    set({ products: updatedProducts });

    // Jeśli syncWithAllegro=true i mamy ID Allegro, wysyłamy do API
    // W productStore.ts, funkcja updateProductStock
    if (syncWithAllegro && allegroProductId) {
      console.log("🔄 Wysyłanie aktualizacji stanu do API Allegro...", {
        productId,
        allegroProductId,
        foundInRelated,
      });

      set({ loading: true, error: null });
      try {
        // Najpierw aktualizuj stan lokalnego produktu
        await api.patch(`/allegroProducts/${productId}/stock`, { newStock });

        // Następnie aktualizuj stan na Allegro przez NOWY endpoint
        const response = await api.patch(
          `/allegro/offers/${allegroProductId}/stock`,
          {
            newStock,
          }
        );

        console.log("✅ Odpowiedź API Allegro:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Błąd aktualizacji stanu produktu na Allegro:", error);
        set({ error: "Błąd podczas aktualizacji stanu produktu na Allegro" });
        throw error;
      } finally {
        set({ loading: false });
      }
    } else {
      // Tylko aktualizacja lokalnego produktu
      console.log("ℹ️ Pominięto synchronizację z Allegro");
      return await api.patch(`/products`, { id: productId, stock: newStock });
    }
  },

  updateManyCategories: async (
    productIds: string[],
    categoryId: string,
    updateDataArray: any[]
  ) => {
    set({ loading: true, error: null });
    try {
      const categoryStore = useCategoryStore.getState();
      const category = categoryStore.categories.find(
        (c) => c.id === categoryId
      );

      if (!category) throw new Error("Kategoria nie znaleziona");

      await Promise.all(
        productIds.map(async (id, index) => {
          const updateData = updateDataArray[index];

          // Upewniamy się, że wszystkie wymagane pola są obecne
          if (!updateData.weight) {
            const currentProduct = get().products.find(
              (p) => p._id === id || p.id === id
            );
            updateData.weight = currentProduct?.weight || 0;
          }

          updateData.categories = [
            {
              id: category.id,
              name: category.name,
              slug: category.slug,
            },
          ];

          updateData.marketplaces = {
            ...updateData.marketplaces,
            ownStore: {
              ...updateData.marketplaces?.ownStore,
              category_path: `${category.slug}/`,
            },
          };

          return productAPI.update(id, updateData);
        })
      );

      await get().fetchProducts();
    } catch (error) {
      console.error("Error updating categories:", error);
      set({ error: "Błąd podczas aktualizacji kategorii" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchProductsForAdmin: async (params: FetchProductsAdminParams) => {
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", params.page.toString());
      queryParams.append("limit", params.limit.toString());
      if (params.sortField) queryParams.append("sortField", params.sortField);
      if (params.sortDirection)
        queryParams.append("sortDirection", params.sortDirection);
      if (params.search) queryParams.append("search", params.search);

      // Dodajemy parametry do URL
      const response = await api.get(
        `/products/admin?${queryParams.toString()}`
      );

      if (response.data.success) {
        set({
          products: response.data.data.products.map((product: any) => ({
            ...product,
            id: product.id || product._id,
            _id: product._id || product.id,
          })),
          totalProducts: response.data.data.total,
          totalPages: Math.ceil(response.data.data.total / params.limit),
          currentPage: params.page,
          itemsPerPage: params.limit,
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      set({ error: "Błąd podczas pobierania produktów" });
    } finally {
      set({ loading: false });
    }
  },

  fetchProductsAdmin: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const page = params.page ?? 0;
      const limit = params.limit ?? 20;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortDirection)
        queryParams.append("sortDirection", params.sortDirection);
      queryParams.append("_", Date.now().toString());

      const [productsResponse, allegroResponse] = await Promise.all([
        fetch(`/api/products/admin?${queryParams.toString()}`),
        fetch(`/api/allegro/offers?${queryParams.toString()}`),
      ]);

      if (!productsResponse.ok) {
        throw new Error(
          `Błąd pobierania produktów: ${productsResponse.status}`
        );
      }

      const productsData = await productsResponse.json();
      const allegroData = await allegroResponse.json();

      if (productsData.success) {
        // Mapujemy produkty ze sklepu
        const regularProducts = productsData.data.products.map(
          (product: any) => ({
            ...product,
            _id: product._id || product.id,
            id: product.id || product._id,
            marketplaces: {
              ...product.marketplaces,
              allegro: product.marketplaces?.allegro || { active: false },
            },
          })
        );

        // Mapujemy produkty z Allegro
        const allegroProducts = allegroData.success
          ? allegroData.data.offers.map((offer: any) => ({
              _id: offer.id,
              name: offer.name,
              manufacturer: offer.name,
              marketplaces: {
                allegro: {
                  productId: offer.id,
                  price: parseFloat(offer.sellingMode?.price?.amount || "0"),
                  publication: {
                    status: offer.publication?.status,
                  },
                  url: `https://allegro.pl/oferta/${offer.id}`,
                  description: offer.description,
                  images:
                    offer.images?.map((img: { url: string }) => img.url) || [],
                  stock: offer.stock?.available || 0,
                  category: offer.category,
                  parameters: offer.parameters,
                },
              },
              condition:
                offer.parameters
                  ?.find((p: any) => p.id === "11323")
                  ?.values[0]?.toLowerCase() || "nowy",
              power: {
                value: "0",
                range: "",
                unit: "kW",
              },
              rpm: {
                value: "0",
                range: "",
                unit: "obr/min",
              },
              stock: offer.stock?.available || 0,
              images:
                offer.images?.map((img: { url: string }) => img.url) || [],
            }))
          : [];

        // Łączymy produkty po nazwie
        const mergedProducts = regularProducts.map((product: IProduct) => {
          const allegroMatch = allegroProducts.find(
            (ap: IProduct) =>
              ap.name.toLowerCase().trim() === product.name.toLowerCase().trim()
          );

          if (allegroMatch) {
            // Jeśli znaleźliśmy, łączymy dane
            return {
              ...product,
              marketplaces: {
                ...product.marketplaces,
                allegro: {
                  ...allegroMatch.marketplaces.allegro,
                  productId: allegroMatch._id,
                },
              },
            };
          }

          return product;
        });

        // Dodajemy produkty z Allegro, których nie ma w sklepie
        const allegroOnlyProducts = allegroProducts.filter(
          (ap: IProduct) =>
            !regularProducts.some(
              (rp: IProduct) =>
                rp.name.toLowerCase().trim() === ap.name.toLowerCase().trim()
            )
        );

        set({
          products: [...mergedProducts, ...allegroOnlyProducts],
          totalProducts: productsData.data.total,
          totalPages: Math.ceil(productsData.data.total / limit),
          currentPage: page,
          itemsPerPage: limit,
        });
      }

      return productsData;
    } catch (error) {
      console.error("Błąd w fetchProductsAdmin:", error);
      set({ error: "Błąd podczas pobierania produktów" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadAllegroProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/allegro-products");
      const data = await response.json();

      if (data.success) {
        set({
          products: data.data.offers.map((product: any) => ({
            ...product,
            _id: product._id || product.id,
            id: product.id || product._id,
          })),
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      set({ error: "Błąd podczas pobierania produktów" });
    } finally {
      set({ loading: false });
    }
  },

  updateProductPrice: async (productId: string, newPrice: number) => {
    set({ loading: true, error: null });
    try {
      // Aktualizacja ceny w sklepie i na Allegro
      const response = await api.patch(`/allegroProducts/${productId}/price`, {
        newPrice,
      });

      if (response.data.success) {
        // Aktualizacja produktu w store
        const updatedProducts = get().products.map((p) => {
          if (p.id === productId || p._id === productId) {
            // Upewnij się, że wszystkie wymagane pola istnieją
            const allegroData = p.marketplaces?.allegro || { active: false };

            return {
              ...p,
              marketplaces: {
                ...p.marketplaces,
                allegro: {
                  ...allegroData,
                  price: newPrice,
                  // Upewnij się, że active jest boolean
                  active: allegroData.active === true,
                },
              },
            };
          }
          return p;
        });

        set({ products: updatedProducts });
      }
      return response.data;
    } catch (error) {
      console.error("Error updating product price:", error);
      set({ error: "Błąd podczas aktualizacji ceny produktu" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

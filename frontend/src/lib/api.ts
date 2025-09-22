// frontend/src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
    throw new Error("Nieautoryzowany dostęp");
  }

  return response;
};

export const api = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_URL ||
      "https://www.silniki-elektryczne.com.pl") + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Dodaj interceptory tutaj, po utworzeniu instancji api
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Błąd z serwera:", error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
      const store = useAuthStore.getState();
      if (store.token) {
        store.logout();
      }
    }
    if (error.response?.status === 404) {
      console.log("Nie znaleziono zasobu:", error.config.url);
      // Możesz tu dodać przekierowanie na stronę 404
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  getAllProducts: async (params = {}) => {
    const response = await Promise.all([api.get("/products", { params })]);

    const [productsResponse] = response;

    return {
      ...productsResponse.data,
      data: {
        ...productsResponse.data.data,
        products: [...productsResponse.data.data.products],
      },
    };
  },

  getAll: async (params = {}) => {
    const response = await api.get("/products", { params });

    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post("/products", data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/products/admin/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  updateMarketplace: async (id: string, marketplace: string, data: any) => {
    const response = await api.patch(
      `/products/${id}/marketplace/${marketplace}`,
      data
    ); // usuń /admin
    return response.data;
  },

  previewWooCommerce: async () => {
    const response = await api.get("/products/import-woo/preview");
    return response.data;
  },

  importWooCommerce: async (productIds: number[]) => {
    const response = await api.post("/products/import-woo", { productIds });
    return response.data;
  },

  getByCategoryId: async (categoryId: string, params = {}) => {
    const response = await api.get(`/categories/${categoryId}/products`, {
      params,
    });
    return response.data;
  },

  getProductsByCategory: async (categoryId: string, params = {}) => {
    const response = await api.get(`/products/getByCategory/${categoryId}`, {
      params,
    });
    return response.data;
  },
};

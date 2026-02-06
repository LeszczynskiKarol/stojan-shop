// frontend/src/app/(admin)/admin/marketplaces/allegro/page.tsx

"use client";
import React, { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAllegroAuthStore } from "@/store/allegroAuthStore";
import { useProductStore } from "@/store/productStore";
import { useToast } from "@/components/ui/use-toast";
import _ from "lodash";
import {
  Download,
  Check,
  X,
  Edit2,
  Save,
  Upload,
  ArrowUpDown,
} from "lucide-react";
import { parseAllegroDescription } from "@/utils/allegroHelpers";
import { ICategory } from "@/types/category.types";
import { IProduct } from "@/types/product.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface MatchedProductsMap {
  [key: string]: IProduct;
}

interface ProductWithId extends IProduct {
  _id: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface Filters {
  manufacturer: string;
  condition: string;
  status: string;
  priceMin: string;
  priceMax: string;
  storeStatus: string;
  stockDifference: string;
}

interface SortConfig {
  key: keyof IProduct | null;
  direction: "asc" | "desc";
}

const AllegroPage = () => {
  const productStore = useProductStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { products } = productStore;
  const router = useRouter();
  const [matchedProducts, setMatchedProducts] = useState<MatchedProductsMap>(
    {}
  );
  const [customSlug, setCustomSlug] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  // Użyj obiektu przechowującego stan dla każdego produktu
  const [editingStates, setEditingStates] = useState<
    Record<string, { isEditing: boolean; price: number | null }>
  >({});
  const [editingStockStates, setEditingStockStates] = useState<
    Record<string, { isEditing: boolean; stock: number | null }>
  >({});
  const { loading } = productStore;
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [productToImport, setProductToImport] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 0,
    totalPages: 0,
    totalCount: 0,
  });
  const [isComparingProducts, setIsComparingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });
  const [filters, setFilters] = useState<Filters>({
    manufacturer: "",
    condition: "",
    status: "active",
    priceMin: "",
    priceMax: "",
    storeStatus: "",
    stockDifference: "",
  });

  const resetFilters = () => {
    setFilters({
      manufacturer: "",
      condition: "",
      status: "",
      priceMin: "",
      priceMax: "",
      storeStatus: "",
      stockDifference: "",
    });
    setSortConfig({ key: null, direction: "asc" });
    fetchProducts(0);
  };

  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { isAuthenticated } = useAllegroAuthStore();
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      console.error("Błąd pobierania kategorii:", error);
    }
  };

  const startEditingStock = (productId: string, initialStock: number) => {
    setEditingStockStates((prev) => ({
      ...prev,
      [productId]: { isEditing: true, stock: initialStock },
    }));
  };

  const updateEditingStock = (productId: string, newStock: number) => {
    setEditingStockStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], stock: newStock },
    }));
  };

  const stopEditingStock = (productId: string) => {
    setEditingStockStates((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleSaveStock = async (productId: string, newStock: number) => {
    if (!productId) {
      console.error("Brak ID produktu!");
      toast({
        title: "Błąd",
        description: "Nie można zaktualizować stanu - brak ID produktu",
        variant: "destructive",
      });
      return;
    }

    try {
      // Używamy flag syncWithAllegro = true aby wysłać zmiany do API
      await productStore.updateProductStock(productId, newStock, true);
      toast({
        title: "Sukces",
        description: "Stan został zaktualizowany",
      });
      stopEditingStock(productId);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować stanu",
        variant: "destructive",
      });
    }
  };

  const handleSavePrice = async (productId: string, newPrice: number) => {
    if (!productId) {
      console.error("Brak ID produktu!");
      toast({
        title: "Błąd",
        description: "Nie można zaktualizować ceny - brak ID produktu",
        variant: "destructive",
      });
      return;
    }

    try {
      await productStore.updateProductPrice(productId, newPrice);
      toast({
        title: "Sukces",
        description: "Cena została zaktualizowana",
      });
      setEditingId(null);
      setEditingPrice(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować ceny",
        variant: "destructive",
      });
    }
  };

  const startEditing = (productId: string, initialPrice: number) => {
    setEditingStates((prev) => ({
      ...prev,
      [productId]: { isEditing: true, price: initialPrice },
    }));
  };

  const updateEditingPrice = (productId: string, newPrice: number) => {
    setEditingStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], price: newPrice },
    }));
  };

  const stopEditing = (productId: string) => {
    setEditingStates((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMatchedProducts = async () => {
      const matchedIds = products
        .filter((p) => p.matched_store_product?.store_product_id)
        .map((p) => ({
          productName: p.name,
          storeProductId: p.matched_store_product!.store_product_id,
        }));

      try {
        const response = await fetch("/api/allegroProducts/admin");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data?.matchedProducts) {
          const matchedProductsData = data.data.matchedProducts;

          setMatchedProducts(matchedProductsData);
        } else {
          console.error("No matchedProducts in response");
        }
      } catch (error) {
        console.error("Failed to fetch matched products:", error);
      }
    };

    if (products.length > 0) {
      fetchMatchedProducts();
    }
  }, [products]);

  const handleCompare = async () => {
    setIsComparingProducts(true);
    try {
      const response = await fetch("/api/allegroProducts/matches");
      const data = await response.json();

      if (data.success) {
        // Ustaw matches w stanie

        // Przeładuj listę z backendu
        await productStore.fetchAllegroProducts({
          page: 0,
          limit: itemsPerPage,
          phrase: searchQuery,
          sortDirection: "ASC",
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się porównać produktów",
        variant: "destructive",
      });
    }
    setIsComparingProducts(false);
  };

  const handleImportAll = async () => {
    try {
      setIsImporting(true);
      setImportProgress({
        current: 0,
        total: 0,
        message: "Rozpoczynam import produktów z Allegro...",
      });

      toast({
        title: "Import rozpoczęty",
        description:
          "Trwa pobieranie produktów z Allegro. To może potrwać kilka minut...",
      });

      const response = await fetch("/api/admin/allegro/import-all", {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd importu: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Import zakończony!",
          description: `Zaimportowano ${data.totalImported} produktów z Allegro`,
        });

        // Odśwież listę produktów
        await fetchProducts(0);
      } else {
        throw new Error(data.message || "Nieznany błąd podczas importu");
      }
    } catch (error) {
      console.error("Błąd importu:", error);
      toast({
        title: "Błąd",
        description:
          error instanceof Error ? error.message : "Błąd podczas importu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  useEffect(() => {
    setPagination({
      currentPage: productStore.currentPage,
      totalPages: productStore.totalPages,
      totalCount: productStore.totalProducts,
    });
  }, [
    productStore.currentPage,
    productStore.totalPages,
    productStore.totalProducts,
  ]);

  const fetchProducts = useCallback(
    async (page = 0) => {
      try {
        await useProductStore.getState().fetchAllegroProducts({
          page,
          limit: itemsPerPage,
          phrase: searchQuery,
          ...(filters.condition && { condition: filters.condition }),
          ...(filters.status && { status: filters.status }),
          ...(filters.priceMin && { priceMin: filters.priceMin }),
          ...(filters.priceMax && { priceMax: filters.priceMax }),
          ...(filters.stockDifference && {
            stockDifference: filters.stockDifference,
          }),
          ...(sortConfig.key && {
            sortBy: sortConfig.key,
            sortDirection: sortConfig.direction === "asc" ? "ASC" : "DESC",
          }),
        });

        if (filters.stockDifference === "different") {
          const filteredProducts = products.filter((product) => {
            if (!product.matched_store_product?.store_product_id) return false;
            const allegroStock =
              product.stock || product.marketplaces?.allegro?.stock || 0;
            const storeProduct =
              matchedProducts[product.matched_store_product.store_product_id];
            if (!storeProduct) return false;
            const storeStock = storeProduct.stock || 0;
            return allegroStock !== storeStock;
          });

          setPagination({
            currentPage: page,
            totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
            totalCount: filteredProducts.length,
          });
        }
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać produktów",
          variant: "destructive",
        });
      }
    },
    [itemsPerPage, filters, sortConfig, searchQuery, matchedProducts, products]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("auth") === "success") {
      useAllegroAuthStore.getState().setAuthenticated(true);
      router.replace("/admin/marketplaces/allegro");
    }

    // TU dodamy przeładowanie po inicjalizacji
    const loadInitialData = async () => {
      try {
        await productStore.fetchAllegroProducts({
          page: 0,
          limit: itemsPerPage,
          phrase: "",
          sortBy: "createdAt",
          sortDirection: "DESC",
          status: "active",
        });
      } catch (error) {
        console.error("Błąd:", error);
      }
    };

    loadInitialData();
  }, [itemsPerPage]);

  useEffect(() => {
    setPagination({
      currentPage: productStore.currentPage,
      totalPages: productStore.totalPages,
      totalCount: productStore.totalProducts,
    });
  }, [
    productStore.currentPage,
    productStore.totalPages,
    productStore.totalProducts,
  ]);

  const getProductId = (product: IProduct): string => {
    return product.id || "";
  };

  const handleImport = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setCustomSlug(
        product.name
          .toLowerCase()
          .replace(/[,\.]/g, "-")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );
      setCustomPrice(product.marketplaces?.allegro?.price?.toString() || "");
      setCustomWeight(product.marketplaces?.allegro?.waga || "");
    }
    setProductToImport(productId);
    setImportModalOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!productToImport || !selectedCategory) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${baseUrl}/api/allegroProducts/import/${productToImport}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory,
          customSlug,
          customPrice: parseFloat(customPrice),
          customWeight: parseFloat(customWeight),
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Błąd importu: ${responseText}`);
      }

      toast({
        title: "Sukces",
        description: "Produkt został zaimportowany do sklepu",
      });

      setImportModalOpen(false);
      setSelectedCategory("");
      setProductToImport(null);
      fetchProducts(pagination.currentPage);
    } catch (error) {
      console.error("Błąd w handleConfirmImport:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaimportować produktu",
        variant: "destructive",
      });
    }
  };

  const handleBatchImport = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => handleImport(id)));
      toast({
        title: "Sukces",
        description: `Zaimportowano ${selectedProducts.length} produktów do sklepu`,
      });
      setSelectedProducts([]);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas masowego importu",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Sprawdzamy, czy kliknięcie nie było w przyciski akcji
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("input")
    ) {
      return;
    }
  };

  const handleEdit = (productId: string | undefined) => {
    if (!productId) return;
    setEditingId(productId);
  };

  const handleSave = async (product: IProduct) => {
    if (!product._id) return;
    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!response.ok) throw new Error("Błąd aktualizacji");

      toast({
        title: "Sukces",
        description: "Produkt został zaktualizowany",
      });

      setEditingId(null);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować produktu",
        variant: "destructive",
      });
    }
  };

  const handleAllegroPublish = async (productId: string | undefined) => {
    if (!productId) return;
    try {
      const response = await fetch(`/api/products/${productId}/allegro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Błąd publikacji");

      toast({
        title: "Sukces",
        description: "Produkt został opublikowany na Allegro",
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się opublikować na Allegro",
        variant: "destructive",
      });
    }
  };

  const handleBatchPublish = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => handleAllegroPublish(id)));
      setSelectedProducts([]);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas masowej publikacji",
        variant: "destructive",
      });
    }
  };

  const handleSort = (key: keyof IProduct) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";

    setSortConfig({
      key,
      direction: newDirection,
    });

    fetchProducts(pagination.currentPage);
  };

  if (loading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Zarządzanie Allegro</h1>

        {isAuthenticated && (
          <button
            onClick={handleBatchPublish}
            disabled={selectedProducts.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Opublikuj wybrane ({selectedProducts.length})
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts(0); // To wywola zapytanie do backendu z aktualnym searchQuery
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Filtruj po nazwie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded min-w-[300px]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Szukaj
          </button>
        </form>
        <select
          value={filters.stockDifference}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              stockDifference: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Wszystkie stany</option>
          <option value="different">Tylko różnice</option>
        </select>

        {/*<select
          value={filters.storeStatus || ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              storeStatus: e.target.value,
            }))
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Wszystkie statusy</option>
          <option value="inStore">Obecne w sklepie</option>
          <option value="notInStore">Brak w sklepie</option>
        </select>*/}

        {/*<select
          value={filters.condition}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              condition: e.target.value,
            }))
          }
          className="px-4 py-2 border rounded-lg "
        >
          <option value="">Wszystkie stany</option>
          <option value="nowy">Nowy</option>
          <option value="uzywany">Używany</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => {
            setFilters((prev) => ({
              ...prev,
              status: e.target.value,
            }));
            // Dodajemy to wywołanie, aby pobrać dane z nowymi filtrami
            setTimeout(() => fetchProducts(0), 0);
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="inactive">Nieaktywne</option>
        </select>*/}

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            fetchProducts(0); // Reset do pierwszej strony po zmianie
          }}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="20">20 na stronę</option>
          <option value="50">50 na stronę</option>
          <option value="100">100 na stronę</option>
          <option value="200">200 na stronę</option>
          <option value="500">500 na stronę</option>
          <option value="1000">1000 na stronę</option>
        </select>

        {/*<button
          onClick={handleBatchImport}
          disabled={selectedProducts.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Import to shop ({selectedProducts.length})
        </button>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Filtry
        </button>*/}
        <button
          onClick={handleCompare}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          disabled={isComparingProducts}
        >
          {isComparingProducts ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Porównywanie...
            </>
          ) : (
            <>
              <ArrowUpDown className="w-4 h-4" />
              Compare vs shop
            </>
          )}
        </button>
        <button
          onClick={handleImportAll}
          disabled={isImporting}
          className={`px-4 py-2 ${
            isImporting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white rounded-lg flex items-center gap-2 transition-all`}
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Importowanie...</span>
              {importProgress && (
                <span className="text-xs">
                  ({importProgress.current}/{importProgress.total})
                </span>
              )}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Importuj z Allegro
            </>
          )}
        </button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(
                        products
                          .filter((p) => getProductId(p))
                          .map((p) => getProductId(p))
                      );
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  checked={
                    selectedIds.length ===
                    products.filter((p) => getProductId(p)).length
                  }
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("manufacturer")}
                  className="flex items-center text-gray-200"
                >
                  Nazwa
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-gray-200">
                Status w sklepie
              </th>
              <th className="px-4 py-3 text-left text-gray-200">
                Liczba sztuk
              </th>
              <th className="px-4 py-3 text-left text-gray-200">
                Główne zdjęcie
              </th>
              <th className="px-4 py-3 text-left text-gray-200">Galeria</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("power")}
                  className="flex items-center text-gray-200"
                >
                  Moc
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("rpm")}
                  className="flex items-center text-gray-200"
                >
                  Obroty
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-gray-200">Stan</th>
              <th className="px-4 py-3 text-left text-gray-200">
                Cena Allegro
              </th>
              <th className="px-4 py-3 text-left text-gray-200">Status</th>

              <th className="px-4 py-3 text-left text-gray-200">Wielkość</th>
              <th className="px-4 py-3 text-left text-gray-200">Waga</th>
              <th className="px-4 py-3 text-left text-gray-200">Napięcie</th>
              <th className="px-4 py-3 text-left text-gray-200">
                Średnica wału
              </th>
              <th className="px-4 py-3 text-left text-gray-200">
                Średnica tulei
              </th>
              <th className="px-4 py-3 text-left text-gray-200">Rozruch</th>

              <th className="px-4 py-3 text-left text-gray-200">ID kat.</th>
              <th className="px-4 py-3 text-left text-gray-200">Producent</th>
              <th className="px-4 py-3 text-left text-gray-200">Model</th>
              <th className="px-4 py-3 text-left text-gray-200">Kategoria</th>
              <th className="px-4 py-3 text-left text-gray-200">Opis</th>
              <th className="px-4 py-3 text-left text-gray-200">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const allegroData = product.marketplaces.allegro;
              const storeProduct = product.matched_store_product
                ?.store_product_id
                ? (matchedProducts[
                    product.matched_store_product.store_product_id
                  ] as IProduct)
                : null;

              const allegroStock =
                product.stock || product.marketplaces?.allegro?.stock || 0;
              const storeStock = storeProduct?.stock || 0;
              const difference = allegroStock - storeStock;

              const opisProduktu = parseAllegroDescription(
                product.marketplaces.allegro?.description
              );

              const existsInStore = product.matched_store_product !== null;

              if (filters.stockDifference === "different") {
                if (!product.matched_store_product || difference === 0) {
                  return null;
                }
              }

              // Sprawdzamy czy produkt powinien być wyświetlony zgodnie z filtrem storeStatus
              if (filters.storeStatus === "inStore" && !existsInStore)
                return null;
              if (filters.storeStatus === "notInStore" && existsInStore)
                return null;

              return (
                <tr
                  key={product.id}
                  onClick={(e) => handleRowClick(e)}
                  className="hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(getProductId(product))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Sprawdzamy czy product.id istnieje przed dodaniem
                          if (product.id) {
                            setSelectedIds([...selectedIds, product.id]);
                          }
                        } else {
                          // Filtrujemy tylko gdy id istnieje
                          setSelectedIds(
                            selectedIds.filter(
                              (id) => id !== (product.id || "")
                            )
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {editingId === product._id ? (
                      <input type="text" value={product.name} readOnly />
                    ) : (
                      product.name // zmiana z manufacturer na name
                    )}
                  </td>
                  {(() => {
                    if (!product.matched_store_product) {
                      return (
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
                          <X className="w-4 h-4 mr-1" />
                          Brak w sklepie
                        </div>
                      );
                    }

                    const storeProduct = product.matched_store_product
                      ?.store_product_id
                      ? matchedProducts[
                          product.matched_store_product.store_product_id
                        ]
                      : null;

                    const categorySlug =
                      storeProduct?.categories?.[0]?.slug ||
                      storeProduct?.marketplaces?.ownStore?.category_path?.replace(
                        "/",
                        ""
                      ) ||
                      "";
                    const productSlug =
                      storeProduct?.marketplaces?.ownStore?.slug;
                    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${categorySlug}/${productSlug}`;

                    return (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="flex flex-col gap-2">
                          {product.matched_store_product && (
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-2 py-1 rounded-full text-sm flex items-center justify-center hover:bg-green-600"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Link do sklepu
                            </a>
                          )}
                          {product.marketplaces?.allegro?.url && (
                            <a
                              href={product.marketplaces.allegro.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-orange-500 text-white px-2 py-1 rounded-full text-sm flex items-center justify-center hover:bg-orange-600"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Link do Allegro
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <td className="px-4 py-3">
                    {(() => {
                      const allegroStock =
                        product.stock ||
                        product.marketplaces?.allegro?.stock ||
                        0;

                      // Debug

                      const storeProduct = product.matched_store_product
                        ?.store_product_id
                        ? matchedProducts[
                            product.matched_store_product.store_product_id
                          ]
                        : null;

                      const storeStock = storeProduct?.stock ?? 0;

                      if (
                        product.id &&
                        editingStockStates[product.id]?.isEditing
                      ) {
                        return (
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={
                                product.id
                                  ? editingStockStates[product.id]?.stock ||
                                    allegroStock
                                  : allegroStock
                              }
                              onChange={(e) => {
                                if (product.id) {
                                  updateEditingStock(
                                    product.id,
                                    parseInt(e.target.value)
                                  );
                                }
                              }}
                              className="px-2 py-1 border rounded w-24 mr-2"
                              step="1"
                              min="0"
                            />
                            <button
                              onClick={() => {
                                const productId = product.id;
                                if (productId) {
                                  const newStock =
                                    editingStockStates[productId]?.stock;
                                  if (
                                    newStock !== null &&
                                    newStock !== undefined
                                  ) {
                                    handleSaveStock(productId, newStock);
                                  }
                                }
                              }}
                              className="p-1 hover:bg-green-100 rounded"
                            >
                              <Save className="w-4 h-4 text-green-600" />
                            </button>
                          </div>
                        );
                      } else {
                        // Istniejący kod dla wyświetlania stanu
                        if (!product.matched_store_product) {
                          return (
                            <div className="flex items-center">
                              <span className="mr-2">{allegroStock} szt.</span>
                              <button
                                onClick={() => {
                                  if (product.id) {
                                    startEditingStock(product.id, allegroStock);
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }

                        const difference = storeStock - allegroStock;

                        if (difference === 0) {
                          return (
                            <div className="flex items-center">
                              <Check className="text-green-500 w-4 h-4 mr-1" />
                              <span className="mr-2">{allegroStock} szt.</span>
                              <button
                                onClick={() => {
                                  if (product.id) {
                                    startEditingStock(product.id, allegroStock);
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center">
                            <span className="text-red-500 mr-2">
                              {allegroStock} szt. (W sklepie {storeStock} szt.)
                            </span>
                            <button
                              onClick={() => {
                                if (product.id) {
                                  startEditingStock(product.id, allegroStock);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-4 py-3 relative">
                    {(() => {
                      if (!product.matched_store_product?.store_product_id)
                        return null;
                      const storeProduct =
                        matchedProducts[
                          product.matched_store_product.store_product_id
                        ];
                      if (!storeProduct?.mainImage) return null;

                      return (
                        <img
                          src={storeProduct.mainImage}
                          alt="Główne zdjęcie"
                          className="w-20 h-20 object-contain rounded-lg border cursor-pointer"
                          onClick={() =>
                            window.open(storeProduct.mainImage, "_blank")
                          }
                          loading="lazy"
                        />
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 relative">
                    {(() => {
                      if (!product.matched_store_product?.store_product_id)
                        return null;
                      const storeProduct =
                        matchedProducts[
                          product.matched_store_product.store_product_id
                        ];
                      if (!storeProduct?.galleryImages?.length) return null;

                      return (
                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {storeProduct.galleryImages.map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`Zdjęcie ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border cursor-pointer"
                              onClick={() => window.open(img, "_blank")}
                              loading="lazy"
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const categoryId =
                        product.marketplaces.allegro?.category?.id;
                      const mocId =
                        categoryId === "121452" ? "11726" : "219137";
                      return `${
                        product.marketplaces.allegro?.parameters?.find(
                          (p) => p.id === mocId
                        )?.values[0] || "-"
                      } kW`;
                    })()}
                  </td>
                  {/* Obroty */}
                  <td className="px-4 py-3">
                    {(() => {
                      const categoryId =
                        product.marketplaces.allegro?.category?.id;
                      const obrotyId =
                        categoryId === "121452" ? "221421" : "219153";
                      return `${
                        product.marketplaces.allegro?.parameters?.find(
                          (p) => p.id === obrotyId
                        )?.values[0] || "-"
                      } obr/min`;
                    })()}
                  </td>
                  <td className="px-4 py-3">{product.condition}</td>
                  <td className="px-4 py-3">
                    {product.id && editingStates[product.id]?.isEditing ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={
                            product.id
                              ? editingStates[product.id]?.price ||
                                allegroData?.price ||
                                0
                              : allegroData?.price || 0
                          }
                          onChange={(e) => {
                            if (product.id) {
                              updateEditingPrice(
                                product.id,
                                parseFloat(e.target.value)
                              );
                            }
                          }}
                          className="px-2 py-1 border rounded w-24 mr-2"
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => {
                            const productId = product.id;
                            if (productId) {
                              // Dodajemy sprawdzenie
                              const newPrice = editingStates[productId]?.price;
                              if (newPrice !== null && newPrice !== undefined) {
                                handleSavePrice(productId, newPrice);
                                stopEditing(productId);
                              }
                            }
                          }}
                          className="p-1 hover:bg-green-100 rounded"
                        >
                          <Save className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">
                          {allegroData?.price || "-"} PLN
                        </span>
                        <button
                          onClick={() => {
                            if (product.id) {
                              // Dodajemy sprawdzenie
                              startEditing(product.id, allegroData?.price || 0);
                            }
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {allegroData?.active ? (
                      <Check className="text-green-500 w-5 h-5" />
                    ) : (
                      <X className="text-red-500 w-5 h-5" />
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {opisProduktu?.wielkoscMechaniczna || "-"}
                  </td>
                  {/* Waga */}
                  <td className="px-4 py-3">
                    {(() => {
                      const categoryId =
                        product.marketplaces.allegro?.category?.id;
                      const wagaId =
                        categoryId === "121452" ? "214694" : "214478";
                      return `${
                        product.marketplaces.allegro?.parameters?.find(
                          (p) => p.id === wagaId
                        )?.values[0] || "-"
                      } kg`;
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {product.marketplaces.allegro?.parameters?.find(
                      (p) => p.id === "219165"
                    )?.values[0] || "-"}{" "}
                    V
                  </td>
                  <td className="px-4 py-3">
                    {opisProduktu?.srednicaWalu || "-"} mm
                  </td>
                  <td className="px-4 py-3">
                    {opisProduktu?.srednicaTulei || "-"} mm
                  </td>
                  <td className="px-4 py-3">{opisProduktu?.rozruch || "-"}</td>
                  <td className="px-4 py-3">
                    {product.marketplaces.allegro?.category?.id || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {product.marketplaces.allegro?.parameters?.find(
                      (p) => p.id === "248929"
                    )?.values[0] || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {product.marketplaces.allegro?.parameters?.find(
                      (p) => p.id === "237206"
                    )?.values[0] || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const categoryId =
                        product.marketplaces.allegro?.category?.id;
                      if (categoryId === "121452") {
                        // Dla motoreduktorów
                        const rodzajParam =
                          product.marketplaces.allegro?.parameters?.find(
                            (p) => p.id === "18654"
                          );
                        return `Motoreduktor ${rodzajParam?.values[0] || ""}`;
                      } else {
                        // Dla silników
                        const typSilnika =
                          product.marketplaces.allegro?.parameters?.find(
                            (p) => p.id === "219157"
                          )?.values[0];

                        return typSilnika?.toLowerCase() === "elektryczny"
                          ? `Silnik ${typSilnika}`
                          : typSilnika || "-";
                      }
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const content =
                        product.marketplaces.allegro?.description?.sections?.[0]
                          ?.items?.[0]?.content;
                      if (!content) return "-";
                      // Usuwamy tagi HTML
                      const text = content.replace(/<[^>]*>/g, " ");
                      // Skracamy do 100 znaków
                      return text.length > 100
                        ? text.substring(0, 100) + "..."
                        : text;
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (product.id) {
                            handleImport(product.id);
                          } else {
                          }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {editingId === product._id ? (
                        <button
                          onClick={() => product._id && handleSave(product)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => product._id && handleEdit(product._id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAuthenticated &&
                        !product.marketplaces?.allegro?.active && (
                          <button
                            onClick={() =>
                              product._id && handleAllegroPublish(product._id)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => {
            const newPage = pagination.currentPage - 1;
            if (newPage >= 0) {
              fetchProducts(newPage);
            }
          }}
          disabled={pagination.currentPage === 0 || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          Poprzednia strona
        </button>
        <span>
          Strona {pagination.currentPage + 1} z {pagination.totalPages} (łącznie{" "}
          {pagination.totalCount} ofert)
        </span>

        <button
          onClick={() => {
            const newPage = pagination.currentPage + 1;
            if (newPage < pagination.totalPages) {
              fetchProducts(newPage);
            }
          }}
          disabled={
            pagination.currentPage >= pagination.totalPages - 1 || loading
          }
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          Następna strona
        </button>
      </div>
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importuj produkt</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL w sklepie</label>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Wprowadź URL produktu..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cena (PLN)</label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Wprowadź cenę..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Waga (kg)</label>
              <input
                type="number"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Wprowadź wagę..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Anuluj
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!selectedCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Importuj
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllegroPage;

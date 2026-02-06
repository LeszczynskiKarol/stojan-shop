// frontend/src/app/szukaj/page.tsx
"use client";
import { Suspense } from "react";
import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { IProduct } from "@/types/product.types";
import { PaginationPage } from "@/components/ui/PaginationPage";
import { Loader2, Package, Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import debounce from "lodash/debounce";

interface SearchFilters {
  powerMin?: number;
  powerMax?: number;
  rpmMin?: number;
  rpmMax?: number;
  shaftDiameterMin?: number;
  shaftDiameterMax?: number;
  manufacturer?: string;
  condition?: string;
  category?: string;
  sort?: string;
}

// Komponent wewnętrzny, który używa useSearchParams
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trackEvent, getPageLocation } = useAnalytics();

  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1") - 1;

  const [products, setProducts] = useState<IProduct[]>([]);
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  // Filtry - inicjalizacja z URL
  const [filters, setFilters] = useState<SearchFilters>({
    powerMin: searchParams.get("powerMin")
      ? parseFloat(searchParams.get("powerMin")!)
      : undefined,
    powerMax: searchParams.get("powerMax")
      ? parseFloat(searchParams.get("powerMax")!)
      : undefined,
    rpmMin: searchParams.get("rpmMin")
      ? parseFloat(searchParams.get("rpmMin")!)
      : undefined,
    rpmMax: searchParams.get("rpmMax")
      ? parseFloat(searchParams.get("rpmMax")!)
      : undefined,
    shaftDiameterMin: searchParams.get("shaftMin")
      ? parseFloat(searchParams.get("shaftMin")!)
      : undefined,
    shaftDiameterMax: searchParams.get("shaftMax")
      ? parseFloat(searchParams.get("shaftMax")!)
      : undefined,
    manufacturer: searchParams.get("manufacturer") || "",
    condition: searchParams.get("condition") || "",
    category: searchParams.get("category") || "",
    sort: sortBy,
  });

  const itemsPerPage = 20;

  // Funkcja do aktualizacji URL z zachowaniem filtrów
  const updateUrl = useCallback(
    (newParams: Record<string, any>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`/szukaj?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      updateUrl({ q: searchTerm, page: "1" });
    }, 500),
    [updateUrl]
  );

  // Funkcja do pobierania wyników wyszukiwania
  const fetchSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      setAllProducts([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Pobierz wyniki z pełnym wsparciem backendowym dla filtrów
      const params = new URLSearchParams({
        q: query,
        page: (currentPage + 1).toString(),
        limit: itemsPerPage.toString(),
        sort: sortBy,
        ...(filters.powerMin !== undefined && {
          powerMin: filters.powerMin.toString(),
        }),
        ...(filters.powerMax !== undefined && {
          powerMax: filters.powerMax.toString(),
        }),
        ...(filters.rpmMin !== undefined && {
          rpmMin: filters.rpmMin.toString(),
        }),
        ...(filters.rpmMax !== undefined && {
          rpmMax: filters.rpmMax.toString(),
        }),
        ...(filters.shaftDiameterMin !== undefined && {
          shaftDiameterMin: filters.shaftDiameterMin.toString(),
        }),
        ...(filters.shaftDiameterMax !== undefined && {
          shaftDiameterMax: filters.shaftDiameterMax.toString(),
        }),
        ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.category && { category: filters.category }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?${params}`
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products || []);
        setTotalResults(data.data.total || 0);

        // Pobierz również wszystkie produkty dla generowania sugestii filtrów
        // Ale tylko jeśli nie mamy ich już
        if (allProducts.length === 0 || query !== searchQuery) {
          const allParams = new URLSearchParams({
            q: query,
            page: "1",
            limit: "10000",
            sort: sortBy,
          });

          const allResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?${allParams}`
          );

          if (allResponse.ok) {
            const allData = await allResponse.json();
            if (allData.success) {
              setAllProducts(allData.data.products || []);
            }
          }
        }

        // Śledzenie wyszukiwania
        trackEvent("search_performed", {
          location: getPageLocation(),
          query: query,
          results_count: data.data.total || 0,
          page: currentPage + 1,
          filters_applied: Object.keys(filters).filter(
            (key) => filters[key as keyof SearchFilters]
          ),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Błąd podczas wyszukiwania:", error);
      setProducts([]);
      setAllProducts([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    query,
    currentPage,
    sortBy,
    filters,
    trackEvent,
    getPageLocation,
    allProducts.length,
    searchQuery,
  ]);

  // Pobierz wyniki gdy zmienią się parametry
  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query,
    currentPage,
    sortBy,
    filters.powerMin,
    filters.powerMax,
    filters.rpmMin,
    filters.rpmMax,
    filters.manufacturer,
    filters.condition,
    filters.category,
  ]);

  // Obsługa zmiany filtrów
  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Aktualizuj URL
    const urlParams: Record<string, any> = { page: "1" };

    switch (filterType) {
      case "powerMin":
      case "powerMax":
        urlParams[filterType] = value;
        break;
      case "rpmMin":
      case "rpmMax":
        urlParams[filterType] = value;
        break;
      case "shaftDiameterMin":
      case "shaftDiameterMax":
        urlParams[filterType === "shaftDiameterMin" ? "shaftMin" : "shaftMax"] =
          value;
        break;
      case "category":
        if (value) {
          urlParams.category = value;
        } else {
          updateUrl({ category: null });
          return;
        }
        break;
      default:
        urlParams[filterType] = value;
    }

    updateUrl(urlParams);
  };

  // Obsługa sortowania
  const handleSort = (value: string) => {
    setSortBy(value);
    updateUrl({ sort: value, page: "1" });
  };

  // Obsługa paginacji
  const handlePageChange = (page: number) => {
    console.log("🔵 handlePageChange otrzymał (1-based):", page);
    updateUrl({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset filtrów
  const resetFilters = () => {
    setFilters({
      sort: "relevance",
    });
    setSortBy("relevance");
    // Zachowaj zapytanie, ale usuń wszystkie filtry
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("page", "1");
    router.push(`/szukaj?${params.toString()}`);
  };

  const hasActiveFilters = () => {
    return !!(
      filters.powerMin ||
      filters.powerMax ||
      filters.rpmMin ||
      filters.rpmMax ||
      filters.shaftDiameterMin ||
      filters.shaftDiameterMax ||
      filters.manufacturer ||
      filters.condition ||
      filters.category
    );
  };

  const totalPages = Math.ceil(totalResults / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Search Header - Sticky */}
      <div className="bg-background/95 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <SearchBar
              initialQuery={query}
              onSearch={(newQuery) => {
                setSearchQuery(newQuery);
                debouncedSearch(newQuery);
              }}
              showSuggestions={true}
              autoFocus={false}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Wyniki wyszukiwania" },
          ]}
        />

        {/* Results Header */}
        <div className="mt-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              Wyniki wyszukiwania dla: "{query}"
            </h1>
            {!isLoading && (
              <p className="text-muted-foreground">
                Znaleziono {totalResults}{" "}
                {totalResults === 1
                  ? "produkt"
                  : totalResults < 5
                  ? "produkty"
                  : "produktów"}
              </p>
            )}
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="w-full px-4 py-2 bg-card border rounded-lg flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtry
                {hasActiveFilters() && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Aktywne
                  </span>
                )}
              </span>
              <span>{isFilterVisible ? "↑" : "↓"}</span>
            </button>
          </div>

          {/* Filters Sidebar */}
          <AnimatePresence>
            {(isFilterVisible || !isMobile()) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 space-y-6"
              >
                <div className="bg-card rounded-lg p-0 shadow-sm">
                  <SearchFilters
                    onFilterChange={handleFilterChange}
                    currentFilters={filters}
                    loading={isLoading}
                    searchResults={allProducts}
                    onReset={resetFilters}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <div className="flex-1">
            {/* Sort and View Options */}
            {!isLoading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <p className="text-sm text-muted-foreground">
                  Wyświetlanie {currentPage * itemsPerPage + 1}-
                  {Math.min((currentPage + 1) * itemsPerPage, totalResults)} z{" "}
                  {totalResults}
                </p>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Sortuj:</label>
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="relevance">Trafność</option>
                    <option value="price_asc">Cena: rosnąco</option>
                    <option value="price_desc">Cena: malejąco</option>
                    <option value="power_asc">Moc: rosnąco</option>
                    <option value="power_desc">Moc: malejąco</option>
                    <option value="newest">Najnowsze</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  Wyszukiwanie produktów...
                </p>
              </div>
            )}

            {/* No Query State */}
            {!isLoading && !query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20"
              >
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Rozpocznij wyszukiwanie
                </h2>
                <p className="text-muted-foreground">
                  Wpisz frazę w wyszukiwarce powyżej, aby znaleźć produkty
                </p>
              </motion.div>
            )}

            {/* No Results */}
            {!isLoading && query && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20"
              >
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Brak wyników</h2>
                <p className="text-muted-foreground mb-6">
                  Nie znaleźliśmy produktów pasujących do zapytania "{query}"
                  {hasActiveFilters() && " z wybranymi filtrami"}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Spróbuj:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto text-left">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Sprawdzić pisownię wyszukiwanej frazy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Użyć innych słów kluczowych (np. "5.5 kW" zamiast
                        "5,5kW")
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Zmienić lub usunąć filtry wyszukiwania</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Wyszukać po mocy silnika (np. "3 kW")</span>
                    </li>
                  </ul>
                </div>
                {hasActiveFilters() && (
                  <button
                    onClick={resetFilters}
                    className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Wyczyść filtry i spróbuj ponownie
                  </button>
                )}
              </motion.div>
            )}

            {/* Results Grid */}
            {!isLoading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <ProductGrid products={products} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <PaginationPage
                      currentPage={currentPage}
                      totalPages={totalPages}
                      categorySlug="szukaj"
                    />

                    {/* Pagination Summary */}
                    <div className="text-sm text-muted-foreground text-center mt-4">
                      Strona {currentPage + 1} z {totalPages}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
}

// Komponent Fallback podczas ładowania
function SearchResultsFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="bg-background/95 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-8" />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4">
                  <div className="h-48 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Główny komponent strony z Suspense
export default function SearchResultsPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Suspense fallback={<SearchResultsFallback />}>
        <SearchResultsContent />
      </Suspense>
    </>
  );
}

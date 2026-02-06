// frontend/src/hooks/useSearch.ts
import { useState, useEffect, useCallback } from "react";
import { IProduct } from "@/types/product.types";
import debounce from "lodash/debounce";

interface SearchState {
  query: string;
  results: IProduct[];
  suggestions: any[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
}

export const useSearch = (initialQuery: string = "") => {
  const [state, setState] = useState<SearchState>({
    query: initialQuery,
    results: [],
    suggestions: [],
    isLoading: false,
    error: null,
    totalResults: 0,
  });

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState((prev) => ({ ...prev, results: [], totalResults: 0 }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/products/search?search=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        results: data.data.products || [],
        totalResults: data.data.total || 0,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Wystąpił błąd podczas wyszukiwania",
        isLoading: false,
      }));
    }
  }, []);

  const getSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setState((prev) => ({ ...prev, suggestions: [] }));
        return;
      }

      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/products/search/suggestions?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) return;

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          suggestions: data.data.suggestions || [],
        }));
      } catch (error) {
        console.error("Failed to get suggestions:", error);
      }
    }, 200),
    []
  );

  const setQuery = useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, query }));
      getSuggestions(query);
    },
    [getSuggestions]
  );

  const clearSearch = useCallback(() => {
    setState({
      query: "",
      results: [],
      suggestions: [],
      isLoading: false,
      error: null,
      totalResults: 0,
    });
  }, []);

  return {
    ...state,
    setQuery,
    searchProducts,
    clearSearch,
  };
};

// frontend/src/utils/searchHelpers.ts
export const parseSearchQuery = (query: string) => {
  const cleanQuery = query.trim().toLowerCase();

  // Wykryj typ zapytania
  const patterns = {
    power: /(\d+(?:[,.]\d+)?)\s*(?:kw|kilowat)/i,
    voltage: /(\d+)\s*v(?:olt)?/i,
    rpm: /(\d+)\s*(?:obr|rpm)/i,
    manufacturer: /^(sew|siemens|abb|engel|nord|lenze|bauer)/i,
  };

  const result: any = {
    type: "general",
    originalQuery: query,
    cleanQuery,
    filters: {},
  };

  // Sprawdź każdy wzorzec
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = cleanQuery.match(pattern);
    if (match) {
      result.type = key;
      result.filters[key] = match[1];
    }
  }

  return result;
};

export const formatPowerValue = (value: string | number): string => {
  const numValue =
    typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

  if (isNaN(numValue)) return "0 kW";

  // Formatuj do jednego miejsca po przecinku
  return `${numValue.toFixed(1).replace(".", ",")} kW`;
};

export const getSearchPlaceholder = (): string => {
  const placeholders = [
    "Szukaj po mocy (np. 5.5 kW)",
    "Wpisz nazwę producenta...",
    "Znajdź silnik trójfazowy...",
    "Szukaj motoreduktora...",
    "Wpisz moc silnika...",
  ];

  return placeholders[Math.floor(Math.random() * placeholders.length)];
};

// frontend/src/lib/searchAnalytics.ts
export class SearchAnalytics {
  private static instance: SearchAnalytics;
  private searchHistory: string[] = [];

  private constructor() {
    this.loadHistory();
  }

  static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  private loadHistory() {
    try {
      const stored = localStorage.getItem("searchHistory");
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }

  trackSearch(query: string) {
    // Dodaj do historii
    this.searchHistory = [
      query,
      ...this.searchHistory.filter((q) => q !== query),
    ].slice(0, 20);

    // Zapisz do localStorage
    try {
      localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }

    // Wyślij do analytics (jeśli używasz Google Analytics, Plausible, etc.)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "search", {
        search_term: query,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getPopularSearches(): string[] {
    // Zlicz częstotliwość wyszukiwań
    const frequency = this.searchHistory.reduce((acc, query) => {
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sortuj po częstotliwości i zwróć top 5
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query]) => query);
  }

  getRecentSearches(limit: number = 5): string[] {
    return this.searchHistory.slice(0, limit);
  }

  clearHistory() {
    this.searchHistory = [];
    localStorage.removeItem("searchHistory");
  }
}

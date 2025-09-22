// frontend/src/components/search/SearchBar.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, TrendingUp, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";
import { useAnalytics } from "@/hooks/useAnalytics";
import Image from "next/image";

interface SearchSuggestion {
  id: string;
  name: string;
  manufacturer?: string;
  power?: string;
  price?: number;
  image?: string;
  category?: {
    slug: string;
    name: string;
  };
  slug?: string;
}

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar = ({
  initialQuery = "",
  onSearch,
  showSuggestions = true,
  autoFocus = false,
  className = "",
}: SearchBarProps) => {
  const router = useRouter();
  const { trackEvent, getPageLocation } = useAnalytics();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState([
    "5.5 kW",
    "3 kW",
    "7.5 kW",
    "SEW",
    "Siemens",
  ]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Załaduj ostatnie wyszukiwania z localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Zamknij dropdown gdy klikniemy poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/products/search/suggestions?q=${encodeURIComponent(
            searchQuery
          )}`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data.suggestions || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Obsługa zmiany tekstu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (onSearch) {
      onSearch(value);
    }

    if (showSuggestions && value.trim()) {
      setIsOpen(true);
      fetchSuggestions(value);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  // Obsługa wysłania formularza
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim()) return;

    // Zapisz do ostatnich wyszukiwań
    const newRecentSearches = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);

    setRecentSearches(newRecentSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));

    // Śledź event
    trackEvent("search_submitted", {
      location: getPageLocation(),
      query: query,
      method: "enter_key",
      timestamp: new Date().toISOString(),
    });

    // Zamknij sugestie
    setIsOpen(false);

    // Przekieruj na stronę wyników
    router.push(`/szukaj?q=${encodeURIComponent(query)}`);
  };

  // Obsługa kliknięcia w sugestię produktu
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Śledź event
    trackEvent("search_suggestion_clicked", {
      location: getPageLocation(),
      query: query,
      suggestion_id: suggestion.id,
      suggestion_name: suggestion.name,
      timestamp: new Date().toISOString(),
    });

    setIsOpen(false);

    // Przekieruj do produktu
    if (suggestion.category?.slug && suggestion.slug) {
      router.push(`/${suggestion.category.slug}/${suggestion.slug}`);
    }
  };

  // Obsługa kliknięcia w ostatnie/popularne wyszukiwanie
  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setIsOpen(false);

    trackEvent("quick_search_clicked", {
      location: getPageLocation(),
      query: searchTerm,
      timestamp: new Date().toISOString(),
    });

    router.push(`/szukaj?q=${encodeURIComponent(searchTerm)}`);
  };

  // Wyczyść wyszukiwanie
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();

    if (onSearch) {
      onSearch("");
    }
  };

  // Formatowanie mocy
  const formatPower = (power?: string) => {
    if (!power || power === "0") return null;
    return power.includes("kW") ? power : `${power} kW`;
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Szukaj produktów (np. 5.5 kW, SEW, silnik trójfazowy)..."
            autoFocus={autoFocus}
            className="w-full pl-12 pr-12 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />

          {/* Ikona wyszukiwania */}
          <button
            type="submit"
            className="absolute left-0 top-0 h-full px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Przycisk czyszczenia */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown z sugestiami */}
      <AnimatePresence>
        {isOpen && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 bg-background border rounded-xl shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          >
            {/* Ładowanie */}
            {isLoading && (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Szukanie...
                </span>
              </div>
            )}

            {/* Sugestie produktów */}
            {!isLoading && suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                  Produkty
                </div>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3 text-left"
                  >
                    {/* Miniaturka */}
                    {suggestion.image && (
                      <div className="w-12 h-12 relative flex-shrink-0">
                        <Image
                          src={suggestion.image}
                          alt={suggestion.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Informacje o produkcie */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {suggestion.manufacturer && (
                          <span>{suggestion.manufacturer}</span>
                        )}
                        {formatPower(suggestion.power) && (
                          <>
                            <span>•</span>
                            <span>{formatPower(suggestion.power)}</span>
                          </>
                        )}
                        {suggestion.price && (
                          <>
                            <span>•</span>
                            <span>
                              {suggestion.price.toLocaleString("pl-PL", {
                                style: "currency",
                                currency: "PLN",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Strzałka */}
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.button>
                ))}

                {/* Link do wszystkich wyników */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: suggestions.length * 0.02 }}
                  onClick={handleSubmit}
                  className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-primary"
                >
                  Zobacz wszystkie wyniki dla "{query}"
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </motion.button>
              </div>
            )}

            {/* Brak wyników */}
            {!isLoading && query.length >= 2 && suggestions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Nie znaleziono produktów dla "{query}"
                </p>
                <button
                  onClick={handleSubmit}
                  className="text-sm text-primary hover:underline"
                >
                  Pokaż wszystkie wyniki →
                </button>
              </div>
            )}

            {/* Ostatnie i popularne wyszukiwania (gdy nie ma query) */}
            {!query &&
              (recentSearches.length > 0 || popularSearches.length > 0) && (
                <div className="py-2">
                  {/* Ostatnie wyszukiwania */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Ostatnie wyszukiwania
                      </div>
                      {recentSearches.map((term, index) => (
                        <motion.button
                          key={term}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => handleQuickSearch(term)}
                          className="w-full px-4 py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-left text-sm"
                        >
                          <Search className="h-4 w-4 text-muted-foreground" />
                          {term}
                        </motion.button>
                      ))}
                    </>
                  )}

                  {/* Popularne wyszukiwania */}
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase flex items-center gap-2 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    Popularne wyszukiwania
                  </div>
                  {popularSearches.map((term, index) => (
                    <motion.button
                      key={term}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: (index + recentSearches.length) * 0.02,
                      }}
                      onClick={() => handleQuickSearch(term)}
                      className="w-full px-4 py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-left text-sm"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {term}
                    </motion.button>
                  ))}
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// frontend/src/components/search/ProductSearch.tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Clock, Zap, Package2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface QuickSearchSuggestion {
  icon: React.ReactNode;
  label: string;
  query: string;
  description?: string;
}

export const ProductSearch = () => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Popularne wyszukiwania
  const quickSearches: QuickSearchSuggestion[] = [
    {
      icon: <Zap className="h-4 w-4" />,
      label: "5.5 kW",
      query: "5.5 kW",
      description: "Najpopularniejsza moc",
    },
    {
      icon: <Package2 className="h-4 w-4" />,
      label: "Silniki trójfazowe",
      query: "trójfazowy",
      description: "Szeroki wybór",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "SEW",
      query: "SEW",
      description: "Premium producent",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "7.5 kW",
      query: "7.5 kW",
      description: "Często wybierane",
    },
  ];

  // Ostatnie wyszukiwania z localStorage
  const getRecentSearches = (): string[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("recentSearches");
    return stored ? JSON.parse(stored).slice(0, 3) : [];
  };

  const [recentSearches] = useState(getRecentSearches());

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      // Śledź event
      trackEvent("home_search_submitted", {
        location: "home_page",
        query: query,
        timestamp: new Date().toISOString(),
      });

      // Przekieruj na stronę wyników
      router.push(`/szukaj?q=${encodeURIComponent(query)}`);
    },
    [router, trackEvent]
  );

  const handleQuickSearch = (query: string, type: string) => {
    // Śledź event
    trackEvent("home_quick_search_clicked", {
      location: "home_page",
      query: query,
      type: type,
      timestamp: new Date().toISOString(),
    });

    router.push(`/szukaj?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Główna wyszukiwarka */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <div
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        >
          <SearchBar
            showSuggestions={true}
            autoFocus={false}
            className="shadow-lg"
          />
        </div>

        {/* Efekt świecenia przy focus */}
        <AnimatePresence>
          {isSearchFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sugestie wyszukiwania */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-8"
      ></motion.div>
    </div>
  );
};

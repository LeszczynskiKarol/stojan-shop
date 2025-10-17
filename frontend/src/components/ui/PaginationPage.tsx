// frontend/src/components/ui/PaginationPage.tsx
import { Button } from "@/components/ui/Button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useShopStore } from "@/store/shopStore";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationPageProps {
  currentPage: number;
  totalPages: number;
  categorySlug: string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const PaginationPage: React.FC<PaginationPageProps> = ({
  currentPage,
  totalPages,
  categorySlug,
  onPageChange,
  className = "",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent, getPageLocation } = useAnalytics();

  // currentPage jest 0-based, ale dla wyświetlania używamy 1-based
  const displayPage = currentPage + 1;

  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];

    // Używamy displayPage do obliczeń zakresu
    for (
      let i = Math.max(2, displayPage - delta);
      i <= Math.min(totalPages - 1, displayPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (displayPage - delta > 2) {
      range.unshift("...");
    }
    if (displayPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    trackEvent("pagination_change", {
      location: getPageLocation(),
      previous_page: displayPage,
      new_page: page,
      total_pages: totalPages,
      category_slug: categorySlug,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    // Pobieramy aktywne filtry ze store
    const activeFilters = useShopStore.getState().activeFilters;

    // Dodajemy aktywne filtry do URL
    if (activeFilters.power[0] !== 0 || activeFilters.power[1] !== 0) {
      params.set("powerMin", activeFilters.power[0].toString());
      params.set("powerMax", activeFilters.power[1].toString());
    }

    if (activeFilters.rpm[0] !== 0 || activeFilters.rpm[1] !== 0) {
      params.set("rpmMin", activeFilters.rpm[0].toString());
      params.set("rpmMax", activeFilters.rpm[1].toString());
    }

    if (
      activeFilters.shaftDiameter[0] !== 0 ||
      activeFilters.shaftDiameter[1] !== 0
    ) {
      params.set("shaftMin", activeFilters.shaftDiameter[0].toString());
      params.set("shaftMax", activeFilters.shaftDiameter[1].toString());
    }

    if (activeFilters.condition) {
      params.set("condition", activeFilters.condition);
    }

    if (activeFilters.manufacturer) {
      params.set("manufacturer", activeFilters.manufacturer);
    }

    const finalUrl = `/${categorySlug}?${params.toString()}`;
    router.push(finalUrl);

    // Jeśli jest callback, wywołaj go dodatkowo
    if (onPageChange) {
      onPageChange(page - 1); // Konwertuj na 0-based dla callbacka
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Nawigacja po stronach"
      className={`flex items-center justify-center space-x-2 ${className}`}
    >
      {/* Przyciski nawigacyjne */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={displayPage === 1}
        aria-label="Pierwsza strona"
        className="hidden sm:flex"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(displayPage - 1)}
        disabled={displayPage === 1}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Numery stron */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((pageNumber, index) =>
          pageNumber === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          ) : (
            <Button
              key={`page-${pageNumber}`}
              variant={displayPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() =>
                typeof pageNumber === "number" && handlePageChange(pageNumber)
              }
              aria-label={`Strona ${pageNumber}`}
              aria-current={displayPage === pageNumber ? "page" : undefined}
              className="min-w-[2.5rem]"
            >
              {pageNumber}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(displayPage + 1)}
        disabled={displayPage === totalPages}
        aria-label="Następna strona"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(totalPages)}
        disabled={displayPage === totalPages}
        aria-label="Ostatnia strona"
        className="hidden sm:flex"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

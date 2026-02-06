// frontend/src/app/(admin)/admin/price-manager/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface PreviewProduct {
  id: string;
  name: string;
  power: { value: string };
  condition: string;
  price: number;
  marketplaces?: {
    ownStore?: {
      price: number;
    };
  };
}

// Lista dozwolonych kategorii
const ALLOWED_CATEGORIES = [
  "jednofazowe",
  "trojfazowe",
  "motoreduktory",
  "z-hamulcem",
  "dwubiegowe",
];

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "silniki-jednofazowe": "Silniki elektryczne jednofazowe",
  "silniki-trojfazowe": "Silniki elektryczne trójfazowe",
  motoreduktory: "Motoreduktory",
  "z-hamulcem": "Silniki z hamulcem",
  dwubiegowe: "Silniki dwubiegowe",
};

export default function PriceManagerPage() {
  const { toast } = useToast();
  const { categories, fetchCategories } = useCategoryStore();
  const { fetchProducts } = useProductStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [affectedProducts, setAffectedProducts] = useState<PreviewProduct[]>(
    []
  );
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [filters, setFilters] = useState({
    powerMin: "",
    powerMax: "",
    condition: "all",
  });

  const [priceChange, setPriceChange] = useState({
    type: "percentage" as "percentage" | "fixed",
    value: "",
  });

  // Filtruj tylko dozwolone kategorie
  const allowedCategories = categories.filter((cat) =>
    ALLOWED_CATEGORIES.includes(cat.slug)
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  // Obsługa zaznaczania wszystkich kategorii
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCategories(allowedCategories.map((cat) => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  // Obsługa zmiany pojedynczej kategorii
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
    }
    setSelectAll(false);
  };

  const roundToMarketingPrice = (price: number): number => {
    const rounded = Math.round(price);
    const lastDigit = rounded % 10;
    let adjustedPrice: number;

    if (lastDigit <= 2) {
      adjustedPrice = Math.floor(rounded / 10) * 10 - 5;
      if (adjustedPrice < 0) adjustedPrice = 5;
    } else if (lastDigit <= 5) {
      adjustedPrice = Math.floor(rounded / 10) * 10 + 5;
    } else if (lastDigit <= 8) {
      adjustedPrice = Math.floor(rounded / 10) * 10 + 9;
    } else {
      adjustedPrice = rounded;
    }

    return adjustedPrice;
  };

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);

      // Dla każdej wybranej kategorii pobierz produkty
      const allProducts: any[] = [];

      if (selectedCategories.length === 0) {
        // Jeśli nie wybrano kategorii, pobierz wszystkie
        const response = await api.post("/products/bulk-price-preview", {
          filters: {
            categoryId: undefined,
            powerMin: filters.powerMin
              ? parseFloat(filters.powerMin)
              : undefined,
            powerMax: filters.powerMax
              ? parseFloat(filters.powerMax)
              : undefined,
            condition:
              filters.condition === "all" ? undefined : filters.condition,
          },
          priceChange: {
            type: priceChange.type,
            percentage:
              priceChange.type === "percentage"
                ? parseFloat(priceChange.value)
                : undefined,
            amount:
              priceChange.type === "fixed"
                ? parseFloat(priceChange.value)
                : undefined,
          },
        });
        allProducts.push(...response.data.data.products);
      } else {
        // Pobierz produkty dla każdej wybranej kategorii
        for (const categoryId of selectedCategories) {
          const response = await api.post("/products/bulk-price-preview", {
            filters: {
              categoryId,
              powerMin: filters.powerMin
                ? parseFloat(filters.powerMin)
                : undefined,
              powerMax: filters.powerMax
                ? parseFloat(filters.powerMax)
                : undefined,
              condition:
                filters.condition === "all" ? undefined : filters.condition,
            },
            priceChange: {
              type: priceChange.type,
              percentage:
                priceChange.type === "percentage"
                  ? parseFloat(priceChange.value)
                  : undefined,
              amount:
                priceChange.type === "fixed"
                  ? parseFloat(priceChange.value)
                  : undefined,
            },
          });
          allProducts.push(...response.data.data.products);
        }
      }

      // Usuń duplikaty na podstawie ID
      const uniqueProducts = Array.from(
        new Map(allProducts.map((p) => [p.id, p])).values()
      );

      setAffectedProducts(uniqueProducts);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wygenerować podglądu",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!priceChange.value) {
      toast({
        title: "Błąd",
        description: "Podaj wartość zmiany ceny",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        `Czy na pewno chcesz zmienić ceny ${affectedProducts.length} produktów?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Aktualizuj dla każdej kategorii
      if (selectedCategories.length === 0) {
        const response = await api.post("/products/bulk-price-update", {
          filters: {
            categoryId: undefined,
            powerMin: filters.powerMin
              ? parseFloat(filters.powerMin)
              : undefined,
            powerMax: filters.powerMax
              ? parseFloat(filters.powerMax)
              : undefined,
            condition:
              filters.condition === "all" ? undefined : filters.condition,
          },
          priceChange: {
            type: priceChange.type,
            percentage:
              priceChange.type === "percentage"
                ? parseFloat(priceChange.value)
                : undefined,
            amount:
              priceChange.type === "fixed"
                ? parseFloat(priceChange.value)
                : undefined,
          },
        });
      } else {
        for (const categoryId of selectedCategories) {
          await api.post("/products/bulk-price-update", {
            filters: {
              categoryId,
              powerMin: filters.powerMin
                ? parseFloat(filters.powerMin)
                : undefined,
              powerMax: filters.powerMax
                ? parseFloat(filters.powerMax)
                : undefined,
              condition:
                filters.condition === "all" ? undefined : filters.condition,
            },
            priceChange: {
              type: priceChange.type,
              percentage:
                priceChange.type === "percentage"
                  ? parseFloat(priceChange.value)
                  : undefined,
              amount:
                priceChange.type === "fixed"
                  ? parseFloat(priceChange.value)
                  : undefined,
            },
          });
        }
      }

      toast({
        title: "Sukces",
        description: `Zaktualizowano ceny ${affectedProducts.length} produktów`,
      });

      // Odśwież produkty
      await fetchProducts();

      // Zresetuj formularz
      setShowPreview(false);
      setAffectedProducts([]);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować cen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(affectedProducts.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProducts = affectedProducts.slice(startIndex, endIndex);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Masowa edycja cen</h1>
        <p className="text-muted-foreground">
          Zmień ceny wielu produktów jednocześnie na podstawie wybranych
          kryteriów
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel filtrów */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Filtry produktów</h2>

            <div className="space-y-4">
              {/* Kategorie z checkboxami */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Kategorie
                </label>

                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAllChange}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Zaznacz wszystkie
                    </label>
                  </div>

                  {allowedCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={cat.id}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(cat.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={cat.id}
                        className="text-sm cursor-pointer"
                      >
                        {CATEGORY_DISPLAY_NAMES[cat.slug] || cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moc */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Moc (kW)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Od"
                    value={filters.powerMin}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        powerMin: e.target.value,
                      }))
                    }
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="Do"
                    value={filters.powerMax}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        powerMax: e.target.value,
                      }))
                    }
                    step="0.1"
                  />
                </div>
              </div>

              {/* Stan */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Stan produktu
                </label>
                <Select
                  value={filters.condition}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, condition: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz stan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie stany</SelectItem>
                    <SelectItem value="nowy">Nowy</SelectItem>
                    <SelectItem value="uzywany">Używany</SelectItem>
                    <SelectItem value="nieuzywany">Nieużywany</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Panel zmiany ceny */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Zmiana ceny</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Typ zmiany
                </label>
                <Select
                  value={priceChange.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setPriceChange((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Procentowo (%)</SelectItem>
                    <SelectItem value="fixed">Stała kwota (PLN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Wartość zmiany
                </label>
                <Input
                  type="number"
                  placeholder={
                    priceChange.type === "percentage"
                      ? "np. 5 (dla +5%)"
                      : "np. 50 (dla +50 PLN)"
                  }
                  value={priceChange.value}
                  onChange={(e) =>
                    setPriceChange((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  step={priceChange.type === "percentage" ? "0.1" : "1"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Użyj wartości ujemnych dla obniżek cen
                </p>
              </div>

              <Button
                onClick={handlePreview}
                disabled={!priceChange.value || previewLoading}
                className="w-full"
              >
                {previewLoading
                  ? "Generowanie podglądu..."
                  : "Pokaż podgląd zmian"}
              </Button>
            </div>
          </div>
        </div>

        {/* Panel podglądu - bez zmian */}
        <div className="space-y-6">
          {showPreview && (
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Podgląd zmian ({affectedProducts.length} produktów)
                </h2>
                <div className="flex items-center gap-2">
                  {parseFloat(priceChange.value) > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {affectedProducts.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm">
                    Nie znaleziono produktów spełniających wybrane kryteria
                  </p>
                </div>
              ) : (
                <>
                  {/* Kontrolki paginacji */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Pokaż:
                      </span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value));
                          setCurrentPage(0);
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        produktów
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Pokazuję {startIndex + 1}-
                      {Math.min(endIndex, affectedProducts.length)} z{" "}
                      {affectedProducts.length}
                    </div>
                  </div>

                  {/* Lista produktów */}
                  <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                    {displayedProducts.map((product: any) => {
                      const currentPrice =
                        product.marketplaces?.ownStore?.price || product.price;
                      let newPrice: number;

                      if (priceChange.type === "percentage") {
                        newPrice =
                          currentPrice *
                          (1 + parseFloat(priceChange.value) / 100);
                      } else {
                        newPrice = currentPrice + parseFloat(priceChange.value);
                      }

                      // Dodaj tę linię:
                      newPrice = roundToMarketingPrice(newPrice);

                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-accent rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Moc: {product.power.value} | Stan:{" "}
                              {product.condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm line-through text-muted-foreground">
                              {currentPrice.toFixed(0)} PLN
                            </div>
                            <div className="font-semibold">
                              {newPrice.toFixed(0)} PLN
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Przyciski nawigacji */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(0, currentPage - 1))
                        }
                        disabled={currentPage === 0}
                      >
                        Poprzednia
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        Strona {currentPage + 1} z {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(totalPages - 1, currentPage + 1)
                          )
                        }
                        disabled={currentPage >= totalPages - 1}
                      >
                        Następna
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleApplyChanges}
                    disabled={loading}
                    className="w-full"
                    variant="default"
                  >
                    {loading
                      ? "Aktualizowanie cen..."
                      : `Zastosuj zmiany dla ${affectedProducts.length} produktów`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

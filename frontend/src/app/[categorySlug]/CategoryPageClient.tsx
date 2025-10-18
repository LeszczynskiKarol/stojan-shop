// frontend/src/app/[categorySlug]/CategoryPageClient.tsx
"use client";

import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { CategoryFilters } from "@/components/shop/CategoryFilters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PaginationPage } from "@/components/ui/PaginationPage";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ActiveFilters, Filters, useShopStore } from "@/store/shopStore";
import { ICategory } from "@/types/category.types";
import { IProduct } from "@/types/product.types";
import { Loader2 } from "lucide-react";
import Head from "next/head";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CategorySchema } from "./CategorySchema";

interface CategoryPageClientProps {
  categoryMapper: Record<string, string>;
}

const PRODUCT_TYPES = [
  { value: "trojfazowe", label: "Silniki trójfazowe" },
  { value: "jednofazowe", label: "Silniki jednofazowe" },
  { value: "z-hamulcem", label: "Silniki z hamulcem" },
  { value: "dwubiegowe", label: "Silniki dwubiegowe" },
  { value: "pierscieniowe", label: "Silniki pierścieniowe" },
  { value: "wentylatory-przemyslowe", label: "Wentylatory przemysłowe" },
  { value: "motoreduktory", label: "Motoreduktory" },
];

interface PowerPageConfig {
  power: number;
  rpmMin?: number;
  rpmMax?: number;
  rpmLabel?: string;
}

const POWER_MAPPING: Record<string, PowerPageConfig> = {
  // SAME MOCE (bez obrotów)
  "silniki-elektryczne-009-kw": { power: 0.09 },
  "silniki-elektryczne-012-kw": { power: 0.12 },
  "silniki-elektryczne-018-kw": { power: 0.18 },
  "silniki-elektryczne-025-kw": { power: 0.25 },
  "silniki-elektryczne-037-kw": { power: 0.37 },
  "silniki-elektryczne-055-kw": { power: 0.55 },
  "silniki-elektryczne-075-kw": { power: 0.75 },
  "silniki-elektryczne-1-1-kw": { power: 1.1 },
  "silniki-elektryczne-1-5-kw": { power: 1.5 },
  "silniki-elektryczne-2-2-kw": { power: 2.2 },
  "silniki-elektryczne-3-kw": { power: 3 },
  "silniki-elektryczne-4-kw": { power: 4 },
  "silniki-elektryczne-5-5-kw": { power: 5.5 },
  "silniki-elektryczne-7-5-kw": { power: 7.5 },
  "silniki-elektryczne-11-kw": { power: 11 },
  "silniki-elektryczne-18-5-kw": { power: 18.5 },
  "silniki-elektryczne-22-kw": { power: 22 },
  "silniki-elektryczne-30-kw": { power: 30 },
  "silniki-elektryczne-55-kw": { power: 55 },
  "silniki-elektryczne-75-kw": { power: 75 },
  "silniki-elektryczne-110-kw": { power: 110 },
  "silniki-elektryczne-160-kw": { power: 160 },
  "silniki-elektryczne-200-kw": { power: 200 },

  // MOC + OBROTY (NOWE!)
  "silniki-elektryczne-3-kw-1400-obr": {
    power: 3,
    rpmMin: 1200,
    rpmMax: 1600,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-3-kw-3000-obr": {
    power: 3,
    rpmMin: 2700,
    rpmMax: 3100,
    rpmLabel: "3000",
  },
  "silniki-elektryczne-5-5-kw-1400-obr": {
    power: 5.5,
    rpmMin: 1200,
    rpmMax: 1600,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-5-5-kw-3000-obr": {
    power: 5.5,
    rpmMin: 2700,
    rpmMax: 3100,
    rpmLabel: "3000",
  },
  // DODAJ WIĘCEJ KOMBINACJI TUTAJ

  // 0.09 kW
  "silniki-elektryczne-009-kw-700-obr": {
    power: 0.09,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-009-kw-900-obr": {
    power: 0.09,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-009-kw-1400-obr": {
    power: 0.09,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-009-kw-2900-obr": {
    power: 0.09,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.12 kW
  "silniki-elektryczne-012-kw-700-obr": {
    power: 0.12,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-012-kw-900-obr": {
    power: 0.12,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-012-kw-1400-obr": {
    power: 0.12,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-012-kw-2900-obr": {
    power: 0.12,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.18 kW
  "silniki-elektryczne-018-kw-700-obr": {
    power: 0.18,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-018-kw-900-obr": {
    power: 0.18,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-018-kw-1400-obr": {
    power: 0.18,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-018-kw-2900-obr": {
    power: 0.18,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.25 kW
  "silniki-elektryczne-025-kw-700-obr": {
    power: 0.25,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-025-kw-900-obr": {
    power: 0.25,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-025-kw-1400-obr": {
    power: 0.25,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-025-kw-2900-obr": {
    power: 0.25,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.37 kW
  "silniki-elektryczne-037-kw-700-obr": {
    power: 0.37,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-037-kw-900-obr": {
    power: 0.37,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-037-kw-1400-obr": {
    power: 0.37,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-037-kw-2900-obr": {
    power: 0.37,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.55 kW
  "silniki-elektryczne-055-kw-700-obr": {
    power: 0.55,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-055-kw-900-obr": {
    power: 0.55,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-055-kw-1400-obr": {
    power: 0.55,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-055-kw-2900-obr": {
    power: 0.55,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 0.75 kW
  "silniki-elektryczne-075-kw-700-obr": {
    power: 0.75,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-075-kw-900-obr": {
    power: 0.75,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-075-kw-1400-obr": {
    power: 0.75,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-075-kw-2900-obr": {
    power: 0.75,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 1.1 kW
  "silniki-elektryczne-1-1-kw-700-obr": {
    power: 1.1,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-1-1-kw-900-obr": {
    power: 1.1,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-1-1-kw-1400-obr": {
    power: 1.1,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-1-1-kw-2900-obr": {
    power: 1.1,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 1.5 kW
  "silniki-elektryczne-1-5-kw-700-obr": {
    power: 1.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-1-5-kw-900-obr": {
    power: 1.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-1-5-kw-1400-obr": {
    power: 1.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-1-5-kw-2900-obr": {
    power: 1.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 2.2 kW
  "silniki-elektryczne-2-2-kw-700-obr": {
    power: 2.2,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-2-2-kw-900-obr": {
    power: 2.2,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-2-2-kw-1400-obr": {
    power: 2.2,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-2-2-kw-2900-obr": {
    power: 2.2,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 3 kW
  "silniki-elektryczne-3-kw-700-obr": {
    power: 3,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-3-kw-900-obr": {
    power: 3,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },

  "silniki-elektryczne-3-kw-2900-obr": {
    power: 3,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 4 kW
  "silniki-elektryczne-4-kw-700-obr": {
    power: 4,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-4-kw-900-obr": {
    power: 4,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-4-kw-1400-obr": {
    power: 4,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-4-kw-2900-obr": {
    power: 4,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 5.5 kW
  "silniki-elektryczne-5-5-kw-700-obr": {
    power: 5.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-5-5-kw-900-obr": {
    power: 5.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },

  "silniki-elektryczne-5-5-kw-2900-obr": {
    power: 5.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 7.5 kW
  "silniki-elektryczne-7-5-kw-700-obr": {
    power: 7.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-7-5-kw-900-obr": {
    power: 7.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-7-5-kw-1400-obr": {
    power: 7.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-7-5-kw-2900-obr": {
    power: 7.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 11 kW
  "silniki-elektryczne-11-kw-700-obr": {
    power: 11,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-11-kw-900-obr": {
    power: 11,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-11-kw-1400-obr": {
    power: 11,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-11-kw-2900-obr": {
    power: 11,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },

  // 18.5 kW
  "silniki-elektryczne-18-5-kw-700-obr": {
    power: 18.5,
    rpmMin: 400,
    rpmMax: 800,
    rpmLabel: "700",
  },
  "silniki-elektryczne-18-5-kw-900-obr": {
    power: 18.5,
    rpmMin: 800,
    rpmMax: 1200,
    rpmLabel: "900",
  },
  "silniki-elektryczne-18-5-kw-1400-obr": {
    power: 18.5,
    rpmMin: 1200,
    rpmMax: 2100,
    rpmLabel: "1400",
  },
  "silniki-elektryczne-18-5-kw-2900-obr": {
    power: 18.5,
    rpmMin: 2500,
    rpmMax: 3500,
    rpmLabel: "2900",
  },
};

export default function CategoryPageClient({
  categoryMapper,
}: CategoryPageClientProps) {
  const { categorySlug } = useParams();
  const resolvedSlug = Array.isArray(categorySlug)
    ? categorySlug[0]
    : categorySlug || "";
  const resolvedCategorySlug = categoryMapper[resolvedSlug] || resolvedSlug;

  // SPRAWDŹ CZY TO STRONA MOCY
  const isPowerPage = !!POWER_MAPPING[resolvedSlug];
  const powerConfig = POWER_MAPPING[resolvedSlug];
  const powerValue = powerConfig?.power;

  // Stany dla strony mocy
  const [powerProducts, setPowerProducts] = useState<IProduct[]>([]);
  const [powerLoading, setPowerLoading] = useState(false);
  const [powerTotal, setPowerTotal] = useState(0);
  const [powerFilters, setPowerFilters] = useState({
    manufacturer: "",
    condition: "",
    rpmMin: undefined as number | undefined,
    rpmMax: undefined as number | undefined,
  });

  const searchParams = useSearchParams();
  const { trackEvent, getPageLocation } = useAnalytics();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1");
  const currentPage = page - 1;
  const [category, setCategory] = useState<ICategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    products,
    loading,
    error,
    fetchProducts,
    applyFilter,
    loadMore: loadMoreProducts,
    totalProducts,
    setItemsPerPage: setStoreItemsPerPage,
    itemsPerPage,
    ranges,
    activeFilters,
    hasActiveFilters,
  } = useShopStore();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const getManufacturersWithCount = (products: IProduct[]) => {
    const manufacturerCounts = products.reduce((acc, product) => {
      const manufacturer = product.manufacturer;
      acc[manufacturer] = (acc[manufacturer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(manufacturerCounts)
      .sort()
      .map((manufacturer) => ({
        name: manufacturer,
        count: manufacturerCounts[manufacturer],
      }));
  };

  const updateUrl = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());

    // Dla mocy
    if (
      filters.power[0] !== ranges.power[0] ||
      filters.power[1] !== ranges.power[1]
    ) {
      params.set("powerMin", filters.power[0].toString());
      params.set("powerMax", filters.power[1].toString());
    } else {
      params.delete("powerMin");
      params.delete("powerMax");
    }

    // Dla rodzaju napędu
    if (filters.productType.length > 0) {
      params.set("productType", filters.productType.join(","));
    } else {
      params.delete("productType");
    }

    // Dla obrotów
    if (filters.rpm[0] !== ranges.rpm[0] || filters.rpm[1] !== ranges.rpm[1]) {
      params.set("rpmMin", filters.rpm[0].toString());
      params.set("rpmMax", filters.rpm[1].toString());
    } else {
      params.delete("rpmMin");
      params.delete("rpmMax");
    }

    // Dla średnicy wału
    if (
      filters.shaftDiameter[0] !== ranges.shaftDiameter[0] ||
      filters.shaftDiameter[1] !== ranges.shaftDiameter[1]
    ) {
      params.set("shaftMin", filters.shaftDiameter[0].toString());
      params.set("shaftMax", filters.shaftDiameter[1].toString());
    } else {
      params.delete("shaftMin");
      params.delete("shaftMax");
    }

    // Dla stanu
    if (filters.condition) {
      params.set("condition", filters.condition);
    } else {
      params.delete("condition");
    }

    // Dla producenta
    if (filters.manufacturer) {
      params.set("manufacturer", filters.manufacturer);
    } else {
      params.delete("manufacturer");
    }

    router.push(`/${categorySlug}?${params.toString()}`, { scroll: false });
  };

  const fetchPowerProducts = async () => {
    setPowerLoading(true);

    try {
      const page = parseInt(searchParams.get("page") || "1") - 1;
      const sort = searchParams.get("sort") || "relevance";
      const tolerance = powerValue < 1 ? 0.02 : powerValue * 0.05;

      const params = new URLSearchParams({
        q: `${powerValue} kw`,
        powerMin: (powerValue - tolerance).toString(),
        powerMax: (powerValue + tolerance).toString(),
        page: page.toString(),
        limit: "20",
        sort: sort,
        ...(powerFilters.manufacturer && {
          manufacturer: powerFilters.manufacturer,
        }),
        ...(powerFilters.condition && { condition: powerFilters.condition }),
        // NAJPIERW sprawdź czy są obroty w konfiguracji URL
        ...(powerConfig?.rpmMin && { rpmMin: powerConfig.rpmMin.toString() }),
        ...(powerConfig?.rpmMax && { rpmMax: powerConfig.rpmMax.toString() }),
        // POTEM sprawdź czy są obroty w filtrach użytkownika (nadpisują URL)
        ...(powerFilters.rpmMin && { rpmMin: powerFilters.rpmMin.toString() }),
        ...(powerFilters.rpmMax && { rpmMax: powerFilters.rpmMax.toString() }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?${params}`
      );

      const data = await response.json();

      if (data.success) {
        setPowerProducts(data.data.products || []);
        setPowerTotal(data.data.total || 0);
      }
    } catch (error) {
      console.error("Błąd podczas pobierania produktów:", error);
    } finally {
      setPowerLoading(false);
    }
  };

  useEffect(() => {
    if (isPowerPage) {
      fetchPowerProducts();
    }
  }, [isPowerPage, searchParams, powerFilters]);

  // JEŚLI TO STRONA MOCY - ZWRÓĆ INNY KOMPONENT
  if (isPowerPage) {
    const currentPage = parseInt(searchParams.get("page") || "1") - 1;
    const totalPages = Math.ceil(powerTotal / 20);
    const formatPower = (power: number) => power.toString().replace(".", ",");

    // Stany dla filtrów rozszerzonych
    const [rpmRange, setRpmRange] = useState<[number, number]>([0, 3000]);
    const [manufacturers, setManufacturers] = useState<string[]>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState("");

    // Pobierz unikalne wartości producentów z produktów
    useEffect(() => {
      if (powerProducts.length > 0) {
        const uniqueManufacturers = Array.from(
          new Set(powerProducts.map((p) => p.manufacturer).filter(Boolean))
        ).sort();
        setManufacturers(uniqueManufacturers);
      }
    }, [powerProducts]);

    return (
      <>
        {powerProducts.length > 0 && (
          <CategorySchema
            categoryName={`Silniki elektryczne ${formatPower(powerValue)} kW${
              powerConfig?.rpmLabel ? ` ${powerConfig.rpmLabel} obr/min` : ""
            }`}
            products={powerProducts.slice(0, 20).map((p) => ({
              name: p.name,
              price: p.marketplaces?.ownStore?.price || 0,
              image: p.mainImage || p.images[0],
              categorySlug: p.categories?.[0]?.slug || "",
              productSlug: p.marketplaces?.ownStore?.slug || "",
            }))}
          />
        )}

        <div className="container mx-auto px-4 py-8">
          {/* POPRAWIONE BREADCRUMBS */}
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: `Silniki elektryczne ${formatPower(powerValue)} kW` },
            ]}
          />

          <h1 className="text-4xl font-bold mb-4">
            Silniki elektryczne {formatPower(powerValue)} kW
            {powerConfig?.rpmLabel && ` ${powerConfig.rpmLabel} obr/min`}
          </h1>

          {!powerLoading && (
            <p className="text-muted-foreground mb-8">
              Znaleziono {powerTotal}{" "}
              {powerTotal === 1
                ? "produkt"
                : powerTotal < 5
                ? "produkty"
                : "produktów"}{" "}
              o mocy {formatPower(powerValue)} kW
              {powerConfig?.rpmLabel &&
                ` z prędkością około ${powerConfig.rpmLabel} obr/min`}
            </p>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ROZBUDOWANE I POPRAWIONE FILTRY */}
            <aside className="lg:w-64">
              <div className="bg-card rounded-lg shadow-sm sticky top-4">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Filtrowanie</h3>
                </div>

                <div className="p-4 space-y-6">
                  {/* Przedział obrotów - SUWAK + PRZYCISKI */}
                  <div>
                    <label className="font-medium block mb-3">
                      Przedział obrotów (obr/min)
                    </label>

                    {/* Przyciski szybkiego wyboru */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[700, 900, 1400, 2900].map((rpm) => (
                        <button
                          key={rpm}
                          onClick={() => {
                            const isActive =
                              powerFilters.rpmMin === rpm - 100 &&
                              powerFilters.rpmMax === rpm + 100;
                            setPowerFilters((prev) => ({
                              ...prev,
                              rpmMin: isActive ? undefined : rpm - 100,
                              rpmMax: isActive ? undefined : rpm + 100,
                            }));
                          }}
                          className={`px-3 py-2 text-sm rounded-md border transition-all
                        ${
                          powerFilters.rpmMin === rpm - 100 &&
                          powerFilters.rpmMax === rpm + 100
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-gray-200 hover:border-primary hover:bg-gray-50"
                        }`}
                        >
                          {rpm}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Producent */}
                  <div>
                    <label className="font-medium block mb-2">Producent</label>
                    <select
                      value={powerFilters.manufacturer || ""}
                      onChange={(e) =>
                        setPowerFilters((prev) => ({
                          ...prev,
                          manufacturer: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                      <option value="">Wszyscy producenci</option>
                      {manufacturers.map((manufacturer) => (
                        <option key={manufacturer} value={manufacturer}>
                          {manufacturer} (
                          {
                            powerProducts.filter(
                              (p) => p.manufacturer === manufacturer
                            ).length
                          }
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stan - DODANY NIEUŻYWANY */}
                  <div>
                    <label className="font-medium block mb-2">Stan</label>
                    <div className="space-y-2">
                      {[
                        { value: "", label: "Wszystkie" },
                        { value: "nowy", label: "Nowy" },
                        { value: "uzywany", label: "Używany" },
                        { value: "nieuzywany", label: "Nieużywany" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <input
                            type="radio"
                            name="condition"
                            value={option.value}
                            checked={powerFilters.condition === option.value}
                            onChange={(e) =>
                              setPowerFilters((prev) => ({
                                ...prev,
                                condition: e.target.value,
                              }))
                            }
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Reset filtrów */}
                  {(powerFilters.condition ||
                    powerFilters.rpmMin ||
                    powerFilters.manufacturer) && (
                    <button
                      onClick={() =>
                        setPowerFilters({
                          manufacturer: "",
                          condition: "",
                          rpmMin: undefined,
                          rpmMax: undefined,
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Usuń filtry
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Produkty */}
            <div className="flex-1">
              {/* Nagłówek z sortowaniem */}
              {!powerLoading && powerProducts.length > 0 && (
                <div className="bg-background rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Wyświetlanie{" "}
                      <span className="font-semibold">
                        {currentPage * 20 + 1}-
                        {Math.min((currentPage + 1) * 20, powerTotal)}
                      </span>{" "}
                      z <span className="font-semibold">{powerTotal}</span>{" "}
                      produktów
                    </p>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Sortuj:</label>
                      <select
                        className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={searchParams.get("sort") || "relevance"}
                        onChange={(e) => {
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.set("sort", e.target.value);
                          router.push(`/${resolvedSlug}?${params.toString()}`);
                        }}
                      >
                        <option value="relevance">Trafność</option>
                        <option value="price_asc">Cena: rosnąco</option>
                        <option value="price_desc">Cena: malejąco</option>
                        <option value="power_asc">Moc: rosnąco</option>
                        <option value="power_desc">Moc: malejąco</option>
                        <option value="newest">Najnowsze</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Ładowanie */}
              {powerLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-gray-600">Wyszukiwanie produktów...</p>
                </div>
              )}

              {/* Lista produktów */}
              {!powerLoading && powerProducts.length > 0 && (
                <>
                  <ProductGrid products={powerProducts} />

                  {totalPages > 1 && (
                    <div className="mt-8">
                      <PaginationPage
                        currentPage={currentPage}
                        totalPages={totalPages}
                        categorySlug={resolvedSlug}
                      />

                      <div className="text-sm text-gray-500 text-center mt-4">
                        Strona {currentPage + 1} z {totalPages}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Brak wyników */}
              {!powerLoading && powerProducts.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-xl font-semibold text-gray-800 mb-2">
                      Brak produktów
                    </p>
                    <p className="text-gray-600">
                      Nie znaleźliśmy produktów o mocy {formatPower(powerValue)}{" "}
                      kW spełniających wybrane kryteria
                    </p>
                    {(powerFilters.condition ||
                      powerFilters.rpmMin ||
                      powerFilters.manufacturer) && (
                      <button
                        onClick={() =>
                          setPowerFilters({
                            manufacturer: "",
                            condition: "",
                            rpmMin: undefined,
                            rpmMax: undefined,
                          })
                        }
                        className="mt-6 px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Usuń filtry i spróbuj ponownie
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  useEffect(() => {
    if (!category?.id) return;
    {
      const powerMin = searchParams.get("powerMin");
      const powerMax = searchParams.get("powerMax");
      const rpmMin = searchParams.get("rpmMin");
      const rpmMax = searchParams.get("rpmMax");
      const shaftMin = searchParams.get("shaftMin");
      const shaftMax = searchParams.get("shaftMax");
      const condition = searchParams.get("condition");
      const manufacturer = searchParams.get("manufacturer");
      const productType = searchParams.get("productType");
      const productTypes = productType ? productType.split(",") : [];
      const page = parseInt(searchParams.get("page") || "1");

      const currentPage = page - 1;

      const updatedFilters: ActiveFilters = {
        ...activeFilters,
        categoryId: category.id,
        productType: productTypes,
        power:
          powerMin && powerMax
            ? ([parseFloat(powerMin), parseFloat(powerMax)] as [number, number])
            : activeFilters.power,
        rpm:
          rpmMin && rpmMax
            ? ([parseFloat(rpmMin), parseFloat(rpmMax)] as [number, number])
            : activeFilters.rpm,
        shaftDiameter:
          shaftMin && shaftMax
            ? ([parseFloat(shaftMin), parseFloat(shaftMax)] as [number, number])
            : activeFilters.shaftDiameter,
        condition: condition || activeFilters.condition,
        manufacturer: manufacturer || activeFilters.manufacturer,
        sleeveDiameter: activeFilters.sleeveDiameter,
        mechanicalSize: activeFilters.mechanicalSize,
        startType: activeFilters.startType,
        inStock: activeFilters.inStock,
      };
      // Aktualizuj stan filtrów

      // Aktualizuj stan filtrów
      useShopStore.setState({ activeFilters: updatedFilters });

      // Pobierz produkty
      fetchProducts({
        ...updatedFilters,
        sort: sortBy,
        page: currentPage,
      }).catch((error) => {
        console.error("BŁĄD przy fetchProducts:", error);
      });
    }
  }, [searchParams, category]);

  useEffect(() => {
    // Przekierowanie z page=0 na stronę bez parametru
    if (searchParams.get("page") === "0" || searchParams.get("page") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      router.replace(
        `/${categorySlug}${params.toString() ? `?${params.toString()}` : ""}`
      );
      return;
    }
  }, [searchParams, categorySlug]);

  const formatActiveFilterValue = (value: number): string => {
    return value.toString().replace(".", ",");
  };

  // Handler dla filtrowania
  const handleFilter = async (
    filterType: string,
    value: any,
    additionalParams?: any
  ) => {
    if (!category?.id) return;

    const filters = useShopStore.getState().activeFilters;

    if (filterType === "reset" && additionalParams?.clearUrl) {
      await useShopStore.getState().initializeFiltersForCategory(category.id);
      router.push(`/${categorySlug}?page=1`);

      trackEvent("category_filters_reset", {
        location: getPageLocation(),
        category: category.name,
        categoryId: category.id,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Aktualizujemy store i URL
    const newFilters: ActiveFilters = {
      ...filters,
      [filterType]: value,
      categoryId: category.id,
    };

    useShopStore.setState({ activeFilters: newFilters });

    // Śledzenie tylko przy zatwierdzeniu zmiany filtra
    trackEvent("category_filter_applied", {
      location: getPageLocation(),
      filter_type: filterType,
      filter_value: JSON.stringify(value),
      category: category.name,
      categoryId: category.id,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    });

    // Aktualizujemy URL
    updateUrl(newFilters);
  };

  // Handler dla sortowania
  const handleSort = (value: string) => {
    setSortBy(value);

    trackEvent("category_sort_change", {
      location: getPageLocation(),
      sort_type: value,
      category: category?.name,
      categoryId: category?.id,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    });

    applyFilter("sort", value, {
      categoryId: category?.id,
      sort: value,
    });
  };

  const getUniqueManufacturers = (products: IProduct[]): string[] => {
    return Array.from(
      new Set(products.filter((p) => p.manufacturer).map((p) => p.manufacturer))
    ).sort();
  };

  // Handler dla zmiany liczby wyświetlanych produktów
  const handleItemsPerPageChange = (value: number) => {
    setStoreItemsPerPage(value, {
      categoryId: category?.id,
      sortBy,
    });

    trackEvent("category_items_per_page_change", {
      location: getPageLocation(),
      items_per_page: value,
      category: category?.name,
      categoryId: category?.id,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  };

  // Handler dla ładowania kolejnych produktów
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    // Aktualizujemy URL bez przeładowania strony
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    router.push(`/${categorySlug}?${params.toString()}`);
  };

  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const response = await fetch(`${baseUrl}/api/${resolvedCategorySlug}`);
        const data = await response.json();

        // Najpierw ustawiamy kategorię
        setCategory(data.data);

        trackEvent("category_page_view", {
          location: getPageLocation(),
          category: data.data.name,
          categoryId: data.data.id,
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        });

        if (!data.data?.id) return;

        await useShopStore
          .getState()
          .initializeFiltersForCategory(data.data.id);

        const powerMin = searchParams.get("powerMin");
        const powerMax = searchParams.get("powerMax");
        const rpmMin = searchParams.get("rpmMin");
        const rpmMax = searchParams.get("rpmMax");
        const shaftMin = searchParams.get("shaftMin");
        const shaftMax = searchParams.get("shaftMax");
        const condition = searchParams.get("condition");
        const manufacturer = searchParams.get("manufacturer");

        if (
          powerMin ||
          powerMax ||
          rpmMin ||
          rpmMax ||
          shaftMin ||
          shaftMax ||
          condition ||
          manufacturer
        ) {
          const activeFilters = useShopStore.getState().activeFilters;
          const updatedFilters: ActiveFilters = {
            ...activeFilters,
            categoryId: data.data.id,
            power:
              powerMin && powerMax
                ? ([parseFloat(powerMin), parseFloat(powerMax)] as [
                    number,
                    number
                  ])
                : activeFilters.power,
            rpm:
              rpmMin && rpmMax
                ? ([parseFloat(rpmMin), parseFloat(rpmMax)] as [number, number])
                : activeFilters.rpm,
            shaftDiameter:
              shaftMin && shaftMax
                ? ([parseFloat(shaftMin), parseFloat(shaftMax)] as [
                    number,
                    number
                  ])
                : activeFilters.shaftDiameter,
            condition: condition || activeFilters.condition,
            manufacturer: manufacturer || activeFilters.manufacturer,
            sleeveDiameter: activeFilters.sleeveDiameter,
            mechanicalSize: activeFilters.mechanicalSize,
            startType: activeFilters.startType,
            inStock: activeFilters.inStock,
          };

          useShopStore.setState({ activeFilters: updatedFilters });
        }

        // Zawsze pobieramy produkty
        const fetchFilters: Filters = {
          categoryId: data.data.id,
          sort: sortBy,
          page: currentPage,
          limit: itemsPerPage,
          skipPagination: false,
          power: useShopStore.getState().activeFilters.power,
          rpm: useShopStore.getState().activeFilters.rpm,
          shaftDiameter: useShopStore.getState().activeFilters.shaftDiameter,
          condition: useShopStore.getState().activeFilters.condition,
          manufacturer: useShopStore.getState().activeFilters.manufacturer,
          inStock: useShopStore.getState().activeFilters.inStock,
        };

        await fetchProducts(fetchFilters);
      } catch (error) {
        console.error("Błąd:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategory();
    }
  }, [categorySlug, searchParams]);

  if (isLoading || loading) {
    return <div>Ładowanie...</div>;
  }

  if (error || !category) {
    return <div>Błąd: {error || "Nie znaleziono kategorii"}</div>;
  }

  const description = category.description || "";
  const shouldTruncate = description.length > 200;

  return (
    <>
      {!isPowerPage && category && products.length > 0 && (
        <CategorySchema
          categoryName={category.name}
          products={products.slice(0, 20).map((p) => ({
            name: p.name,
            price: p.marketplaces?.ownStore?.price || 0,
            image: p.mainImage || p.images[0],
            categorySlug: p.categories?.[0]?.slug || "",
            productSlug: p.marketplaces?.ownStore?.slug || "",
          }))}
        />
      )}

      <Head>
        {/* Blokowanie indeksowania stron z filtrami */}
        {hasActiveFilters() && <meta name="robots" content="noindex, follow" />}

        {/* Dla stron z paginacją powyżej 1 też noindex */}
        {currentPage > 0 && <meta name="robots" content="noindex, follow" />}

        {/* Canonical zawsze wskazuje na główną stronę kategorii */}
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_SITE_URL}/${categorySlug}`}
        />

        {/* Linki do poprzedniej i następnej strony dla SEO */}
        {currentPage > 1 && (
          <link
            rel="prev"
            href={`/${categorySlug}${
              currentPage > 2 ? `?page=${currentPage}` : ""
            }`}
          />
        )}
        {products.length >= itemsPerPage && (
          <link rel="next" href={`/${categorySlug}?page=${currentPage + 2}`} />
        )}
      </Head>
      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtrowanie - lewa kolumna */}
          <div
            className={`w-full lg:w-1/4 ${
              isFilterVisible ? "block" : "hidden"
            } lg:block`}
          >
            <CategoryFilters
              onFilter={handleFilter}
              loading={loading}
              categoryId={category?.id}
              manufacturers={getManufacturersWithCount(products)}
            />
          </div>

          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="w-full border-x-4 border-y-1 py-2 px-4 rounded-lg flex items-center justify-between"
            >
              <span>Filtry</span>
              <span>{isFilterVisible ? "↑" : "↓"}</span>
            </button>
          </div>

          <div className="w-full lg:w-3/4">
            <Breadcrumbs
              className="mb-6"
              items={[
                {
                  label: category.name,
                },
              ]}
            />
            <h1 className="text-4xl font-bold mb-4">{category.name}</h1>

            {/* Opis kategorii */}
            <div className="mb-8 prose prose-sm max-w-none">
              {" "}
              {shouldTruncate && !isDescriptionExpanded ? (
                <>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: description.slice(0, 200) + "...",
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsDescriptionExpanded(!isDescriptionExpanded);
                      trackEvent("category_description_toggle", {
                        location: getPageLocation(),
                        action: isDescriptionExpanded ? "collapse" : "expand",
                        category: category.name,
                        categoryId: category.id,
                        url: window.location.pathname,
                        timestamp: new Date().toISOString(),
                      });
                    }}
                    className="text-primary hover:underline mt-2"
                  >
                    {isDescriptionExpanded ? "Pokaż mniej" : "Pokaż więcej"}
                  </button>
                </>
              ) : (
                <>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: description,
                    }}
                  />
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="text-primary hover:underline mt-2"
                    >
                      Pokaż mniej
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Opcje wyświetlania i sortowania */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <label htmlFor="itemsPerPage" className="text-sm  sm:hidden">
                  Liczba produktów na stronie:
                </label>
                <select
                  id="itemsPerPage"
                  className="border p-2 rounded w-full sm:w-auto "
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                  value={itemsPerPage}
                >
                  <option value="20">Pokaż 20</option>
                  <option value="50">Pokaż 50</option>
                  <option value="100">Pokaż 100</option>
                  <option value="200">Pokaż 200</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <label htmlFor="sortBy" className="text-sm sm:hidden">
                  Sortowanie:
                </label>
                <select
                  id="sortBy"
                  className="border p-2 rounded w-full sm:w-auto"
                  onChange={(e) => handleSort(e.target.value)}
                  value={sortBy}
                >
                  <option value="newest">Najnowsze</option>
                  <option value="price_asc">Cena: od najtańszych</option>
                  <option value="price_desc">Cena: od najdroższych</option>
                  <option value="power_asc">Moc: od najsłabszych</option>
                  <option value="power_desc">Moc: od najmocniejszych</option>
                </select>
              </div>
            </div>

            {/* Licznik produktów */}
            <div className="text-sm text-gray-500 mb-4 space-y-2">
              {loading ? (
                "Ładowanie..."
              ) : (
                <>
                  <div>
                    {totalProducts > 0
                      ? `Znaleziono ${totalProducts} produktów`
                      : "Brak produktów"}
                  </div>

                  {/* Podsumowanie aktywnych filtrów */}
                  {activeFilters.condition ? (
                    <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                      Stan:{" "}
                      {activeFilters.condition === "nowy"
                        ? "Nowy"
                        : activeFilters.condition === "uzywany"
                        ? "Używany"
                        : "Nieużywany"}
                      <button
                        onClick={() => {
                          handleFilter("condition", "");
                        }}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors inline-flex items-center"
                        title="Usuń filtr stanu"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ) : null}

                  <div className="text-xs space-x-2">
                    {activeFilters.power[0] !== ranges.power[0] ||
                    activeFilters.power[1] !== ranges.power[1] ? (
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded group relative">
                        Moc: {formatActiveFilterValue(activeFilters.power[0])} -{" "}
                        {formatActiveFilterValue(activeFilters.power[1])} kW
                        <button
                          onClick={() => {
                            handleFilter("power", [
                              ranges.power[0],
                              ranges.power[1],
                            ]);
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors inline-flex items-center"
                          title="Usuń filtr mocy"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}

                    {activeFilters.rpm[0] !== ranges.rpm[0] ||
                    activeFilters.rpm[1] !== ranges.rpm[1] ? (
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                        Obroty: {formatActiveFilterValue(activeFilters.rpm[0])}{" "}
                        - {formatActiveFilterValue(activeFilters.rpm[1])}{" "}
                        obr./min
                        <button
                          onClick={() => {
                            handleFilter("rpm", [ranges.rpm[0], ranges.rpm[1]]);
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors inline-flex items-center"
                          title="Usuń filtr obrotów"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}

                    {activeFilters.shaftDiameter[0] !==
                      ranges.shaftDiameter[0] ||
                    activeFilters.shaftDiameter[1] !==
                      ranges.shaftDiameter[1] ? (
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                        Średnica wału:{" "}
                        {formatActiveFilterValue(
                          activeFilters.shaftDiameter[0]
                        )}{" "}
                        -{" "}
                        {formatActiveFilterValue(
                          activeFilters.shaftDiameter[1]
                        )}{" "}
                        mm
                        <button
                          onClick={() => {
                            handleFilter("shaftDiameter", [
                              ranges.shaftDiameter[0],
                              ranges.shaftDiameter[1],
                            ]);
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors inline-flex items-center"
                          title="Usuń filtr średnicy wału"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}

                    {activeFilters.manufacturer ? (
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                        Producent: {activeFilters.manufacturer}
                        <button
                          onClick={() => {
                            handleFilter("manufacturer", "");
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors inline-flex items-center"
                          title="Usuń filtr producenta"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            {/* Lista produktów */}

            <ProductGrid products={products} />

            {/* Paginacja */}
            <div className="mt-8 mb-4">
              <PaginationPage
                currentPage={currentPage}
                totalPages={Math.ceil(totalProducts / itemsPerPage)}
                categorySlug={resolvedCategorySlug}
                className="mb-4"
              />
            </div>

            {/* Podsumowanie paginacji */}
            <div className="text-sm text-gray-500 text-center mb-8">
              Strona {currentPage + 1} z{" "}
              {Math.ceil(totalProducts / itemsPerPage)} ({totalProducts}{" "}
              produktów)
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

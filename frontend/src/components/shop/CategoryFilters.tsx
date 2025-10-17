// frontend/src/components/shop/CategoryFilters.tsx
"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/slider";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useShopStore } from "@/store/shopStore";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type FilterField = "power" | "rpm" | "shaftDiameter";

const RPM_RANGES = {
  700: [601, 800],
  900: [801, 1000],
  1400: [1301, 1500],
  2900: [2501, 2980],
};

const PREDEFINED_RPM_VALUES = [700, 900, 1400, 2900]; // !!!!!!!!!!!!!DODAĆ 70!!!!!!!!!!!!!

const getAvailablePredefinedRpmValues = (allRpmValues: number[]) => {
  // Sprawdzamy, które z predefiniowanych wartości RPM występują w zakresach
  return PREDEFINED_RPM_VALUES.filter((rpm) => {
    const range = RPM_RANGES[rpm as keyof typeof RPM_RANGES];
    // Sprawdzamy czy jakiekolwiek wartości z danych mieszczą się w zakresie dla tego RPM
    return allRpmValues.some((value) => value >= range[0] && value <= range[1]);
  });
};

interface HoveredState {
  field: "power" | "rpm" | "shaftDiameter";
  value: number;
  x: number;
}

interface ManufacturerWithCount {
  name: string;
  count: number;
}

interface CategoryFiltersProps {
  onFilter: (
    filterType: string,
    value: any,
    activeFilters?: Record<string, any>
  ) => void;
  loading?: boolean;
  categoryId?: string;
  manufacturers: ManufacturerWithCount[];
}

interface SliderValueTooltipProps {
  value: number;
  x: number;
  unit?: string;
}

interface InputValues {
  power: [string | number, string | number];
  rpm: [string | number, string | number];
  shaftDiameter: [string | number, string | number];
}

const EXCLUDED_WORDS = [
  "pompa",
  "silnik",
  "reduktor",
  "motoreduktor",
  "falownik",
  "kołnierz",
  "ramię",
  "siłownik",
  "wał",
  "wentylator",
];

const shouldExcludeManufacturer = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return EXCLUDED_WORDS.some((word) => lowerName.includes(word.toLowerCase()));
};

const SliderValueTooltip = ({
  value,
  x,
  unit = "",
}: SliderValueTooltipProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="absolute -top-8 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm shadow-md whitespace-nowrap flex items-center justify-center min-w-fit"
    style={{ left: `${x}px` }}
  >
    <span className="inline-block">
      {value.toFixed(1)}
      {unit}
    </span>
  </motion.div>
);

export function CategoryFilters({
  onFilter,
  loading,
  categoryId,
  manufacturers,
}: CategoryFiltersProps) {
  const isSearchPage = categoryId === "search-results";

  const [availableCategories, setAvailableCategories] = useState<
    { id: string; name: string; count: number }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [activeThumb, setActiveThumb] = useState<{
    index: number;
    field: FilterField;
  } | null>(null);
  const [categoryManufacturers, setCategoryManufacturers] = useState<
    ManufacturerWithCount[]
  >([]);
  const [availableProductTypes, setAvailableProductTypes] = useState<
    Array<{
      value: string;
      label: string;
      count: number;
    }>
  >([]);
  const { trackEvent, getPageLocation } = useAnalytics();
  const { activeFilters, setFilter, ranges, hasActiveFilters } = useShopStore();
  const [hoveredValue, setHoveredValue] = useState<HoveredState | null>(null);
  const [predefinedRpmValues, setPredefinedRpmValues] = useState<number[]>([]);
  const [activeInput, setActiveInput] = useState<"power" | "rpm" | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [inputValues, setInputValues] = useState<InputValues>({
    power: [activeFilters.power[0], activeFilters.power[1]],
    rpm: [activeFilters.rpm[0], activeFilters.rpm[1]],
    shaftDiameter: [
      activeFilters.shaftDiameter[0],
      activeFilters.shaftDiameter[1],
    ],
  });

  useEffect(() => {
    const fetchManufacturers = async () => {
      if (!categoryId || isSearchPage) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const response = await fetch(
          `${baseUrl}/api/categories/${categoryId}/manufacturers`
        );
        const data = await response.json();
        if (data.success) {
          setCategoryManufacturers(data.data);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania producentów:", error);
      }
    };

    fetchManufacturers();
  }, [categoryId, isSearchPage]);

  useEffect(() => {
    setInputValues({
      power: activeFilters.power,
      rpm: activeFilters.rpm,
      shaftDiameter: activeFilters.shaftDiameter,
    });
  }, [activeFilters]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isSearchPage) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const response = await fetch(`${baseUrl}/api/categories`);
        const data = await response.json();

        if (data.success) {
          // Filtruj tylko główne kategorie produktów
          const productCategories = data.data.filter((cat: any) =>
            [
              "trojfazowe",
              "jednofazowe",
              "wentylatory-przemyslowe",
              "motoreduktory",
            ].includes(cat.slug)
          );
          setAvailableCategories(productCategories);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania kategorii:", error);
      }
    };

    fetchCategories();
  }, [isSearchPage]);

  useEffect(() => {
    const fetchProductTypes = async () => {
      if (!categoryId || isSearchPage) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const response = await fetch(
          `${baseUrl}/api/categories/${categoryId}/product-types`
        );
        const data = await response.json();
        if (data.success) {
          setAvailableProductTypes(data.data);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania typów produktów:", error);
      }
    };

    fetchProductTypes();
  }, [categoryId]);

  useEffect(() => {
    const fetchAvailableRpmValues = async () => {
      if (!categoryId) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        const response = await fetch(
          `${baseUrl}/api/categories/${categoryId}/rpm-values`
        );
        const data = await response.json();
        if (data.success) {
          setPredefinedRpmValues(getAvailablePredefinedRpmValues(data.data));
        }
      } catch (error) {
        console.error("Błąd podczas pobierania dostępnych obrotów:", error);
      }
    };

    fetchAvailableRpmValues();
  }, [categoryId]);

  useEffect(() => {
    const fetchRangesForCategory = async () => {
      if (!categoryId) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Dla strony wyszukiwania używaj globalnych zakresów
        const url = isSearchPage
          ? `${baseUrl}/api/products/ranges`
          : `${baseUrl}/api/categories/${categoryId}/ranges`;

        const response = await fetch(url);
        const data = await response.json();

        console.log("Otrzymane zakresy:", data); // Dodaj log do debugowania

        if (data.success && data.data) {
          useShopStore.setState((state) => ({
            ranges: {
              ...state.ranges,
              power: data.data.power || [0.03, 300],
              rpm: data.data.rpm || [0, 3000],
              shaftDiameter: data.data.shaftDiameter || [0, 100],
            },
          }));
        } else {
          // Ustaw domyślne wartości jeśli brak danych
          useShopStore.setState((state) => ({
            ranges: {
              ...state.ranges,
              power: [0.03, 300],
              rpm: [0, 3000],
              shaftDiameter: [0, 100],
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching ranges:", error);
        // Ustaw domyślne wartości w przypadku błędu
        useShopStore.setState((state) => ({
          ranges: {
            ...state.ranges,
            power: [0.03, 300],
            rpm: [0, 3000],
            shaftDiameter: [0, 100],
          },
        }));
      }
    };

    fetchRangesForCategory();
  }, [categoryId, isSearchPage]);

  useEffect(() => {
    // Sprawdź czy activeFilters są w zakresie ranges
    const validateAndUpdateFilters = () => {
      const newValues: Partial<Record<FilterField, [number, number]>> = {};
      let needsUpdate = false;

      (["power", "rpm", "shaftDiameter"] as FilterField[]).forEach((field) => {
        const range = ranges[field];
        const filter = activeFilters[field];

        if (filter[0] < range[0] || filter[1] > range[1]) {
          needsUpdate = true;
          newValues[field] = range;
        }
      });

      if (needsUpdate) {
        Object.entries(newValues).forEach(([field, value]) => {
          setFilter(field as FilterField, value);
        });
      }
    };

    validateAndUpdateFilters();
  }, [ranges, activeFilters]);

  const formatRpmValue = (value: string | number): string => {
    if (typeof value === "string") {
      // Jeśli to zakres, weź pierwszą wartość
      const firstValue = value.split("-")[0];
      return firstValue.replace(/[^0-9,.]/g, "").replace(",", ".");
    }
    return value.toString();
  };

  const handleRpmButtonClick = (rpm: number) => {
    const range = RPM_RANGES[rpm as keyof typeof RPM_RANGES];

    const newValue =
      activeFilters.rpm[0] === range[0] && activeFilters.rpm[1] === range[1]
        ? [ranges.rpm[0], ranges.rpm[1]] // Reset do pełnego zakresu
        : range; // Ustawienie nowego zakresu

    trackEvent("category_rpm_button_click", {
      location: getPageLocation(),
      rpm_value: rpm,
      rpm_range: range,
      action: activeFilters.rpm[0] === range[0] ? "reset" : "set",
      category: categoryId,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    });

    handleChange("rpm", newValue);
    handleSliderCommitted("rpm", newValue);
  };

  const isRpmButtonActive = (rpm: number) => {
    const range = RPM_RANGES[rpm as keyof typeof RPM_RANGES];
    return (
      activeFilters.rpm[0] === range[0] && activeFilters.rpm[1] === range[1]
    );
  };

  // Funkcja do obsługi focusu inputa
  const handleInputFocus = (field: "power" | "rpm") => {
    setActiveInput(field);
  };

  // Funkcja do obsługi utraty focusu
  const handleInputBlurWithDelay = (field: "power" | "rpm") => {
    // Używamy setTimeout, żeby dać czas na kliknięcie przycisku "Filtruj"
    setTimeout(() => {
      if (activeInput === field) {
        setActiveInput(null);
      }
    }, 200);
  };

  const handleSliderHover = (
    e: React.MouseEvent<HTMLDivElement>,
    field: HoveredState["field"],
    min: number,
    max: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Obliczamy wartość na podstawie aktualnej pozycji kursora
    const percentage = x / rect.width;
    const value = min + (max - min) * percentage;

    // Sprawdzamy, czy kursor jest blisko którejś z kropek suwaka
    const currentValues = activeFilters[field];
    const leftValue = currentValues[0];
    const rightValue = currentValues[1];

    // Obliczamy pozycje kropek na sliderze
    const leftX = ((leftValue - min) / (max - min)) * rect.width;
    const rightX = ((rightValue - min) / (max - min)) * rect.width;

    // Sprawdzamy, czy kursor jest blisko którejś z kropek (w promieniu 20px)
    const closeToLeft = Math.abs(x - leftX) < 20;
    const closeToRight = Math.abs(x - rightX) < 20;

    // Jeśli kursor jest blisko kropki, pokazujemy jej wartość
    if (closeToLeft) {
      setHoveredValue({ field, value: leftValue, x: leftX });
    } else if (closeToRight) {
      setHoveredValue({ field, value: rightValue, x: rightX });
    } else {
      setHoveredValue({ field, value, x });
    }
  };

  const handleThumbDrag = (
    value: number,
    index: number,
    field: FilterField
  ) => {
    const rect = document
      .querySelector(`#slider-${field}`)
      ?.getBoundingClientRect();
    if (!rect) return;

    // Obliczamy pozycję x dla tooltipa
    const percentage =
      (value - ranges[field][0]) / (ranges[field][1] - ranges[field][0]);
    const x = rect.width * percentage;

    setHoveredValue({
      field,
      value,
      x,
    });
  };

  const handleSliderLeave = () => {
    setHoveredValue(null);
  };

  const formatNumber = (value: number | string): string => {
    if (typeof value === "string" && value.includes("/")) {
      return value.replace(/,/g, ","); // Zachowaj format z zakresem
    }
    return value.toString().replace(".", ",");
  };

  // Funkcja do parsowania liczb z polskiego formatu
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(",", "."));
  };

  // Zmodyfikowana funkcja handleInputChange
  const handleInputChange = (
    field: keyof InputValues,
    index: number,
    value: string
  ) => {
    // Pozwalamy na puste pole
    if (value === "") {
      const currentValues = [...inputValues[field]];
      currentValues[index] = "";
      setInputValues((prev) => ({
        ...prev,
        [field]: currentValues as [string | number, string | number],
      }));
      return;
    }

    // Zamieniamy kropkę na przecinek w locie
    const formattedValue = value.replace(".", ",");

    // Walidacja - tylko liczby i przecinek
    const numValue = formattedValue.replace(/[^\d,]/g, "");
    if (numValue === "") return;

    const currentValues = [...inputValues[field]];
    currentValues[index] = numValue;

    setInputValues((prev) => ({
      ...prev,
      [field]: currentValues as [string | number, string | number],
    }));
  };

  const handleInputBlur = (field: keyof InputValues) => {
    const currentValues = inputValues[field];

    // Sprawdź czy któreś pole jest puste
    if (currentValues[0] === "" || currentValues[1] === "") {
      setInputErrors({
        ...inputErrors,
        [field]: "Oba pola muszą być wypełnione",
      });
      return;
    }

    // Parsujemy wartości
    const val1 = parseNumber(currentValues[0].toString());
    const val2 = parseNumber(currentValues[1].toString());

    if (isNaN(val1) || isNaN(val2)) {
      setInputErrors({
        ...inputErrors,
        [field]: "Nieprawidłowy format liczby",
      });
      return;
    }

    // Wyczyść błąd
    setInputErrors({
      ...inputErrors,
      [field]: "",
    });

    const minValue = ranges[field][0];
    const maxValue = ranges[field][1];

    const validatedValues: [number, number] = [
      Math.max(minValue, Math.min(val1, val2)),
      Math.min(maxValue, Math.max(val1, val2)),
    ];

    if (!inputErrors[field]) {
      trackEvent("category_filter_input_applied", {
        location: getPageLocation(),
        filter_type: field,
        filter_value: JSON.stringify(validatedValues),
        category: categoryId,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });

      setFilter(field, validatedValues);
      onFilter(field, validatedValues);
    }
  };

  const handleChange = (field: string, value: any) => {
    // Usuwamy zaokrąglanie i zostawiamy dokładną wartość
    if (["power", "rpm", "shaftDiameter"].includes(field)) {
      setInputValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSliderCommitted = (field: string, value: any) => {
    onFilter(field, value);
  };

  // Modyfikacja useEffect dla inputValues
  useEffect(() => {
    if (!loading) {
      setInputValues({
        power: activeFilters.power,
        rpm: activeFilters.rpm,
        shaftDiameter: activeFilters.shaftDiameter,
      });
    }
  }, [activeFilters, loading]);

  return (
    <div className="p-4 bg-card rounded-lg space-y-6 lg:top-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Filtrowanie</h3>

        {/* Filtr kategorii - tylko dla strony wyszukiwania */}
        {isSearchPage && availableCategories.length > 0 && (
          <div className="mb-6">
            <label className="font-medium block mb-2">Kategoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                onFilter("category", e.target.value);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Wszystkie kategorie</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <AnimatePresence>
          {hasActiveFilters() && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                if (categoryId) {
                  await useShopStore
                    .getState()
                    .initializeFiltersForCategory(categoryId);
                  onFilter("reset", null, {
                    categoryId,
                    sort: "newest",
                    clearUrl: true,
                  });
                }
              }}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-2"
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
            </motion.button>
          )}
        </AnimatePresence>
        {/*<div className="mb-6">
          <label className="font-medium block mb-2">Rodzaj napędu</label>
          <div className="space-y-2">
            {availableProductTypes.map((type) => (
              <motion.div
                key={type.value}
                className="flex items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Checkbox
                  id={`type-${type.value}`}
                  checked={activeFilters.productType.includes(type.value)}
                  onCheckedChange={(checked) => {
                    const newTypes = checked
                      ? [...activeFilters.productType, type.value]
                      : activeFilters.productType.filter((t) => t !== type.value);

                    onFilter('productType', newTypes);
                  }}
                />

                <label htmlFor={`type-${type.value}`} className="ml-2">
                  {type.label} ({type.count})
                </label>
              </motion.div>
            ))}
          </div>
        </div>*/}

        <div
          className={`mt-6 space-y-6 ${
            loading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div>
            <label className="font-medium block mb-2">
              Przedział mocy (kW)
            </label>
            <div
              id={`slider-power`}
              className="relative"
              onMouseMove={(e) =>
                !activeThumb &&
                handleSliderHover(e, "power", ranges.power[0], ranges.power[1])
              }
              onMouseLeave={() => !activeThumb && setHoveredValue(null)}
              style={{ padding: "0.2rem 0" }}
            >
              <Slider
                value={activeFilters.power}
                onValueChange={(val) => handleChange("power", val)}
                onValueCommit={(val) => {
                  handleSliderCommitted("power", val);
                  setActiveThumb(null);
                }}
                onThumbDrag={(value, index) =>
                  handleThumbDrag(value, index, "power")
                }
                min={ranges.power[0]}
                max={ranges.power[1]}
                step={0.1}
              />
              <AnimatePresence>
                {hoveredValue && hoveredValue.field === "power" && (
                  <SliderValueTooltip
                    value={hoveredValue.value}
                    x={hoveredValue.x}
                    unit=" kW"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex flex-col">
                  <Input
                    type="text"
                    value={
                      typeof inputValues.power[0] === "number"
                        ? formatNumber(inputValues.power[0])
                        : inputValues.power[0].toString()
                    }
                    onChange={(e) =>
                      handleInputChange("power", 0, e.target.value)
                    }
                    onFocus={() => handleInputFocus("power")}
                    onBlur={() => handleInputBlurWithDelay("power")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInputBlur("power");
                        setActiveInput(null);
                      }
                    }}
                    className={`w-24 ${
                      inputErrors.power ? "border-red-500" : ""
                    }`}
                  />
                </div>
                <span className="self-center">-</span>
                <div className="flex flex-col">
                  <Input
                    type="text"
                    value={
                      typeof inputValues.power[1] === "number"
                        ? formatNumber(inputValues.power[1])
                        : inputValues.power[1].toString()
                    }
                    onChange={(e) =>
                      handleInputChange("power", 1, e.target.value)
                    }
                    onFocus={() => handleInputFocus("power")}
                    onBlur={() => handleInputBlurWithDelay("power")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInputBlur("power");
                        setActiveInput(null);
                      }
                    }}
                    className={`w-24 ${
                      inputErrors.power ? "border-red-500" : ""
                    }`}
                  />
                </div>
              </div>
              {inputErrors.power && (
                <span className="text-xs text-red-500">
                  {inputErrors.power}
                </span>
              )}
              <AnimatePresence>
                {activeInput === "power" && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!inputErrors.power) {
                        handleInputBlur("power");
                        setActiveInput(null);
                      }
                    }}
                    className={`self-start px-3 py-1 text-xs ${
                      inputErrors.power
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90"
                    } text-white rounded-full shadow-sm transition-colors`}
                  >
                    Filtruj
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Analogicznie dla RPM */}
          <div>
            <label className="font-medium block mb-2">
              Przedział obrotów (obr./min)
            </label>
            {/* Przyciski szybkiego wyboru RPM */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 mb-2">
              {predefinedRpmValues.map((rpm) => (
                <motion.button
                  key={rpm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleRpmButtonClick(rpm)}
                  className={`px-2 py-1.5 text-sm rounded-full border transition-colors whitespace-nowrap flex items-center justify-center min-w-fit
                ${
                  isRpmButtonActive(rpm)
                    ? "bg-primary border-primary"
                    : "border-gray-300 hover:border-primary"
                }
              `}
                >
                  <span className="flex items-center gap-0.5 text-center">
                    <span className="text-sm">{rpm}</span>
                    <span className="text-xs opacity-75">obr./min</span>
                    <AnimatePresence>
                      {isRpmButtonActive(rpm) && (
                        <motion.svg
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="w-3 h-3 ml-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>
              ))}
            </div>
            <div
              className="relative"
              id={`slider-rpm`}
              onMouseMove={(e) =>
                handleSliderHover(e, "rpm", ranges.rpm[0], ranges.rpm[1])
              }
              onMouseLeave={handleSliderLeave}
            >
              <Slider
                value={activeFilters.rpm}
                onValueChange={(val) => handleChange("rpm", val)}
                onValueCommit={(val) => handleSliderCommitted("rpm", val)}
                onThumbDrag={(value, index) =>
                  handleThumbDrag(value, index, "rpm")
                }
                min={ranges.rpm[0]}
                max={ranges.rpm[1]}
                step={100}
              />
              <AnimatePresence>
                {hoveredValue && hoveredValue.field === "rpm" && (
                  <SliderValueTooltip
                    value={hoveredValue.value}
                    x={hoveredValue.x}
                    unit=" RPM"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Inputy numeryczne */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={
                    typeof inputValues.rpm[0] === "number"
                      ? formatNumber(inputValues.rpm[0])
                      : inputValues.rpm[0].toString()
                  }
                  onChange={(e) => handleInputChange("rpm", 0, e.target.value)}
                  onFocus={() => handleInputFocus("rpm")}
                  onBlur={() => handleInputBlurWithDelay("rpm")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInputBlur("rpm");
                      setActiveInput(null);
                    }
                  }}
                  className={`w-24 ${inputErrors.rpm ? "border-red-500" : ""}`}
                />
                <span className="self-center">-</span>
                <Input
                  type="text"
                  value={
                    typeof inputValues.rpm[1] === "number"
                      ? formatNumber(inputValues.rpm[1])
                      : inputValues.rpm[1].toString()
                  }
                  onChange={(e) => handleInputChange("rpm", 1, e.target.value)}
                  onFocus={() => handleInputFocus("rpm")}
                  onBlur={() => handleInputBlurWithDelay("rpm")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInputBlur("rpm");
                      setActiveInput(null);
                    }
                  }}
                  className={`w-24 ${inputErrors.rpm ? "border-red-500" : ""}`}
                />
              </div>
              {inputErrors.rpm && (
                <span className="text-xs text-red-500">{inputErrors.rpm}</span>
              )}
              <AnimatePresence>
                {activeInput === "rpm" && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleInputBlur("rpm");
                      setActiveInput(null);
                    }}
                    className="self-start px-3 py-1 text-xs bg-primary text-white rounded-full shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Filtruj
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Analogicznie dla średnicy wału */}
          {/*<div>
            <label className="font-medium block mb-2">Średnica wału (mm)</label>
            <div
              className="relative"
              onMouseMove={(e) =>
                handleSliderHover(
                  e,
                  'shaftDiameter',
                  ranges.shaftDiameter[0],
                  ranges.shaftDiameter[1]
                )
              }
              onMouseLeave={handleSliderLeave}
            >
              <Slider
                value={activeFilters.shaftDiameter}
                onValueChange={(val) => handleChange('shaftDiameter', val)}
                onValueCommit={(val) => handleSliderCommitted('shaftDiameter', val)}
                min={ranges.shaftDiameter[0]}
                max={ranges.shaftDiameter[1]}
                step={1}
              />
              <AnimatePresence>
                {hoveredValue && hoveredValue.field === 'shaftDiameter' && (
                  <SliderValueTooltip value={hoveredValue.value} x={hoveredValue.x} unit=" mm" />
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                value={inputValues.shaftDiameter[0]}
                onChange={(e) => handleInputChange('shaftDiameter', 0, e.target.value)}
                onBlur={() => handleInputBlur('shaftDiameter')}
                className="w-24"
                step="1"
                min={ranges.shaftDiameter[0]}
                max={ranges.shaftDiameter[1]}
              />
              <span className="self-center">-</span>
              <Input
                type="number"
                value={inputValues.shaftDiameter[1]}
                onChange={(e) => handleInputChange('shaftDiameter', 1, e.target.value)}
                onBlur={() => handleInputBlur('shaftDiameter')}
                className="w-24"
                step="1"
                min="0"
                max="100"
              />
              <span className="self-center">mm</span>
            </div>
          </div>*/}

          <div>
            <label className="font-medium block mb-2">Producent</label>
            <select
              value={activeFilters.manufacturer}
              onChange={(e) => {
                trackEvent("category_filter_applied", {
                  location: getPageLocation(),
                  filter_type: "manufacturer",
                  filter_value: e.target.value,
                  category: categoryId,
                  url: window.location.pathname,
                  timestamp: new Date().toISOString(),
                });
                handleChange("manufacturer", e.target.value);
                handleSliderCommitted("manufacturer", e.target.value);
              }}
              className="w-full p-2 border rounded "
            >
              <option value="">Wszyscy producenci</option>
              {categoryManufacturers
                .filter(
                  (manufacturer) =>
                    !shouldExcludeManufacturer(manufacturer.name)
                )
                .map((manufacturer) => (
                  <option key={manufacturer.name} value={manufacturer.name}>
                    {manufacturer.name} ({manufacturer.count})
                  </option>
                ))}
            </select>
          </div>

          {/*
          <div>
            <label className="font-medium block mb-2">Średnica zamka kołnierza (mm)</label>
            <Slider
              value={activeFilters.sleeveDiameter}
              onValueChange={(val) => handleChange('sleeveDiameter', val)}
              onValueCommit={(val) => handleSliderCommitted('sleeveDiameter', val)}
              min={0}
              max={100}
              step={1}
            />
            <div className="flex justify-between mt-1 text-sm">
              <span>{activeFilters.sleeveDiameter[0]} mm</span>
              <span>{activeFilters.sleeveDiameter[1]} mm</span>
            </div>
          </div>*/}

          {/*<div>
            <label className="font-medium block mb-2">Wielkość mechaniczna</label>
            <Slider
              value={activeFilters.mechanicalSize}
              onValueChange={(val) => handleChange('mechanicalSize', val)}
              onValueCommit={(val) => handleSliderCommitted('mechanicalSize', val)}
              min={0}
              max={500}
              step={10}
            />
            <div className="flex justify-between mt-1 text-sm">
              <span>{activeFilters.mechanicalSize[0]}</span>
              <span>{activeFilters.mechanicalSize[1]}</span>
            </div>
          </div>*/}
          <div>
            <label className="font-medium block mb-2">Stan</label>
            <div className="space-y-2">
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Checkbox
                  id="new"
                  checked={activeFilters.condition === "nowy"}
                  onCheckedChange={(checked) => {
                    const value = checked ? "nowy" : "";
                    handleChange("condition", value);
                    handleSliderCommitted("condition", value);
                  }}
                />
                <label htmlFor="new" className="ml-2">
                  Nowy
                </label>
              </motion.div>
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Checkbox
                  id="used"
                  checked={activeFilters.condition === "uzywany"}
                  onCheckedChange={(checked) => {
                    const value = checked ? "uzywany" : "";
                    handleChange("condition", value);
                    handleSliderCommitted("condition", value);
                  }}
                />
                <label htmlFor="used" className="ml-2">
                  Używany
                </label>
              </motion.div>
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Checkbox
                  id="unused"
                  checked={activeFilters.condition === "nieuzywany"}
                  onCheckedChange={(checked) => {
                    const value = checked ? "nieuzywany" : "";
                    handleChange("condition", value);
                    handleSliderCommitted("condition", value);
                  }}
                />
                <label htmlFor="unused" className="ml-2">
                  Nieużywany
                </label>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend/src/components/search/SearchFilters.tsx
"use client";
import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SearchFiltersProps {
  onFilterChange: (filterType: string, value: any) => void;
  currentFilters: {
    powerMin?: number;
    powerMax?: number;
    rpmMin?: number;
    rpmMax?: number;
    shaftDiameterMin?: number;
    shaftDiameterMax?: number;
    manufacturer?: string;
    condition?: string;
    category?: string;
  };
  loading?: boolean;
  searchResults: any[];
  onReset: () => void;
}

interface SliderValueTooltipProps {
  value: number;
  x: number;
  unit?: string;
}

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

const RPM_RANGES = {
  700: [601, 800],
  900: [801, 1000],
  1400: [1301, 1500],
  2900: [2501, 2980],
};

const PREDEFINED_RPM_VALUES = [700, 900, 1400, 2900];

export function SearchFilters({
  onFilterChange,
  currentFilters,
  loading,
  searchResults,
  onReset,
}: SearchFiltersProps) {
  const { trackEvent, getPageLocation } = useAnalytics();
  const [hoveredValue, setHoveredValue] = useState<{
    field: string;
    value: number;
    x: number;
  } | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    power: true,
    rpm: true,
    manufacturer: true,
    condition: true,
    category: true,
  });

  // Zakresy domyślne
  const [ranges, setRanges] = useState({
    power: [0.03, 300],
    rpm: [0, 3000],
    shaftDiameter: [0, 100],
  });

  // Stan lokalny dla inputów
  const [inputValues, setInputValues] = useState<{
    power: [string, string];
    rpm: [string, string];
  }>({
    power: ["", ""],
    rpm: ["", ""],
  });

  const [activeInput, setActiveInput] = useState<"power" | "rpm" | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  // Pobierz unikalne wartości z wyników wyszukiwania
  const getUniqueValues = () => {
    const manufacturers = new Set<string>();
    const categories = new Map<string, { name: string; count: number }>();

    searchResults.forEach((product) => {
      if (product.manufacturer) {
        manufacturers.add(product.manufacturer);
      }

      product.categories?.forEach((cat: any) => {
        const current = categories.get(cat.slug) || {
          name: cat.name,
          count: 0,
        };
        categories.set(cat.slug, {
          name: cat.name,
          count: current.count + 1,
        });
      });
    });

    return {
      manufacturers: Array.from(manufacturers).sort(),
      categories: Array.from(categories.entries()).map(([slug, data]) => ({
        slug,
        name: data.name,
        count: data.count,
      })),
    };
  };

  const { manufacturers, categories } = getUniqueValues();

  // Aktualizuj zakresy na podstawie wyników wyszukiwania
  useEffect(() => {
    if (searchResults.length > 0) {
      const powers = searchResults
        .map((p) => {
          const powerValue = p.power?.value || "0";
          const cleanValue = powerValue.replace(" kW", "").replace(",", ".");
          return parseFloat(cleanValue.split("-")[0]) || 0;
        })
        .filter((v) => v > 0);

      const rpms = searchResults
        .map((p) => {
          const rpmValue = p.rpm?.value || "0";
          const cleanValue = rpmValue.replace(/[^\d.,]/g, "").replace(",", ".");
          return parseFloat(cleanValue.split("/")[0]) || 0;
        })
        .filter((v) => v > 0);

      if (powers.length > 0) {
        const minPower = Math.min(...powers);
        const maxPower = Math.max(...powers);
        setRanges((prev) => ({
          ...prev,
          power: [minPower, maxPower],
        }));
      }

      if (rpms.length > 0) {
        const minRpm = Math.min(...rpms);
        const maxRpm = Math.max(...rpms);
        setRanges((prev) => ({
          ...prev,
          rpm: [minRpm, maxRpm],
        }));
      }
    }
  }, [searchResults]);

  // Synchronizuj inputy z filtrami lub zakresami
  useEffect(() => {
    setInputValues({
      power: [
        (currentFilters.powerMin ?? ranges.power[0]).toString(),
        (currentFilters.powerMax ?? ranges.power[1]).toString(),
      ],
      rpm: [
        (currentFilters.rpmMin ?? ranges.rpm[0]).toString(),
        (currentFilters.rpmMax ?? ranges.rpm[1]).toString(),
      ],
    });
  }, [
    currentFilters.powerMin,
    currentFilters.powerMax,
    currentFilters.rpmMin,
    currentFilters.rpmMax,
    ranges,
  ]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSliderHover = (
    e: React.MouseEvent<HTMLDivElement>,
    field: string,
    min: number,
    max: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const value = min + (max - min) * percentage;

    setHoveredValue({ field, value, x });
  };

  const handleInputChange = (
    field: "power" | "rpm",
    index: number,
    value: string
  ) => {
    const formattedValue = value.replace(".", ",");
    const numValue = formattedValue.replace(/[^\d,]/g, "");

    const currentValues = [...inputValues[field]] as [string, string];
    currentValues[index] = numValue;

    setInputValues((prev) => ({
      ...prev,
      [field]: currentValues,
    }));
  };

  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(",", "."));
  };

  const handleInputBlur = (field: "power" | "rpm") => {
    const currentValues = inputValues[field];

    if (currentValues[0] === "" || currentValues[1] === "") {
      setInputErrors({
        ...inputErrors,
        [field]: "Oba pola muszą być wypełnione",
      });
      return;
    }

    const val1 = parseNumber(currentValues[0]);
    const val2 = parseNumber(currentValues[1]);

    if (isNaN(val1) || isNaN(val2)) {
      setInputErrors({
        ...inputErrors,
        [field]: "Nieprawidłowy format liczby",
      });
      return;
    }

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

    trackEvent("search_filter_applied", {
      location: getPageLocation(),
      filter_type: field,
      filter_value: JSON.stringify(validatedValues),
      timestamp: new Date().toISOString(),
    });

    if (field === "power") {
      onFilterChange("powerMin", validatedValues[0]);
      onFilterChange("powerMax", validatedValues[1]);
    } else if (field === "rpm") {
      onFilterChange("rpmMin", validatedValues[0]);
      onFilterChange("rpmMax", validatedValues[1]);
    }
  };

  const handleRpmButtonClick = (rpm: number) => {
    const range = RPM_RANGES[rpm as keyof typeof RPM_RANGES];

    const isActive =
      currentFilters.rpmMin === range[0] && currentFilters.rpmMax === range[1];

    if (isActive) {
      // Reset do pełnego zakresu
      onFilterChange("rpmMin", ranges.rpm[0]);
      onFilterChange("rpmMax", ranges.rpm[1]);
    } else {
      // Ustaw nowy zakres
      onFilterChange("rpmMin", range[0]);
      onFilterChange("rpmMax", range[1]);
    }

    trackEvent("search_rpm_button_click", {
      location: getPageLocation(),
      rpm_value: rpm,
      rpm_range: range,
      action: isActive ? "reset" : "set",
      timestamp: new Date().toISOString(),
    });
  };

  const isRpmButtonActive = (rpm: number) => {
    const range = RPM_RANGES[rpm as keyof typeof RPM_RANGES];
    return (
      currentFilters.rpmMin === range[0] && currentFilters.rpmMax === range[1]
    );
  };

  const hasActiveFilters = () => {
    const hasRangeFilters =
      (currentFilters.powerMin !== undefined &&
        currentFilters.powerMin !== ranges.power[0]) ||
      (currentFilters.powerMax !== undefined &&
        currentFilters.powerMax !== ranges.power[1]) ||
      (currentFilters.rpmMin !== undefined &&
        currentFilters.rpmMin !== ranges.rpm[0]) ||
      (currentFilters.rpmMax !== undefined &&
        currentFilters.rpmMax !== ranges.rpm[1]);

    return !!(
      hasRangeFilters ||
      currentFilters.manufacturer ||
      currentFilters.condition ||
      currentFilters.category
    );
  };

  const formatDisplayValue = (
    value: string | number,
    isFloat: boolean = true
  ): string => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "";
    return isFloat
      ? numValue.toFixed(1).replace(".", ",")
      : Math.round(numValue).toString();
  };

  // Funkcja do obsługi zmiany sliderów
  const handleSliderChange = (field: "power" | "rpm", values: number[]) => {
    // Aktualizuj inputy
    setInputValues((prev) => ({
      ...prev,
      [field]: [values[0].toString(), values[1].toString()],
    }));

    // Natychmiast aktualizuj filtry
    if (field === "power") {
      onFilterChange("powerMin", values[0]);
      onFilterChange("powerMax", values[1]);
    } else if (field === "rpm") {
      onFilterChange("rpmMin", values[0]);
      onFilterChange("rpmMax", values[1]);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filtrowanie</h3>
        {hasActiveFilters() && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReset}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors duration-200"
          >
            Usuń filtry
          </motion.button>
        )}
      </div>

      <div
        className={`space-y-6 ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {/* Kategorie */}
        {categories.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("category")}
              className="w-full flex items-center justify-between font-medium mb-2 hover:text-primary transition-colors"
            >
              <span>Kategoria</span>
              {expandedSections.category ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.category && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {categories.map((category) => (
                      <motion.div
                        key={category.slug}
                        className="flex items-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Checkbox
                          id={`category-${category.slug}`}
                          checked={currentFilters.category === category.slug}
                          onCheckedChange={(checked) => {
                            onFilterChange(
                              "category",
                              checked ? category.slug : ""
                            );
                          }}
                        />
                        <label
                          htmlFor={`category-${category.slug}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {category.name} ({category.count})
                        </label>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Moc */}
        <div>
          <button
            onClick={() => toggleSection("power")}
            className="w-full flex items-center justify-between font-medium mb-2 hover:text-primary transition-colors"
          >
            <span>Przedział mocy (kW)</span>
            {expandedSections.power ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.power && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <div
                    id="slider-power"
                    className="relative mb-4"
                    onMouseMove={(e) =>
                      handleSliderHover(
                        e,
                        "power",
                        ranges.power[0],
                        ranges.power[1]
                      )
                    }
                    onMouseLeave={() => setHoveredValue(null)}
                    style={{ padding: "0.2rem 0" }}
                  >
                    <Slider
                      value={[
                        currentFilters.powerMin ?? ranges.power[0],
                        currentFilters.powerMax ?? ranges.power[1],
                      ]}
                      onValueChange={(val: number[]) => {
                        setInputValues((prev) => ({
                          ...prev,
                          power: [val[0].toString(), val[1].toString()],
                        }));
                      }}
                      onValueCommit={(val: number[]) => {
                        handleSliderChange("power", val);
                      }}
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
                      <Input
                        type="text"
                        value={formatDisplayValue(inputValues.power[0], true)}
                        onChange={(e) =>
                          handleInputChange("power", 0, e.target.value)
                        }
                        onFocus={() => setActiveInput("power")}
                        onBlur={() => {
                          setTimeout(() => {
                            if (activeInput === "power") {
                              setActiveInput(null);
                            }
                          }, 200);
                        }}
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
                      <span className="self-center">-</span>
                      <Input
                        type="text"
                        value={formatDisplayValue(inputValues.power[1], true)}
                        onChange={(e) =>
                          handleInputChange("power", 1, e.target.value)
                        }
                        onFocus={() => setActiveInput("power")}
                        onBlur={() => {
                          setTimeout(() => {
                            if (activeInput === "power") {
                              setActiveInput(null);
                            }
                          }, 200);
                        }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Obroty */}
        <div>
          <button
            onClick={() => toggleSection("rpm")}
            className="w-full flex items-center justify-between font-medium mb-2 hover:text-primary transition-colors"
          >
            <span>Przedział obrotów (obr./min)</span>
            {expandedSections.rpm ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.rpm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  {/* Przyciski szybkiego wyboru RPM */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {PREDEFINED_RPM_VALUES.map((rpm) => (
                      <motion.button
                        key={rpm}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRpmButtonClick(rpm)}
                        className={`px-2 py-1.5 text-sm rounded-full border transition-colors
                          ${
                            isRpmButtonActive(rpm)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-gray-300 hover:border-primary"
                          }`}
                      >
                        {rpm} obr./min
                      </motion.button>
                    ))}
                  </div>

                  <div
                    className="relative mb-4"
                    onMouseMove={(e) =>
                      handleSliderHover(e, "rpm", ranges.rpm[0], ranges.rpm[1])
                    }
                    onMouseLeave={() => setHoveredValue(null)}
                  >
                    <Slider
                      value={[
                        currentFilters.rpmMin ?? ranges.rpm[0],
                        currentFilters.rpmMax ?? ranges.rpm[1],
                      ]}
                      onValueChange={(val: number[]) => {
                        setInputValues((prev) => ({
                          ...prev,
                          rpm: [val[0].toString(), val[1].toString()],
                        }));
                      }}
                      onValueCommit={(val: number[]) => {
                        handleSliderChange("rpm", val);
                      }}
                      min={ranges.rpm[0]}
                      max={ranges.rpm[1]}
                      step={10}
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

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={formatDisplayValue(inputValues.rpm[0], false)}
                        onChange={(e) =>
                          handleInputChange("rpm", 0, e.target.value)
                        }
                        onFocus={() => setActiveInput("rpm")}
                        onBlur={() => {
                          setTimeout(() => {
                            if (activeInput === "rpm") {
                              setActiveInput(null);
                            }
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleInputBlur("rpm");
                            setActiveInput(null);
                          }
                        }}
                        className={`w-24 ${
                          inputErrors.rpm ? "border-red-500" : ""
                        }`}
                      />
                      <span className="self-center">-</span>
                      <Input
                        type="text"
                        value={formatDisplayValue(inputValues.rpm[1], false)}
                        onChange={(e) =>
                          handleInputChange("rpm", 1, e.target.value)
                        }
                        onFocus={() => setActiveInput("rpm")}
                        onBlur={() => {
                          setTimeout(() => {
                            if (activeInput === "rpm") {
                              setActiveInput(null);
                            }
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleInputBlur("rpm");
                            setActiveInput(null);
                          }
                        }}
                        className={`w-24 ${
                          inputErrors.rpm ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {inputErrors.rpm && (
                      <span className="text-xs text-red-500">
                        {inputErrors.rpm}
                      </span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Producent */}
        {manufacturers.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("manufacturer")}
              className="w-full flex items-center justify-between font-medium mb-2 hover:text-primary transition-colors"
            >
              <span>Producent</span>
              {expandedSections.manufacturer ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.manufacturer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <select
                    value={currentFilters.manufacturer || ""}
                    onChange={(e) => {
                      trackEvent("search_filter_applied", {
                        location: getPageLocation(),
                        filter_type: "manufacturer",
                        filter_value: e.target.value,
                        timestamp: new Date().toISOString(),
                      });
                      onFilterChange("manufacturer", e.target.value);
                    }}
                    className="w-full p-2 border rounded mt-2"
                  >
                    <option value="">Wszyscy producenci</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Stan */}
        <div>
          <button
            onClick={() => toggleSection("condition")}
            className="w-full flex items-center justify-between font-medium mb-2 hover:text-primary transition-colors"
          >
            <span>Stan</span>
            {expandedSections.condition ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.condition && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2">
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Checkbox
                      id="new"
                      checked={currentFilters.condition === "nowy"}
                      onCheckedChange={(checked) => {
                        onFilterChange("condition", checked ? "nowy" : "");
                      }}
                    />
                    <label
                      htmlFor="new"
                      className="ml-2 text-sm cursor-pointer"
                    >
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
                      checked={currentFilters.condition === "uzywany"}
                      onCheckedChange={(checked) => {
                        onFilterChange("condition", checked ? "uzywany" : "");
                      }}
                    />
                    <label
                      htmlFor="used"
                      className="ml-2 text-sm cursor-pointer"
                    >
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
                      checked={currentFilters.condition === "nieuzywany"}
                      onCheckedChange={(checked) => {
                        onFilterChange(
                          "condition",
                          checked ? "nieuzywany" : ""
                        );
                      }}
                    />
                    <label
                      htmlFor="unused"
                      className="ml-2 text-sm cursor-pointer"
                    >
                      Nieużywany
                    </label>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

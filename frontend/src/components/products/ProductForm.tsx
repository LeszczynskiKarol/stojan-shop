// frontend/src/components/products/ProductForm.tsx
"use client";
import React from "react";
import { ICategory } from "@/types/category.types";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { PDFUpload } from "@/components/shared/PDFUpload";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { IProduct } from "@/types/product.types";
import { GenerateDescriptionModal } from "./GenerateDescriptionModal";
import Image from "next/image";
import { useManufacturerStore } from "@/store/manufacturerStore";
import { X } from "lucide-react";
import { IManufacturer } from "@/types/manufacturer.types";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductFormData extends Omit<IProduct, "categories"> {
  mainCategory?: string;
  subCategory?: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  isUploadingImages?: boolean;
}

export function ProductForm({
  onSubmit,
  initialData,
  isUploadingImages = false,
}: ProductFormProps) {
  const [selectedGeneralCategory, setSelectedGeneralCategory] =
    useState<string>("");
  const [selectedPowerCategories, setSelectedPowerCategories] = useState<
    string[]
  >([]);
  const { toast } = useToast();
  const [mainImage, setMainImage] = useState(initialData?.mainImage || "");
  const [shouldSaveToStorage, setShouldSaveToStorage] = useState(true);
  const [customParameters, setCustomParameters] = useState<
    { name: string; value: string }[]
  >(initialData?.customParameters || []);
  const [galleryImages, setGalleryImages] = useState(
    initialData?.galleryImages || []
  );
  const [manufacturers, setManufacturers] = useState<IManufacturer[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerateDescriptionModalOpen, setIsGenerateDescriptionModalOpen] =
    useState(false);

  const FORM_STORAGE_KEY = "product_form_draft";

  const includedCategoryWords = [
    "trójfazowe",
    "jednofazowe",
    "dwubiegow",
    "motoreduktory",
    "akcesoria",
    "pierścieniowe",
    "wentylator",
    "hamul",
    "pompy",
  ];

  const shouldShowCategory = (categoryName: string): boolean => {
    return includedCategoryWords.some((word) =>
      categoryName.toLowerCase().includes(word.toLowerCase())
    );
  };

  const handleDataSheetUpload = async (files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/uploads/datasheets`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data.urls) {
        // Dodaj nowe URLe do istniejących dataSheets
        const currentDataSheets = watch("dataSheets") || [];
        setValue("dataSheets", [...currentDataSheets, ...data.data.urls]);
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać karty katalogowej",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDataSheet = (urlToRemove: string) => {
    const currentDataSheets = watch("dataSheets") || [];
    setValue(
      "dataSheets",
      currentDataSheets.filter((url) => url !== urlToRemove)
    );
  };

  const handleAddParameter = () => {
    setCustomParameters([...customParameters, { name: "", value: "" }]);
  };

  const handleParameterChange = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const newParameters = [...customParameters];
    newParameters[index][field] = value;
    setCustomParameters(newParameters);
    setValue("customParameters", newParameters);
  };

  const handleRemoveParameter = (index: number) => {
    const newParameters = customParameters.filter((_, i) => i !== index);
    setCustomParameters(newParameters);
    setValue("customParameters", newParameters);
  };

  const saveFormToStorage = (data: Partial<ProductFormData>) => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
  };

  const formatValue = (value: string) => {
    return value.replace(/\./g, ",");
  };

  // Funkcja do pobierania danych z localStorage
  const getFormFromStorage = () => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  // Funkcja do czyszczenia localStorage
  const clearFormStorage = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const [technicalDetailsModal, setTechnicalDetailsModal] = useState<{
    isOpen: boolean;
    content: string;
  }>({
    isOpen: false,
    content: "",
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<ProductFormData>({
    mode: "onChange",
    defaultValues: {
      ...initialData,
      ...(getFormFromStorage() || {}),
      marketplaces: initialData?.marketplaces ||
        getFormFromStorage()?.marketplaces || {
          ownStore: {
            active: true,
            price: 0,
          },
        },
      power: initialData?.power ||
        getFormFromStorage()?.power || { value: "", range: "" },
      rpm: initialData?.rpm ||
        getFormFromStorage()?.rpm || { value: "", range: "" },
      condition:
        initialData?.condition || getFormFromStorage()?.condition || "uzywany",
      images: initialData?.images || getFormFromStorage()?.images || [],
      dataSheets:
        initialData?.dataSheets || getFormFromStorage()?.dataSheets || [], // Upewnij się, że to jest tablica
      seo: initialData?.seo ||
        getFormFromStorage()?.seo || {
          title: "",
          description: "",
          keywords: [],
        },
      startType:
        initialData?.startType === undefined ? null : initialData?.startType,
    },
  });

  const formValues = watch();

  useEffect(() => {
    // Zapisujemy do localStorage przy każdej zmianie
    const formData = {
      ...formValues,
      mainImage,
      galleryImages,
    };
    saveFormToStorage(formData);
  }, [formValues, mainImage, galleryImages]);

  const formatContentToHtml = (text: string): string => {
    return text
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
  };

  useEffect(() => {
    if (!shouldSaveToStorage) return;

    // Zapisujemy do localStorage przy każdej zmianie
    const formData = {
      ...formValues,
      mainImage,
      galleryImages,
    };
    saveFormToStorage(formData);
  }, [formValues, mainImage, galleryImages, shouldSaveToStorage]);

  const handleMainImageUpload = async (files: FileList) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      if (files.length === 0) return;

      const formData = new FormData();
      formData.append("images", files[0]);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/uploads/products`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data.urls) {
        setMainImage(data.data.urls[0]);
        const currentForm = getFormFromStorage();
        saveFormToStorage({
          ...currentForm,
          mainImage: data.data.urls[0],
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać zdjęcia głównego",
        variant: "destructive",
      });
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${baseUrl}/api/uploads/products`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data.urls) {
        const newGalleryImages = [...galleryImages, ...data.data.urls].slice(
          0,
          3
        );
        setGalleryImages(newGalleryImages);
        const currentForm = getFormFromStorage();
        saveFormToStorage({
          ...currentForm,
          galleryImages: newGalleryImages,
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać zdjęć do galerii",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories");
        const data = await response.json();
        setCategories(data.data || []);
      } catch (error) {
        console.error("Błąd podczas pobierania kategorii:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchManufacturers = async () => {
      const { fetchManufacturers } = useManufacturerStore.getState();
      await fetchManufacturers();
      const manufacturersList = useManufacturerStore.getState().manufacturers;
      setManufacturers(manufacturersList);
    };

    fetchManufacturers();
  }, []);

  useEffect(() => {
    const blockSaving = sessionStorage.getItem("block_form_saving");
    if (blockSaving) {
      setShouldSaveToStorage(false);
      sessionStorage.removeItem("block_form_saving");
      localStorage.removeItem("product_form_draft");
    }
  }, []);

  return (
    <form
      onSubmit={handleSubmit((data) => {
        setShouldSaveToStorage(false);

        // Walidacja przed wysłaniem
        const errors = [];
        if (!data.name) errors.push("nazwa");
        if (!data.categories || data.categories.length === 0) {
          errors.push("kategoria główna");
        }
        if (!data.marketplaces?.ownStore?.price) errors.push("cena");
        const price = Number(data.marketplaces?.ownStore?.price);
        if (isNaN(price) || price <= 0) {
          toast({
            title: "Błąd walidacji",
            description: "Cena musi być większa od 0",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
        if (!data.weight) errors.push("waga");
        if (data.weight <= 0) {
          toast({
            title: "Błąd walidacji",
            description: "Waga musi być większa od 0",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
        if (data.stock === undefined || data.stock === null)
          errors.push("stan magazynowy");

        if (errors.length > 0) {
          toast({
            title: "Błąd walidacji",
            description: `Wymagane pola: ${errors.join(", ")}`,
            variant: "destructive",
            duration: 5000,
          });
          return;
        }

        // Formatowanie wartości mocy i obrotów
        const finalData = {
          ...data,
          mainImage,
          galleryImages,
          hasBreak: Boolean(data.hasBreak),
          hasForeignCooling: Boolean(data.hasForeignCooling),
          hasEx: Boolean(data.hasEx),
          power: {
            ...data.power,
            value: formatValue(data.power?.value || ""),
          },
          rpm: {
            ...data.rpm,
            value: formatValue(data.rpm?.value || ""),
          },
        };

        clearFormStorage();
        onSubmit(finalData);
      })}
    >
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa produktu</label>
            <Input
              {...register("name", {
                required: "Nazwa produktu jest wymagana",
              })}
            />
            {isSubmitted && errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Producent</label>
            <div className="relative">
              <input
                {...register("manufacturer")}
                list="manufacturers"
                placeholder="Wpisz lub wybierz producenta"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="manufacturers">
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Kategoria główna (wymagane)
            </label>
            <select
              value={selectedGeneralCategory}
              onChange={(e) => {
                setSelectedGeneralCategory(e.target.value);
                // Aktualizuj categories w formie
                const allSelected = [...selectedPowerCategories];
                if (e.target.value) allSelected.push(e.target.value);

                const categoriesData = allSelected
                  .map((slug) => {
                    const cat = categories.find((c) => c.slug === slug);
                    return cat
                      ? { id: cat.slug, name: cat.name, slug: cat.slug }
                      : null;
                  })
                  .filter(Boolean) as {
                  id: string;
                  name: string;
                  slug: string;
                }[];

                setValue("categories", categoriesData);
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Wybierz kategorię główną</option>
              {categories
                .filter((cat) => !cat.name.includes("kW") && !cat.parent)
                .map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Podkategorie dla silników elektrycznych 
              {watch('mainCategory') === 'silniki-elektryczne' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Podkategoria</label>
                  <select
                    {...register('subCategory')}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Wybierz podkategorię</option>
                    {categories
                      .filter((cat) => cat.parent && cat.parent.slug === watch('mainCategory'))
                      .map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}*/}

          <div className="space-y-2">
            <label className="text-sm font-medium">Stan</label>
            <select
              {...register("condition")}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="uzywany">Używany</option>
              <option value="nowy">Nowy</option>
              <option value="nieuzywany">Nieużywany</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Moc [kW]</label>
            <Input
              {...register("power.value")}
              type="text"
              onChange={(e) => {
                const formatted = e.target.value
                  .replace(/\./g, ",")
                  .replace(/\//g, "-");
                setValue("power.value", formatted);
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Obroty [obr./min]</label>
            <Input
              {...register("rpm.value")}
              type="text"
              onChange={(e) => {
                const formatted = e.target.value.replace(/\./g, ",");
                setValue("rpm.value", formatted);
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Waga [kg]</label>
            <Input
              {...register("weight", {
                required: "Waga jest wymagana",
                min: { value: 0.1, message: "Waga musi być większa od 0" },
              })}
              type="number"
              step="0.1"
            />
            {errors.weight && (
              <span className="text-red-500 text-sm">
                {errors.weight.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Średnica wału [mm]</label>
            <Input {...register("shaftDiameter")} type="number" step="0.1" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Średnica tulei [mm]</label>
            <Input {...register("sleeveDiameter")} type="number" step="0.1" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Średnica zamka kołnierza [mm]
            </label>
            <Input {...register("flangeSize")} type="number" step="0.1" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Średnica podziałowa otworów [mm]
            </label>
            <Input {...register("flangeBoltCircle")} type="number" step="0.1" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Wielkość mechaniczna</label>
            <Input {...register("mechanicalSize")} type="number" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rozstaw łap [mm x mm]</label>
            <div className="flex gap-2">
              <Input
                {...register("legSpacing")}
                type="text"
                placeholder="np. 100 x 100"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = watch("legSpacing") || "";
                  setValue("legSpacing", current + " x ");
                }}
                className="px-3"
              >
                x
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Format: szerokość x długość
            </p>
          </div>
          <div className="space-y-2 mt-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("hasBreak")}
                id="hasBreak"
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="hasBreak" className="text-sm font-medium">
                Hamulec
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("hasEx")}
                id="hasEx"
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="hasEx" className="text-sm font-medium">
                Wykonanie Ex (przeciwwybuchowe)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("hasForeignCooling")}
                id="hasForeignCooling"
                className="w-4 h-4 rounded border-gray-300"
              />
              <label
                htmlFor="hasForeignCooling"
                className="text-sm font-medium"
              >
                Obce chłodzenie
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Typ rozruchu</label>
            <select
              {...register("startType")}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Brak określonego typu</option>
              <option value="bezpośredni - 220/380V">
                Bezpośredni - 220/380V
              </option>
              <option value="bezpośredni - 230/400V">
                Bezpośredni - 230/400V
              </option>
              <option value="gwiazda-trójkąt - 380/660V">
                Gwiazda-trójkąt - 380/660V
              </option>
              <option value="gwiazda-trójkąt - 400/690V">
                Gwiazda-trójkąt - 400/690V
              </option>
              <option value="gwiazda-trójkąt - 380V△">
                Gwiazda-trójkąt - 380V△
              </option>
              <option value="gwiazda-trójkąt - 400V△">
                Gwiazda-trójkąt - 400V△
              </option>
            </select>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {/* Zdjęcie główne */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Zdjęcie główne</label>
            <div className="relative group">
              {mainImage ? (
                <div className="relative">
                  <Image
                    src={mainImage}
                    alt="Zdjęcie główne"
                    width={200}
                    height={200}
                    className="w-40 h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => setMainImage("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <ImageUpload onUpload={handleMainImageUpload} />
              )}
            </div>
          </div>

          {/* Galeria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Galeria zdjęć (max. 3)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map((url, index) => (
                <div key={url} className="relative group">
                  <Image
                    src={url}
                    alt={`Zdjęcie ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      setGalleryImages((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {galleryImages.length < 3 && (
                <ImageUpload onUpload={handleGalleryUpload} />
              )}
            </div>
          </div>
        </div>
      </Card>
      <Accordion type="single" defaultValue="ownstore" className="w-full">
        <AccordionItem value="ownstore">
          <AccordionTrigger>Sklep własny</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-8">
              {" "}
              {/* Zwiększamy odstęp między sekcjami */}
              {/* Sekcja dodatkowych parametrów */}
              <div className="space-y-4 border rounded-lg p-6 ">
                {/* Dodajemy ramkę i tło */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Dodatkowe parametry</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddParameter}
                  >
                    Dodaj parametr
                  </Button>
                </div>
                <div className="space-y-3">
                  {" "}
                  {/* Zmniejszamy odstęp między parametrami */}
                  {customParameters.map((param, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[2fr,2fr,1fr] gap-4"
                    >
                      <Input
                        placeholder="Nazwa parametru"
                        value={param.name}
                        onChange={(e) =>
                          handleParameterChange(index, "name", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Wartość"
                        value={param.value}
                        onChange={(e) =>
                          handleParameterChange(index, "value", e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveParameter(index)}
                      >
                        Usuń
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Sekcja ceny */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cena w sklepie [PLN]
                  </label>
                  <Input
                    {...register("marketplaces.ownStore.price", {
                      required: "Cena jest wymagana",
                      min: {
                        value: 0.01,
                        message: "Cena musi być większa od 0",
                      },
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                  />
                  {errors.marketplaces?.ownStore?.price && (
                    <span className="text-red-500 text-sm">
                      {errors.marketplaces.ownStore.price.message}
                    </span>
                  )}
                </div>
              </div>
              {/* Opis produktu */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Opis produktu</label>
                <div className="flex justify-start mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGenerateDescriptionModalOpen(true)}
                  >
                    Wygeneruj opis
                  </Button>
                </div>
                <Textarea {...register("description")} rows={10} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stan magazynowy</label>
                <Input
                  {...register("stock", {
                    required: "Stan magazynowy jest wymagany",
                    min: {
                      value: 0,
                      message: "Stan magazynowy nie może być ujemny",
                    },
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="0"
                />
                {errors.stock && (
                  <span className="text-red-500 text-sm">
                    {errors.stock.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Karta katalogowa */}
                <div>
                  <Label>Karty katalogowe (PDF)</Label>
                  <PDFUpload
                    onUpload={handleDataSheetUpload}
                    currentUrls={watch("dataSheets") || []}
                    onRemove={handleRemoveDataSheet}
                    multiple={true}
                  />
                </div>

                {/* Dokumentacja techniczna */}
                <div>
                  <Label>Dodatkowy opis pod parametrami</Label>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTechnicalDetailsModal({
                          isOpen: true,
                          content: watch("technicalDetails") || "",
                        });
                      }}
                    >
                      Wprowadź informacje
                    </Button>
                  </div>
                </div>

                {/* Modal do edycji szczegółów technicznych */}
                {technicalDetailsModal.isOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="rounded-lg w-full max-w-4xl flex flex-col bg-background my-4 max-h-[90vh]">
                      <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-xl font-semibold">
                          Edycja szczegółów technicznych
                        </h2>
                        <button
                          onClick={() =>
                            setTechnicalDetailsModal({
                              isOpen: false,
                              content: "",
                            })
                          }
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
                        <div className="flex flex-col h-full">
                          <label className="font-medium mb-2">
                            Edytor tekstu
                          </label>
                          <textarea
                            className="flex-1 w-full p-3 border rounded min-h-[400px] font-mono text-sm"
                            value={technicalDetailsModal.content}
                            onChange={(e) =>
                              setTechnicalDetailsModal((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                            placeholder="Wprowadź szczegóły techniczne... Każda nowa linia zostanie automatycznie zamieniona na nowy akapit."
                          />
                        </div>
                        <div className="flex flex-col h-full">
                          <label className="font-medium mb-2">
                            Podgląd HTML
                          </label>
                          <div
                            className="flex-1 w-full p-3 border rounded overflow-y-auto prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: formatContentToHtml(
                                technicalDetailsModal.content
                              ),
                            }}
                          />
                        </div>
                      </div>
                      <div className="p-4 border-t flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setTechnicalDetailsModal({
                              isOpen: false,
                              content: "",
                            })
                          }
                        >
                          Anuluj
                        </Button>
                        <Button
                          onClick={() => {
                            setValue(
                              "technicalDetails",
                              formatContentToHtml(technicalDetailsModal.content)
                            );
                            setTechnicalDetailsModal({
                              isOpen: false,
                              content: "",
                            });
                          }}
                        >
                          Zapisz
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/*<AccordionItem value="allegro">
          <AccordionTrigger>Allegro (wkrótce)</AccordionTrigger>
          <AccordionContent>
            <Card className="p-6">
              <div className="text-center text-gray-500 py-10">
                Integracja z Allegro będzie dostępna wkrótce...
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="olx">
          <AccordionTrigger>OLX (wkrótce)</AccordionTrigger>
          <AccordionContent>
            <Card className="p-6">
              <div className="text-center text-gray-500 py-10">
                Integracja z OLX będzie dostępna wkrótce...
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>*/}
      </Accordion>
      <div className="mt-6 flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearFormStorage();
            window.location.reload();
          }}
        >
          Wyczyść roboczy
        </Button>
        <Button type="submit" variant="default">
          Dodaj produkt
        </Button>
      </div>

      <GenerateDescriptionModal
        isOpen={isGenerateDescriptionModalOpen}
        onClose={() => setIsGenerateDescriptionModalOpen(false)}
        product={watch()}
        onDescriptionGenerated={(description) => {
          setValue("description", description, { shouldDirty: true });
        }}
      />
    </form>
  );
}

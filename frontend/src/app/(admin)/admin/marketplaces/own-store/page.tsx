// frontend/src/app/(admin)/admin/marketplaces/own-store/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useManufacturerStore } from "@/store/manufacturerStore";
import { SelectedProductsPanel } from "@/components/admin/SelectedProductsPanel";
import { IManufacturer } from "@/types/manufacturer.types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { BulkCategoryEditor } from "@/components/products/BulkCategoryEditor";
import { useClaudeApi } from "@/hooks/useClaudeApi";
import { useProductStore } from "@/store/productStore";
import {
  Plus,
  FileText,
  Loader2,
  Upload,
  X,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { IProduct } from "@/types/product.types";
import { useCategoryStore } from "@/store/categoryStore";

interface SortConfig {
  key: keyof IProduct | string;
  direction: "asc" | "desc";
}

const OwnStorePage = () => {
  const [generatingDescriptionId, setGeneratingDescriptionId] = useState<
    string | null
  >(null);
  const router = useRouter();
  const {
    products,
    loading,
    fetchProductsForAdmin,
    deleteProduct,
    updateProduct,
  } = useProductStore();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });
  const [showOnlyUnlinked, setShowOnlyUnlinked] = useState(false);
  const [allegroUrls, setAllegroUrls] = useState<Record<string, string>>({});
  const [loadingAllegroUrls, setLoadingAllegroUrls] = useState<
    Record<string, boolean>
  >({});
  const [allegroProductsMap, setAllegroProductsMap] = useState<
    Record<string, any>
  >({});
  const [linkingModal, setLinkingModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
    searchTerm: string;
    allegroOffers: any[];
    loading: boolean;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
    searchTerm: "",
    allegroOffers: [],
    loading: false,
  });

  const [manufacturerSearchTerm, setManufacturerSearchTerm] = useState("");
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const { categories, fetchCategories } = useCategoryStore();
  const [manufacturers, setManufacturers] = useState<IManufacturer[]>([]);
  const [customParameterModal, setCustomParameterModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    name: string;
    value: string;
  }>({
    isOpen: false,
    productId: null,
    name: "",
    value: "",
  });
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [selectedRows, setSelectedRows] = useState<string[]>(() => {
    const saved = localStorage.getItem("selectedTableRows");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearching, setIsSearching] = useState(false);
  const { generateProductDescription } = useClaudeApi();
  const [technicalDetailsModal, setTechnicalDetailsModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    content: string;
  }>({
    isOpen: false,
    productId: null,
    content: "",
  });
  const [descriptionModal, setDescriptionModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    content: string;
  }>({
    isOpen: false,
    productId: null,
    content: "",
  });
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: string;
  } | null>(null);

  const [manufacturerModal, setManufacturerModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    selectedManufacturer: string;
  }>({
    isOpen: false,
    productId: null,
    selectedManufacturer: "",
  });

  const openLinkingModal = async (product: IProduct) => {
    setLinkingModal({
      isOpen: true,
      productId: product.id!,
      productName: product.name,
      searchTerm: "",
      allegroOffers: [],
      loading: true,
    });

    try {
      // Używamy lokalnego API Route zamiast bezpośredniego zapytania do backendu
      const response = await fetch("/api/allegro/unlinked-offers");

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Odpowiedź nie jest JSON, otrzymano:", contentType);
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }

      const data = await response.json();

      if (data.success && data.data) {
        const filteredOffers = data.data.filter((offer: any) => {
          const searchLower = product.name.toLowerCase();
          const offerLower = offer.name.toLowerCase();
          return (
            offerLower.includes(searchLower) || searchLower.includes(offerLower)
          );
        });

        setLinkingModal((prev) => ({
          ...prev,
          allegroOffers: filteredOffers,
          loading: false,
        }));
      } else {
        throw new Error(data.error || "Nie udało się pobrać ofert");
      }
    } catch (error) {
      console.error("Błąd pobierania ofert:", error);
      setLinkingModal((prev) => ({
        ...prev,
        allegroOffers: [],
        loading: false,
      }));

      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy ofert z Allegro",
        variant: "destructive",
      });
    }
  };

  const linkProductToAllegro = async (allegroOfferId: string) => {
    if (!linkingModal.productId) return;

    try {
      // Używamy lokalnego API Route
      const response = await fetch(
        `/api/allegro/link-product/${linkingModal.productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ allegroOfferId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sukces",
          description: "Produkt został powiązany z ofertą Allegro",
        });

        // Odśwież listę produktów
        fetchProductsForAdmin({
          page: currentPage,
          limit: itemsPerPage,
        });

        setLinkingModal({
          isOpen: false,
          productId: null,
          productName: "",
          searchTerm: "",
          allegroOffers: [],
          loading: false,
        });
      } else {
        toast({
          title: "Błąd",
          description: data.error || "Nie udało się powiązać produktu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Błąd powiązywania:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się powiązać produktu",
        variant: "destructive",
      });
    }
  };

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
    const fetchAllegroUrls = async () => {
      const productIds = products
        .filter(
          (p) => p.id && (!allegroUrls[p.id] || !p.marketplaces?.allegro?.url)
        )
        .map((p) => p.id);

      if (productIds.length === 0) return;

      const newLoadingState = { ...loadingAllegroUrls };
      const newUrlsState = { ...allegroUrls };

      productIds.forEach((id) => {
        if (id) newLoadingState[id] = true;
      });
      setLoadingAllegroUrls(newLoadingState);

      for (const productId of productIds) {
        if (!productId) continue;

        try {
          // Najpierw sprawdź czy produkt ma bezpośredni URL
          const product = products.find((p) => p.id === productId);
          if (product?.marketplaces?.allegro?.url) {
            newUrlsState[productId] = product.marketplaces.allegro.url;
          } else {
            // Jeśli nie, pobierz z API
            const response = await fetch(
              `/api/allegroProducts/product-allegro-link/${productId}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.allegroUrl) {
                newUrlsState[productId] = data.data.allegroUrl;
              }
            }
          }
        } catch (error) {
          console.error("Błąd pobierania URL Allegro:", error);
        } finally {
          newLoadingState[productId] = false;
        }
      }

      setAllegroUrls(newUrlsState);
      setLoadingAllegroUrls(newLoadingState);
    };

    fetchAllegroUrls();
  }, [products]);

  useEffect(() => {
    const fetchAllegroProducts = async () => {
      try {
        const response = await fetch("/api/allegroProducts/admin");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Stwórz mapę wszystkich produktów Allegro
            const productMap = data.data.offers.reduce(
              (acc: Record<string, any>, product: any) => {
                if (product.id) {
                  acc[product.id] = product;
                }
                return acc;
              },
              {}
            );

            setAllegroProductsMap(productMap);
            console.log(
              "Pobrano",
              Object.keys(productMap).length,
              "produktów z Allegro"
            );
          }
        }
      } catch (error) {
        console.error("Błąd pobierania produktów z Allegro:", error);
      }
    };

    fetchAllegroProducts();
  }, []);

  const includedCategoryWords = [
    "trójfazowe",
    "jednofazowe",
    "dwubiegow",
    "motoreduktory",
    "akcesoria",
    "pierścieniowe",
    "wentylator",
    "hamul",
  ];

  useEffect(() => {
    // Automatycznie napraw powiązania przy ładowaniu strony
    if (products.length > 0 && !loading) {
      console.log("=== AUTOMATYCZNA NAPRAWA POWIĄZAŃ ===");

      // Znajdź produkty z URL Allegro, ale bez productId
      const productsToFix = products.filter(
        (p) =>
          p.marketplaces?.allegro?.url &&
          !p.marketplaces?.allegro?.productId &&
          typeof p.marketplaces?.allegro?.url === "string" &&
          p.marketplaces?.allegro?.url.includes("/oferta/") &&
          !p.marketplaces?.allegro?.url.includes("/oferta/undefined")
      );

      if (productsToFix.length > 0) {
        console.log(
          `Znaleziono ${productsToFix.length} produktów z brakującym productId`
        );

        // Napraw lokalne kopie produktów
        productsToFix.forEach((product) => {
          if (
            product.id &&
            product.marketplaces?.allegro?.url &&
            typeof product.marketplaces?.allegro?.url === "string"
          ) {
            const url = product.marketplaces.allegro.url;
            const parts = url.split("/oferta/");

            if (parts.length > 1) {
              const idPart = parts[1].split("?")[0];

              if (idPart && idPart !== "undefined") {
                console.log(
                  `Naprawiam produkt ${product.name}: dodaję productId ${idPart} na podstawie URL ${url}`
                );

                // Aktualizuj w bazie danych
                updateProduct(product.id, {
                  marketplaces: {
                    ...product.marketplaces,
                    allegro: {
                      ...product.marketplaces.allegro,
                      productId: idPart,
                      // Upewnij się, że active ma wartość logiczną
                      active: product.marketplaces.allegro.active === true,
                    },
                  },
                })
                  .then(() => {
                    console.log(
                      `✅ Zapisano productId ${idPart} dla produktu ${product.name}`
                    );
                  })
                  .catch((error) => {
                    console.error(
                      `❌ Błąd zapisywania productId dla ${product.name}:`,
                      error
                    );
                  });
              } else {
                console.log(
                  `Błędny URL dla produktu ${product.name}: ${url} - nie można wyciągnąć ID`
                );
              }
            }
          }
        });
      }
    }
  }, [products, loading, updateProduct]);

  const shouldShowCategory = (categoryName: string): boolean => {
    return includedCategoryWords.some((word) =>
      categoryName.toLowerCase().includes(word.toLowerCase())
    );
  };

  useEffect(() => {
    localStorage.setItem("selectedTableRows", JSON.stringify(selectedRows));
  }, [selectedRows]);

  useEffect(() => {
    fetchProductsForAdmin({
      page: currentPage,
      limit: itemsPerPage,
      sortField: sortConfig.key,
      sortDirection: sortConfig.direction,
      search: searchTerm,
    });
  }, [
    currentPage,
    itemsPerPage,
    fetchProductsForAdmin,
    sortConfig,
    searchTerm,
  ]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const formatContentToHtml = (text: string): string => {
    // Dzieli tekst na akapity po enterach
    return text
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
  };

  const syncSleeveDiameters = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/allegro/sync-sleeve-diameters`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "Sukces",
          description: "Pomyślnie zsynchronizowano średnice tulei",
        });
        // Odśwież listę produktów
        fetchProductsForAdmin({
          page: currentPage,
          limit: itemsPerPage,
        });
      } else {
        throw new Error("Błąd synchronizacji");
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zsynchronizować średnic tulei",
        variant: "destructive",
      });
    }
  };

  const unformatHtmlToText = (html: string): string => {
    // Usuwa tagi HTML i zamienia je na zwykły tekst z enterami
    return html.replace(/<p>/g, "").replace(/<\/p>/g, "\n").trim();
  };

  const handleCellEdit = async (
    productId: string,
    field: string,
    value: any
  ) => {
    const scrollPosition = window.scrollY;

    try {
      // Szukamy produktu po id
      const product = products.find((p) => p.id === productId);

      if (!product) {
        console.error("Nie znaleziono produktu dla ID:", productId);

        toast({
          title: "Błąd",
          description: "Nie znaleziono produktu",
          variant: "destructive",
        });
        return;
      }

      // Przygotuj dane do aktualizacji z zachowaniem obu ID
      const updateData: Partial<IProduct> = {
        id: productId,
        _id: productId,
        name: product.name,
        manufacturer: product.manufacturer,
        power: product.power,
        rpm: product.rpm,
        startType: product.startType,
        shaftDiameter: product.shaftDiameter,
        condition: product.condition,
        mechanicalSize: product.mechanicalSize,
        stock: product.stock,
        weight: product.weight,
        categories: product.categories || [], // Zawsze dołączamy kategorie
        marketplaces: {
          ...product.marketplaces,
          ownStore: {
            ...product.marketplaces.ownStore,
            price: product.marketplaces.ownStore?.price || 0,
            active: product.marketplaces.ownStore?.active || false,
            category_path: product.marketplaces.ownStore?.category_path || "",
            slug: product.marketplaces.ownStore?.slug || "",
          },
        },
      };

      // Obsłuż różne typy pól
      switch (field) {
        case "weight":
          updateData.weight = parseFloat(value);
          break;

        case "name":
          updateData[field] = value;
          updateData.condition = product.condition;
          break;
        case "condition":
          updateData.condition = value as "nowy" | "uzywany" | "nieuzywany";
          break;
        case "manufacturer":
          updateData[field] = value || ""; // usunięcie domyślnego "silnik"
          updateData.condition = product.condition;
          break;
        case "technicalDetails":
          updateData.technicalDetails = value;
          break;

        case "categories":
          const selectedCategory = categories?.find((c) => c.id === value);
          if (selectedCategory) {
            updateData.categories = [
              {
                id: selectedCategory.id,
                name: selectedCategory.name,
                slug: selectedCategory.slug,
              },
            ];
            updateData.marketplaces = {
              ...product.marketplaces,
              ownStore: {
                ...product.marketplaces.ownStore,
                active: product.marketplaces.ownStore?.active || false,
                price: product.marketplaces.ownStore?.price || 0,
                category_path: `${selectedCategory.slug}/`,
              },
            };
          }
          break;

        case "startType":
          updateData.startType = value;
          break;
        case "customParameters":
          updateData.customParameters = value;
          break;
        case "price":
          updateData.marketplaces = {
            ...product.marketplaces,
            ownStore: {
              ...product.marketplaces.ownStore,
              active: product.marketplaces.ownStore?.active || false,
              price: parseFloat(value),
              slug: product.marketplaces.ownStore?.slug,
              category_path: product.marketplaces.ownStore?.category_path,
            },
          };
          break;
        case "power":
          updateData.power = { ...product.power, value: value };
          break;
        case "rpm":
          updateData.rpm = { ...product.rpm, value: value };
          break;
        case "shaftDiameter":
        case "mechanicalSize":
        case "weight":
        case "sleeveDiameter":
        case "flangeBoltCircle":
        case "flangeSize":
          updateData[field] = parseFloat(value);
          break;
        case "legSpacing":
          updateData[field] = value.toString(); // Zostawiamy jako string
          break;
        case "hasBreak":
          updateData.hasBreak = value;
          break;
        case "hasForeignCooling":
          updateData.hasForeignCooling = value;
          break;
        case "stock":
          try {
            const newStock = parseInt(value);

            console.log("=== DEBUG AKTUALIZACJI STANU ===");
            console.log("Produkt ID:", productId);
            console.log("Nowy stan:", newStock);
            console.log(
              "Allegro productId:",
              product.marketplaces?.allegro?.productId
            );
            console.log(
              "matched_store_product:",
              product.matched_store_product
            );

            // Przekaż flagę hasAllegroLink=true jeśli mamy bezpośrednie ID lub powiązanie
            const hasDirectLink = !!product.marketplaces?.allegro?.productId;
            const hasMatchedLink =
              !!product.matched_store_product?.store_product_id;
            const hasAllegroLink = hasDirectLink || hasMatchedLink;

            console.log("hasDirectLink:", hasDirectLink);
            console.log("hasMatchedLink:", hasMatchedLink);
            console.log("hasAllegroLink:", hasAllegroLink);

            if (!hasAllegroLink) {
              console.warn(
                "⚠️ Produkt nie ma powiązania z Allegro, synchronizacja nie będzie wykonana!"
              );
            }

            // Aktualizuj stan w sklepie, a jeśli jest powiązanie z Allegro, to również tam
            await useProductStore
              .getState()
              .updateProductStock(productId, newStock, hasAllegroLink);

            console.log("✅ Aktualizacja stanu zakończona");

            toast({
              title: "Sukces",
              description: hasAllegroLink
                ? "Stan magazynowy został zaktualizowany (sklep i Allegro)"
                : "Stan magazynowy został zaktualizowany tylko w sklepie",
            });

            return;
          } catch (error) {
            console.error("❌ Błąd aktualizacji stanu:", error);
            toast({
              title: "Błąd",
              description: "Nie udało się zaktualizować stanu magazynowego",
              variant: "destructive",
            });
            return;
          }
        case "price":
          updateData.marketplaces = {
            ...product.marketplaces,
            ownStore: {
              ...product.marketplaces.ownStore,
              active: product.marketplaces.ownStore?.active || false,
              price: parseFloat(value),
              url: product.marketplaces.ownStore?.url,
              slug: product.marketplaces.ownStore?.slug,
              category_path: selectedCategory
                ? `${selectedCategory.slug}/`
                : "",
            },
          };
          break;
        case "description":
          updateData.description = value;
          break;
        case "seo.title":
          updateData.seo = {
            ...product.seo,
            title: value,
          };
          break;
        case "seo.description":
          updateData.seo = {
            ...product.seo,
            description: value,
          };
          break;
        case "slug":
          updateData.marketplaces = {
            ...product.marketplaces,
            ownStore: {
              ...product.marketplaces.ownStore,
              active: product.marketplaces.ownStore?.active || false,
              price: product.marketplaces.ownStore?.price,
              slug: value,
              category_path: product.marketplaces.ownStore?.category_path,
            },
          };
          break;
        case "seo.keywords":
          updateData.seo = {
            ...product.seo,
            keywords: value.split(",").map((k: string) => k.trim()),
          };
        case "dataSheets":
          updateData.dataSheets = value;
          break;
        case "dataSheetUrl": // zachowaj dla kompatybilności wstecznej
          updateData.dataSheets = value ? [value] : [];
          break;
      }

      await updateProduct(productId, updateData);
      setEditingCell(null);
      window.scrollTo(0, scrollPosition);

      toast({
        title: "Sukces",
        description: "Zaktualizowano produkt",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować produktu",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const selectedProductsDetails = products
    .filter((p) => selectedProducts.includes(p.id || ""))
    .map((p) => ({
      id: p.id || "",
      name: p.name,
      manufacturer: p.manufacturer,
      power: p.power,
      mainImage: p.mainImage,
      categorySlug:
        p.categories?.[0]?.slug ||
        p.marketplaces?.ownStore?.category_path?.replace("/", ""),
      slug: p.marketplaces?.ownStore?.slug || "",
    }));

  const renderCell = (product: IProduct, field: string) => {
    const productId = product.id || product._id;

    const isEditing =
      editingCell?.id === productId && editingCell?.field === field;

    if (isEditing) {
      const buttonGroup = (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              const parentDiv = document.activeElement?.closest(
                ".flex.items-center.gap-2"
              );
              if (!parentDiv) return;

              const input = parentDiv.querySelector(
                "input, select, textarea"
              ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

              if (!input?.value) return;
              const productId = product.id || product._id;
              if (!productId) return;
              handleCellEdit(productId, field, input.value);
            }}
            className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
            title="Zatwierdź"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setEditingCell(null);
            }}
            className="p-1 bg-red-600 hover:bg-red-700 rounded text-white"
            title="Anuluj"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      );
      return (
        <div className="flex items-center gap-2">
          {field === "condition" ? (
            <select
              value={product.condition}
              onChange={(e) => {
                const productId = product.id || product._id;
                if (!productId) {
                  console.error("Brak ID produktu:", product);
                  return;
                }
                handleCellEdit(productId, field, e.target.value);
              }}
              className="w-full px-2 py-1  border rounded"
            >
              <option value="nowy">Nowy</option>
              <option value="uzywany">Używany</option>
              <option value="nieuzywany">Nieużywany</option>
            </select>
          ) : field === "categories" ? (
            <select
              value={product.categories?.[0]?.id || ""}
              onChange={(e) => {
                const productId = product.id;
                if (!productId) return;
                handleCellEdit(productId, "categories", e.target.value);
              }}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="">Wybierz kategorię</option>
              {categories?.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  selected={product.categories?.some(
                    (cat) => cat.id === category.id
                  )}
                >
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={
                [
                  "stock",
                  "shaftDiameter",
                  "mechanicalSize",
                  "weight",
                  "sleeveDiameter",
                  "flangeBoltCircle",
                  "flangeSize",
                  "price",
                ].includes(field)
                  ? "number"
                  : "text"
              }
              step={field === "price" ? "0.01" : "1"}
              defaultValue={getFieldValue(product, field)}
              className="flex-1 px-2 py-1  border rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const productId = product.id;
                  if (!productId) return;
                  handleCellEdit(productId, field, e.currentTarget.value);
                } else if (e.key === "Escape") {
                  setEditingCell(null);
                }
              }}
            />
          )}
          {buttonGroup}
        </div>
      );
    }

    // Zmodyfikuj sekcję w renderCell dla 'name' w pliku frontend/src/app/(admin)/admin/marketplaces/own-store/page.tsx

    if (field === "name") {
      const hasAllegro =
        product.matched_store_product ||
        product.marketplaces?.allegro?.productId;

      const frontendUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://www.silniki-elektryczne.com.pl";
      const categorySlug =
        product.categories?.[0]?.slug ||
        product.marketplaces.ownStore?.category_path?.replace("/", "") ||
        "";
      const fullUrl = `${frontendUrl}/${categorySlug}/${product.marketplaces.ownStore?.slug}`;

      // Użyj globalnego stanu zamiast lokalnego useState
      const allegroUrl = product.id ? allegroUrls[product.id] : null;
      const isLoadingAllegroUrl = product.id
        ? loadingAllegroUrls[product.id]
        : false;

      return (
        <div>
          <div
            className="text-base font-medium cursor-pointer px-2 py-1 rounded mb-1"
            onClick={() =>
              setEditingCell({
                id: product.id || product._id!,
                field,
                value: getFieldValue(product, field),
              })
            }
          >
            {getFormattedValue(product, field)}
          </div>
          <div className="flex flex-col gap-1 px-2">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-500 flex items-center gap-1"
            >
              <span>Link do produktu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>

            {allegroUrl ? (
              <a
                href={allegroUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-500 flex items-center gap-1"
              >
                <span>Link do Allegro</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            ) : isLoadingAllegroUrl ? (
              <span className="text-xs text-gray-500">Ładowanie linku...</span>
            ) : (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Brak Allegro</span>
                {!product.matched_store_product && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Zapobiega otwarciu edycji
                      openLinkingModal(product);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 underline mt-1"
                  >
                    Powiąż z Allegro
                  </button>
                )}
              </span>
            )}

            <div className="text-xs text-gray-500">
              {product.matched_store_product
                ? `✓ Allegro Marketplace ID: ${product.matched_store_product.store_product_id.substring(
                    0,
                    8
                  )}...`
                : "❌ Brak powiązania z Allegro"}
            </div>
          </div>
        </div>
      );
    }

    if (field === "condition") {
      return (
        <select
          value={product.condition}
          onChange={(e) => {
            const productId = product.id;
            if (!productId) return;
            handleCellEdit(productId, field, e.target.value);
          }}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="nowy">Nowy</option>
          <option value="uzywany">Używany</option>
          <option value="nieuzywany">Nieużywany</option>
        </select>
      );
    }

    if (field === "categories") {
      const filteredCategories = categories?.filter((category) =>
        shouldShowCategory(category.name)
      );

      // Spróbuj pobrać kategorię na podstawie category_path
      const categoryPath =
        product.marketplaces?.ownStore?.category_path?.replace("/", "") || "";
      const matchingCategory = categories?.find(
        (cat) => cat.slug === categoryPath
      );

      // Jeśli nie ma kategorii w categories, ale jest w category_path, dodaj ją
      const effectiveCategories = product.categories?.length
        ? product.categories
        : matchingCategory
        ? [
            {
              id: matchingCategory.id,
              name: matchingCategory.name,
              slug: matchingCategory.slug,
            },
          ]
        : [];

      const selectedCategoryId = effectiveCategories[0]?.id || "";

      return (
        <select
          value={selectedCategoryId}
          onChange={(e) => {
            const productId = product.id;
            if (!productId) return;
            handleCellEdit(productId, field, e.target.value);
          }}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="">Wybierz kategorię</option>
          {filteredCategories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      );
    }

    if (field === "mainImage") {
      return (
        <div className="relative bg-background border group p-2 rounded-lg">
          <div className="relative">
            {product.mainImage ? (
              <>
                <img
                  src={product.mainImage}
                  alt="Zdjęcie główne"
                  className="w-32 h-32 object-cover rounded cursor-pointer"
                  onClick={() =>
                    product.mainImage && setPreviewImage(product.mainImage)
                  }
                />
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Czy chcesz usunąć zdjęcie główne?")) {
                      await updateProduct(product.id!, {
                        ...product,
                        mainImage: "",
                      });
                    }
                  }}
                  className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-xs text-center">
                  Dodaj zdjęcie główne
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    if (!e.target.files?.[0]) return;
                    const formData = new FormData();
                    formData.append("images", e.target.files[0]);

                    const response = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/products`,
                      {
                        // Zmiana tutaj
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (response.ok) {
                      const { data } = await response.json();
                      await updateProduct(product.id!, {
                        ...product,
                        mainImage: data.urls[0],
                      });
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    if (field === "gallery") {
      return (
        <div className="flex items-center gap-2 p-2">
          {product.galleryImages?.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Galeria ${idx + 1}`}
                className="w-32 h-32 object-cover rounded cursor-pointer"
                onClick={() => setPreviewImage(img)}
              />
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm("Czy chcesz usunąć to zdjęcie?")) {
                    const newGallery = product.galleryImages?.filter(
                      (_, i) => i !== idx
                    );
                    await updateProduct(product.id!, {
                      ...product,
                      galleryImages: newGallery,
                    });
                  }
                }}
                className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(!product.galleryImages || product.galleryImages.length < 3) && (
            <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-xs text-center">Dodaj zdjęcie</span>
              <span className="text-xs text-muted-foreground">
                {product.galleryImages?.length || 0}/3
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return;
                  const formData = new FormData();
                  formData.append("images", e.target.files[0]);

                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/products`,
                    {
                      // Zmiana tutaj
                      method: "POST",
                      body: formData,
                    }
                  );

                  if (response.ok) {
                    const { data } = await response.json();
                    await updateProduct(product.id!, {
                      ...product,
                      galleryImages: [
                        ...(product.galleryImages || []),
                        data.urls[0],
                      ],
                    });
                  }
                }}
              />
            </label>
          )}
        </div>
      );
    }

    if (field === "manufacturer") {
      return (
        <div className="flex items-center gap-2">
          <div
            onClick={() =>
              setManufacturerModal({
                isOpen: true,
                productId: product.id!,
                selectedManufacturer:
                  product.manufacturer === "silnik"
                    ? ""
                    : product.manufacturer || "",
              })
            }
            className="cursor-pointer hover:bg-background rounded px-2 py-1 flex-1"
          >
            {product.manufacturer === "silnik"
              ? "BRAK prod."
              : product.manufacturer || "Kliknij, aby wybrać producenta"}
          </div>
        </div>
      );
    }

    if (field === "dataSheet") {
      return (
        <div className="space-y-4 min-w-[250px]">
          {/* Sekcja PDF */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Karty katalogowe ({product.dataSheets?.length || 0})
              </span>
            </div>

            {/* Lista plików PDF */}
            {product.dataSheets && product.dataSheets.length > 0 ? (
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {product.dataSheets.map((url, index) => (
                  <div
                    key={`${product.id}-datasheet-${index}`}
                    className="flex items-center gap-2 p-1 bg-secondary/20 rounded"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-xs flex-1 truncate"
                      title={`PDF ${index + 1}`}
                    >
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">PDF {index + 1}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-5 w-5"
                      onClick={async () => {
                        if (window.confirm(`Usunąć PDF ${index + 1}?`)) {
                          const newDataSheets =
                            product.dataSheets?.filter((_, i) => i !== index) ||
                            [];
                          await handleCellEdit(
                            product.id!,
                            "dataSheets",
                            newDataSheets
                          );
                          fetchProductsForAdmin({
                            page: currentPage,
                            limit: itemsPerPage,
                          });
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Brak plików PDF
              </div>
            )}

            {/* Przycisk dodawania */}
            <label className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 cursor-pointer p-2 border border-dashed rounded hover:border-primary transition-colors">
              <Plus className="w-3 h-3" />
              <span>Dodaj PDF</span>
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                multiple // Umożliwia wybór wielu plików
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;

                  const formData = new FormData();
                  Array.from(e.target.files).forEach((file) => {
                    formData.append("images", file);
                  });

                  try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
                    const response = await fetch(
                      `${baseUrl}/api/uploads/datasheets`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (response.ok) {
                      const { data } = await response.json();
                      const currentDataSheets = product.dataSheets || [];
                      await handleCellEdit(product.id!, "dataSheets", [
                        ...currentDataSheets,
                        ...data.urls,
                      ]);
                      fetchProductsForAdmin({
                        page: currentPage,
                        limit: itemsPerPage,
                      });

                      toast({
                        title: "Sukces",
                        description: `Dodano ${data.urls.length} ${
                          data.urls.length === 1
                            ? "kartę katalogową"
                            : "karty katalogowe"
                        }`,
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Błąd",
                      description: "Nie udało się dodać kart katalogowych",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </label>
          </div>

          {/* Sekcja dokumentacji technicznej - bez zmian */}
          <div className="border-t pt-2">
            {product.technicalDetails ? (
              <div className="space-y-1">
                <div
                  className="text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:text-blue-500"
                  onClick={() => {
                    const productId = product.id || product._id;
                    if (!productId) return;
                    setTechnicalDetailsModal({
                      isOpen: true,
                      productId,
                      content: unformatHtmlToText(
                        product.technicalDetails || ""
                      ),
                    });
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.technicalDetails,
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  const productId = product.id || product._id;
                  if (!productId) return;
                  setTechnicalDetailsModal({
                    isOpen: true,
                    productId,
                    content: "",
                  });
                }}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Opis dodatkowy
              </button>
            )}
          </div>
        </div>
      );
    }
    if (field === "description") {
      return (
        <div className="flex flex-col gap-2">
          <div
            className="cursor-pointer px-2 py-1 rounded min-h-[40px]"
            onClick={() => {
              const productId = product.id || product._id;
              if (!productId) return;
              setDescriptionModal({
                isOpen: true,
                productId,
                content: unformatHtmlToText(product.description || ""),
              });
            }}
          >
            <div
              className="line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: product.description || "-",
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={generatingDescriptionId === (product.id || product._id)}
              onClick={async (e) => {
                e.stopPropagation();
                const productId = product.id || product._id;
                if (!productId) return;

                if (
                  !confirm(
                    "Czy na pewno chcesz wygenerować nowy opis? Obecny opis zostanie zastąpiony."
                  )
                ) {
                  return;
                }
                setGeneratingDescriptionId(productId);
                try {
                  const description = await generateProductDescription(product);
                  await handleCellEdit(
                    product.id!,
                    "description",
                    formatContentToHtml(description)
                  );
                  toast({
                    title: "Sukces",
                    description: "Wygenerowano i zapisano nowy opis produktu",
                  });
                } catch (error) {
                  toast({
                    title: "Błąd",
                    description: "Nie udało się wygenerować opisu",
                    variant: "destructive",
                  });
                } finally {
                  setGeneratingDescriptionId(null);
                }
              }}
              className="text-xs"
            >
              {generatingDescriptionId === product.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                "Wygeneruj AI"
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (field === "hasBreak" || field === "hasForeignCooling") {
      return (
        <div className="flex flex-col items-center justify-center">
          <input
            type="checkbox"
            checked={Boolean(product[field])}
            onChange={(e) => {
              const productId = product.id;
              if (!productId) return;
              handleCellEdit(productId, field, e.target.checked);
            }}
            className="w-5 h-5 text-green-500 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
          />

          {!product[field] && (
            <span className="text-xs text-gray-500 mt-1">
              {field === "hasBreak"
                ? "(brak hamulca)"
                : "(brak obcego chłodzenia)"}
            </span>
          )}
        </div>
      );
    }

    if (field === "startType") {
      const typeOptions = [
        "bezpośredni - 220/380V",
        "bezpośredni - 230/400V",
        "gwiazda-trójkąt - 380/660V",
        "gwiazda-trójkąt - 400/690V",
        "gwiazda-trójkąt - 380V△",
        "gwiazda-trójkąt - 400V△",
      ];

      return (
        <select
          value={product.startType || ""}
          onChange={(e) => {
            handleCellEdit(product.id!, field, e.target.value || null);
          }}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="">Brak określonego typu</option>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field === "customParameters") {
      const parameters = product.customParameters || [];

      return (
        <div className="space-y-2 p-2">
          {parameters.length > 0 ? (
            parameters.map((param, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded border"
              >
                <div className="flex-1 flex gap-2">
                  <input
                    className="w-1/2 px-2 py-1 text-sm border rounded"
                    value={param.name}
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].name = e.target.value;
                      handleCellEdit(
                        product.id!,
                        "customParameters",
                        newParams
                      );
                    }}
                    placeholder="Nazwa parametru"
                  />
                  <input
                    className="w-1/2 px-2 py-1 text-sm border rounded"
                    value={param.value}
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].value = e.target.value;
                      handleCellEdit(
                        product.id!,
                        "customParameters",
                        newParams
                      );
                    }}
                    placeholder="Wartość"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newParams = parameters.filter((_, i) => i !== index);
                    handleCellEdit(product.id!, "customParameters", newParams);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm italic">Brak dodatkowych parametrów</div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setCustomParameterModal({
                isOpen: true,
                productId: product.id!,
                name: "",
                value: "",
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj parametr
          </Button>
        </div>
      );
    }

    if (field === "stock") {
      if (isEditing) {
        // Dodaj tę linię, która definiuje zmienną hasAllegroLink
        const hasAllegroLink = !!product.marketplaces?.allegro?.productId;

        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              defaultValue={product.stock || 0}
              onChange={(e) => {
                const productId = product.id;
                if (!productId) return;

                // Synchronizuj tylko gdy jest powiązanie z Allegro
                useProductStore
                  .getState()
                  .updateProductStock(
                    productId,
                    parseInt(e.target.value),
                    hasAllegroLink
                  );
              }}
              className="flex-1 px-2 py-1 border rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingCell(null);
                  // Po zakończeniu edycji odświeżamy listę
                  fetchProductsForAdmin({
                    page: currentPage,
                    limit: itemsPerPage,
                    sortField: sortConfig.key,
                    sortDirection: sortConfig.direction,
                    search: searchTerm,
                  });
                } else if (e.key === "Escape") {
                  setEditingCell(null);
                }
              }}
            />
            {hasAllegroLink && (
              <span className="text-xs text-green-500">✓ Allegro</span>
            )}
          </div>
        );
      }

      return (
        <div
          className="cursor-pointer px-2 py-1 rounded"
          onClick={() => {
            if (!product.id) return;
            setEditingCell({
              id: product.id,
              field,
              value: getFieldValue(product, field),
            });
          }}
        >
          {getFormattedValue(product, field)}
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer px-2 py-1 rounded"
        onClick={() => {
          if (!product.id) return; // Dodaj sprawdzenie
          setEditingCell({
            id: product.id,
            field,
            value: getFieldValue(product, field),
          });
        }}
      >
        {getFormattedValue(product, field)}
      </div>
    );
  };

  const getFieldValue = (product: IProduct, field: string): string => {
    switch (field) {
      case "power":
        return product.power.value.toString();
      case "rpm":
        return product.rpm.value.toString();
      case "price":
        return product.marketplaces.ownStore?.price?.toString() || "";
      case "slug":
        return product.marketplaces.ownStore?.slug || "";
      case "seo.title":
        return product.seo?.title || "";
      case "seo.description":
        return product.seo?.description || "";
      case "seo.keywords":
        return product.seo?.keywords?.join(", ") || "";
      case "description":
        return product.description || "";
      default:
        return (product[field as keyof IProduct] || "").toString();
    }
  };

  const getFormattedValue = (product: IProduct, field: string): string => {
    switch (field) {
      case "power":
        if (!product.power?.value) return "0 (kW)";
        // Usuń wszystkie wystąpienia 'kW' i spacje z wartości
        let powerValue = product.power.value
          .toString()
          .replace(/\s*kW\s*/gi, "")
          .trim();
        // Dodaj pojedyncze 'kW' na końcu
        return `${powerValue} kW`;
      case "rpm":
        return product.rpm?.value
          ? `${product.rpm.value} obr./min`
          : "0 (obr./min)";
      case "legSpacing":
        return `${product[field] || "0"} mm (rozstaw)`;
      case "price":
        return product.marketplaces.ownStore?.price
          ? product.marketplaces.ownStore.price.toLocaleString("pl-PL", {
              style: "currency",
              currency: "PLN",
            })
          : "0 (cena)";
      case "stock":
        return `${product.stock || "0"} szt.`;
      case "shaftDiameter":
        return `${product[field] || "0"} mm (śr. wał)`;
      case "sleeveDiameter":
        return `${product[field] || "0"} mm (śr. tulei)`;
      case "flangeBoltCircle":
        return `${product[field] || "0"} mm (śr. podz. otw.)`;

      case "flangeSize":
        return `${product[field] || "0"} mm (śr. koł.)`;
      case "mechanicalSize":
        return `${product[field] || "0"} (wielk. mech.)`;
      case "weight":
        return `${product.weight || "0"} kg`;
      case "condition":
        switch (product.condition) {
          case "nowy":
            return "Nowy";
          case "uzywany":
            return "Używany";
          case "nieuzywany":
            return "Nieużywany";
          default:
            return "-";
        }
      case "hasBreak":
      case "hasForeignCooling":
        return product[field] ? "✓" : "-";

      case "startType":
        return `${product.startType || "-"} (rozruch)`;
      case "manufacturer":
        if (product.manufacturer === "silnik") {
          return "BRAK producenta";
        }
        return product.manufacturer
          ? `${product.manufacturer} (prod.)`
          : "Wybierz producenta";
      case "categories":
        const categoryPath =
          product.marketplaces?.ownStore?.category_path?.replace("/", "") || "";
        const matchingCategory = categories.find(
          (cat) => cat.slug === categoryPath
        );

        if (product.categories?.[0]?.name) {
          return product.categories[0].name;
        }
        if (matchingCategory) {
          return matchingCategory.name;
        }
        return "Brak kategorii";
      case "slug":
        return product.marketplaces.ownStore?.slug || "-";
      case "images":
        return product.images?.length ? `${product.images.length} zdjęć` : "-";
      case "description":
        return product.description
          ? product.description.length > 50
            ? product.description.substring(0, 50) + "..."
            : product.description
          : "-";
      case "seo.title":
        return product.seo?.title || "-";
      case "seo.description":
        return product.seo?.description || "-";
      case "seo.keywords":
        return product.seo?.keywords?.join(", ") || "-";
      default:
        return (product[field as keyof IProduct] || "-").toString();
    }
  };

  const { totalPages, totalProducts } = useProductStore();

  const handleSort = (key: string) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction: newDirection });

    // Mapowanie kluczy na pola w bazie
    const sortMapping: Record<string, string> = {
      power: "power",
      rpm: "rpm",
      price: "price",
      name: "name",
      manufacturer: "manufacturer",
      stock: "stock",
      condition: "condition",
    };

    const sortField = sortMapping[key] || key;

    fetchProductsForAdmin({
      page: currentPage,
      limit: itemsPerPage,
      sortField,
      sortDirection: newDirection,
      search: searchTerm,
    })
      .then(() => {})
      .catch((error) => {
        console.error("Błąd sortowania:", error);
      });
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm("Czy na pewno chcesz usunąć ten produkt?")) {
      try {
        await deleteProduct(id);

        toast({
          title: "Sukces",
          description: "Produkt został usunięty",
        });
        // Odśwież listę produktów z aktualnymi parametrami paginacji
        fetchProductsForAdmin({
          page: currentPage,
          limit: itemsPerPage,
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć produktu",
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (
      window.confirm(
        `Czy na pewno chcesz usunąć ${selectedProducts.length} wybranych produktów?`
      )
    ) {
      try {
        await Promise.all(selectedProducts.map((id) => deleteProduct(id)));

        toast({
          title: "Sukces",
          description: `Usunięto ${selectedProducts.length} produktów`,
        });

        setSelectedProducts([]);
        fetchProductsForAdmin({
          page: currentPage,
          limit: itemsPerPage,
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć niektórych produktów",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Zarządzanie sklepem własnym</h1>
        <div className="flex gap-4">
          <Button
            variant={showOnlyUnlinked ? "destructive" : "outline"}
            onClick={() => setShowOnlyUnlinked(!showOnlyUnlinked)}
          >
            {showOnlyUnlinked ? (
              <>❌ Pokaż wszystkie</>
            ) : (
              <>
                🚫 Tylko bez Allegro (
                {
                  products.filter(
                    (p) =>
                      !p.matched_store_product &&
                      !p.marketplaces?.allegro?.productId
                  ).length
                }
                )
              </>
            )}
          </Button>

          {selectedProducts.length > 0 && (
            <>
              {/*<Button onClick={() => setShowBulkEditor(true)}>
                Zmień kategorię ({selectedProducts.length})
              </Button>*/}
              <Button variant="destructive" onClick={handleBulkDelete}>
                Usuń zaznaczone ({selectedProducts.length})
              </Button>
            </>
          )}
          {/*<Button onClick={syncSleeveDiameters}>Synchronizuj średnice tulei z Allegro</Button>
          <Button
            onClick={async () => {
              // Dodajemy lepsze debugowanie
              console.log('=== DEBUGOWANIE NAPRAWY POWIĄZAŃ ===');
              console.log('Wszystkie produkty:', products.length);

              // Rozszerzamy warunki filtrowania, aby złapać więcej przypadków
              const productsToUpdate = products.filter((p) => {
                // Produkt ma URL Allegro, ale nie ma productId
                const hasUrlNoId =
                  p.marketplaces?.allegro?.url &&
                  !p.marketplaces?.allegro?.productId &&
                  typeof p.marketplaces?.allegro?.url === 'string' &&
                  p.marketplaces?.allegro?.url.includes('/oferta/') &&
                  !p.marketplaces?.allegro?.url.includes('/oferta/undefined');

                // Produkt ma oznaczenie, że jest na Allegro, ale brak powiązania
                const hasAllegroNoLink =
                  p.marketplaces?.allegro &&
                  p.marketplaces?.allegro?.active === true &&
                  !p.marketplaces?.allegro?.productId;

                // Produkt ma powiązanie ze sklepem, ale nie ma powiązania z Allegro
                const hasStoreMatchNoAllegro =
                  p.matched_store_product && !p.marketplaces?.allegro?.productId;

                const shouldFix = hasUrlNoId || hasAllegroNoLink || hasStoreMatchNoAllegro;

                // Debugowanie dla każdego produktu
                if (p.name.includes('silnik elektryczny 0,37kW') || shouldFix) {
                  console.log(`Produkt "${p.name}" (${p.id}):`);
                  console.log('- URL Allegro:', p.marketplaces?.allegro?.url);
                  console.log('- ID Allegro:', p.marketplaces?.allegro?.productId);
                  console.log('- Active Allegro:', p.marketplaces?.allegro?.active);
                  console.log('- Powiązanie ze sklepem:', p.matched_store_product);
                  console.log('- Wymaga naprawy:', shouldFix);
                }

                return shouldFix;
              });

              console.log(`Znaleziono ${productsToUpdate.length} produktów do naprawy`);

              if (productsToUpdate.length === 0) {
                toast({
                  title: 'Informacja',
                  description:
                    'Wszystkie produkty mają poprawne powiązania lub brak prawidłowych adresów URL',
                });
                return;
              }

              // Aktualizuj produkty w bazie danych
              let updatedCount = 0;
              let failedCount = 0;

              for (const product of productsToUpdate) {
                if (!product.id) continue;

                try {
                  // Sprawdzamy URL produktu Allegro
                  if (product.marketplaces?.allegro?.url) {
                    const url = product.marketplaces.allegro.url;
                    console.log(`Próba naprawy produktu ${product.name} z URL ${url}`);

                    const parts = url.split('/oferta/');

                    if (parts.length > 1) {
                      const productId = parts[1].split('?')[0];

                      if (productId && productId !== 'undefined') {
                        console.log(`Ekstrakcja ID: ${productId} z URL ${url}`);

                        await updateProduct(product.id, {
                          marketplaces: {
                            ...product.marketplaces,
                            allegro: {
                              ...product.marketplaces.allegro,
                              productId,
                              active: product.marketplaces.allegro.active === true,
                            },
                          },
                        });
                        updatedCount++;
                        console.log(`✅ Zaktualizowano powiązanie dla ${product.name}`);
                      } else {
                        console.log(`❌ Nieprawidłowy productId: ${productId} dla ${product.name}`);
                        failedCount++;
                      }
                    } else {
                      // Jeśli nie ma URL, ale mamy powiązanie ze sklepem, szukamy innego produktu
                      // z tym samym powiązaniem, który ma URL Allegro
                      if (
                        product.matched_store_product &&
                        product.matched_store_product.store_product_id
                      ) {
                        console.log(
                          `Szukam innego produktu z powiązaniem do ${product.matched_store_product.store_product_id}`
                        );

                        // Znajdź inny produkt z tym samym powiązaniem, który ma URL Allegro
                        const matchedProduct = products.find(
                          (p) =>
                            p.id !== product.id &&
                            p.matched_store_product?.store_product_id ===
                              product.matched_store_product?.store_product_id &&
                            p.marketplaces?.allegro?.url &&
                            p.marketplaces?.allegro?.productId
                        );

                        if (matchedProduct && matchedProduct.marketplaces?.allegro?.productId) {
                          console.log(
                            `Znaleziono powiązany produkt ${matchedProduct.name} z ID Allegro ${matchedProduct.marketplaces.allegro.productId}`
                          );

                          // Kopiujemy powiązanie z Allegro do naszego produktu
                          await updateProduct(product.id, {
                            marketplaces: {
                              ...product.marketplaces,
                              allegro: {
                                ...product.marketplaces.allegro,
                                productId: matchedProduct.marketplaces.allegro.productId,
                                url: matchedProduct.marketplaces.allegro.url,
                                active: true,
                              },
                            },
                          });
                          updatedCount++;
                          console.log(
                            `✅ Zaktualizowano powiązanie dla ${product.name} na podstawie powiązanego produktu`
                          );
                        } else {
                          console.log(`❌ Nie znaleziono pasującego produktu dla ${product.name}`);
                          failedCount++;
                        }
                      } else {
                        console.log(`❌ Nieprawidłowy format URL: ${url} dla ${product.name}`);
                        failedCount++;
                      }
                    }
                  } else if (product.matched_store_product) {
                    // Jeśli nie ma URL, ale mamy powiązanie ze sklepem, szukamy innego produktu
                    // z tym samym powiązaniem, który ma URL Allegro
                    console.log(
                      `Szukam innego produktu z powiązaniem do ${product.matched_store_product.store_product_id}`
                    );

                    // Znajdź inny produkt z tym samym powiązaniem, który ma URL Allegro
                    const matchedProduct = products.find(
                      (p) =>
                        p.id !== product.id &&
                        p.matched_store_product?.store_product_id ===
                          product.matched_store_product?.store_product_id &&
                        p.marketplaces?.allegro?.url &&
                        p.marketplaces?.allegro?.productId
                    );

                    if (matchedProduct && matchedProduct.marketplaces?.allegro?.productId) {
                      console.log(
                        `Znaleziono powiązany produkt ${matchedProduct.name} z ID Allegro ${matchedProduct.marketplaces.allegro.productId}`
                      );

                      // Kopiujemy powiązanie z Allegro do naszego produktu
                      await updateProduct(product.id, {
                        marketplaces: {
                          ...product.marketplaces,
                          allegro: {
                            ...product.marketplaces.allegro,
                            productId: matchedProduct.marketplaces.allegro.productId,
                            url: matchedProduct.marketplaces.allegro.url,
                            active: true,
                          },
                        },
                      });
                      updatedCount++;
                      console.log(
                        `✅ Zaktualizowano powiązanie dla ${product.name} na podstawie powiązanego produktu`
                      );
                    } else {
                      console.log(`❌ Nie znaleziono pasującego produktu dla ${product.name}`);
                      failedCount++;
                    }
                  }
                } catch (error) {
                  console.error(`❌ Błąd aktualizacji produktu ${product.id}:`, error);
                  failedCount++;
                }
              }

              toast({
                title: updatedCount > 0 ? 'Sukces' : 'Informacja',
                description: `Naprawiono ${updatedCount} powiązań produktów. Nie udało się naprawić ${failedCount} produktów.`,
              });

              // Odśwież listę produktów
              fetchProductsForAdmin({
                page: currentPage,
                limit: itemsPerPage,
                sortField: sortConfig.key,
                sortDirection: sortConfig.direction,
                search: searchTerm,
              });
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            Napraw powiązania Allegro
          </Button>*/}
          <Link href="/admin/products/new" className="inline-block">
            <Button>Dodaj nowy produkt</Button>
          </Link>
          <div className="flex items-center gap-2">
            <span>Pokaż:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value);
                setItemsPerPage(newLimit);
                setCurrentPage(0);
                fetchProductsForAdmin({
                  page: 0,
                  limit: newLimit,
                  sortField: sortConfig.key,
                  sortDirection: sortConfig.direction,
                  search: searchTerm,
                });
              }}
              className="border rounded px-2 py-1"
            >
              {[5, 20, 50, 100, 200, 500, 1000, 2000].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </div>
          {/*<Button
            onClick={() => {
              const visibleProductIds = products
                .map((p: IProduct) => p.id)
                .filter((id): id is string => id !== undefined);
              setSelectedProducts(visibleProductIds);
            }}
          >
            Zaznacz wszystkie ({products.length})
          </Button>*/}
        </div>
      </div>
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Szukaj po nazwie lub producencie..."
          value={searchTerm}
          onChange={(e) => {
            const newSearchTerm = e.target.value;
            setSearchTerm(newSearchTerm);
            setIsSearching(true);

            if (searchTimeout) {
              clearTimeout(searchTimeout);
            }

            const timeout = setTimeout(() => {
              fetchProductsForAdmin({
                page: 0,
                limit: itemsPerPage,
                search: newSearchTerm,
                sortField: sortConfig.key,
                sortDirection: sortConfig.direction,
              });
              setCurrentPage(0);
              setIsSearching(false);
            }, 300);

            setSearchTimeout(timeout);
          }}
          className="w-full px-3 py-2 border-2 border-yellow-400 rounded-lg bg-background focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all duration-200"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-sm text-gray-500">Wyszukiwanie...</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">Ładowanie...</div>
      ) : (
        <>
          <div className="admin-table-container border rounded-lg overflow-x-auto relative">
            <table className="w-full">
              <thead className="sticky top-0 z-20">
                <tr>
                  {[
                    ["checkbox", "", "w-10 px-2 sticky left-0 bg-muted z-20"],
                    [
                      "name",
                      "Nazwa",
                      "min-w-[300px] sticky left-[40px] bg-muted z-20",
                    ],
                    [
                      "mainImage",
                      "Zdjęcie główne",
                      "w-fit sticky left-[340px] bg-muted z-20",
                    ],
                    ["gallery", "Galeria zdjęć", "w-fit"],
                    //['slug', 'URL', 'min-w-[150px]'],
                    ["price", "Cena", "min-w-[100px]"],
                    ["stock", "Liczba sztuk", "min-w-[80px]"],
                    ["power", "Moc", "min-w-[150px]"],
                    ["rpm", "Obroty", "min-w-[150px]"],
                    ["condition", "Stan", "min-w-[300]"],
                    ["weight", "Waga", "min-w-[100px]"],
                    ["mechanicalSize", "Wielkość mechaniczna", "min-w-[150px]"],
                    ["shaftDiameter", "Średnica wału", "min-w-[120px]"],
                    ["sleeveDiameter", "Średnica tulei", "min-w-[120px]"],
                    [
                      "flangeBoltCircle",
                      "Średnica podziałowa otworów",
                      "min-w-[180px]",
                    ],
                    ["flangeSize", "Średnica zamka kołnierza", "min-w-[150px]"],
                    ["legSpacing", "Rozstaw łap", "min-w-[120px]"],
                    ["hasBreak", "Hamulec", "min-w-[100px]"],
                    ["hasForeignCooling", "Obce chłodzenie", "min-w-[120px]"],
                    ["startType", "Rozruch", "min-w-[150px]"],
                    [
                      "customParameters",
                      "Dodatkowe parametry",
                      "min-w-[300px]",
                    ],
                    //['seo.title', 'SEO Title', 'min-w-[150px]'],
                    //['seo.description', 'SEO Opis', 'min-w-[200px]'],
                    //['seo.keywords', 'SEO Keywords', 'min-w-[150px]'],
                    ["dataSheet", "Dokumentacja", "min-w-[200px]"],
                    ["manufacturer", "Producent", "min-w-[150px]"],
                    ["categories", "Kategoria", "min-w-[250px]"],
                    ["description", "Opis", "min-w-[200px]"],
                    ["actions", "Akcje", "min-w-[100px]"],
                    ["select", "", "min-w-[50px]"],
                  ].map(([key, label, width]) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-left ${width} ${
                        key === "name"
                          ? "sticky left-0 z-20 bg-background border-r"
                          : key === "images"
                          ? "sticky left-[300px] z-20 bg-background border-r"
                          : ""
                      } cursor-pointer select-none`}
                      onClick={() =>
                        key !== "actions" &&
                        key !== "select" &&
                        key !== "checkbox" &&
                        handleSort(key)
                      }
                    >
                      {key === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={
                            products.length > 0 &&
                            products.every((p) =>
                              selectedProducts.includes(p.id || "")
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Pobierz ID tylko aktualnie widocznych produktów
                              const visibleProductIds = products
                                .map((p) => p.id || "")
                                .filter(Boolean);

                              // Dodaj nowe ID do już wybranych
                              setSelectedProducts([
                                ...new Set([
                                  ...selectedProducts,
                                  ...visibleProductIds,
                                ]),
                              ]);
                            } else {
                              // Usuń ID aktualnie widocznych produktów z zaznaczonych
                              const visibleProductIds = products.map(
                                (p) => p.id || ""
                              );
                              setSelectedProducts(
                                selectedProducts.filter(
                                  (id) => !visibleProductIds.includes(id)
                                )
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center whitespace-nowrap">
                          {label}
                          {key !== "actions" && key !== "select" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 transition-colors ${
                                sortConfig.key === key
                                  ? "text-primary"
                                  : "text-gray-400"
                              } ${
                                sortConfig.key === key &&
                                sortConfig.direction === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {products
                  .filter((product) => {
                    // Filtr dla produktów bez powiązania
                    if (showOnlyUnlinked) {
                      return (
                        !product.matched_store_product &&
                        !product.marketplaces?.allegro?.productId
                      );
                    }
                    return true;
                  })
                  .map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-accent ${
                        // Dodatkowo wyróżnij produkty bez powiązania czerwonym tłem
                        !product.matched_store_product &&
                        !product.marketplaces?.allegro?.productId
                          ? "bg-red-50 dark:bg-red-900/20"
                          : selectedProducts.includes(product.id || "")
                          ? "bg-border"
                          : ""
                      }`}
                    >
                      <td className="w-10 px-2 sticky left-0 bg-background border-r z-10">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id || "")}
                          onChange={(e) => {
                            const productId = product.id;
                            if (!productId) return;

                            if (e.target.checked) {
                              setSelectedProducts([
                                ...selectedProducts,
                                productId,
                              ]);
                            } else {
                              setSelectedProducts(
                                selectedProducts.filter(
                                  (id) => id !== productId
                                )
                              );
                            }
                          }}
                        />
                      </td>
                      <td
                        className={`px-4 py-3 sticky left-[40px] bg-background border-r z-10`}
                      >
                        {renderCell(product, "name")}
                      </td>
                      <td
                        className={`px-4 py-3 sticky left-[340px] bg-background border-r z-10`}
                      >
                        {renderCell(product, "mainImage")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "gallery")}
                      </td>
                      {/*<td className="px-4 py-3">{renderCell(product, 'slug')}</td>*/}
                      <td className="px-4 py-3">
                        {renderCell(product, "price")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "stock")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "power")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "rpm")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "condition")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "weight")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "mechanicalSize")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "shaftDiameter")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "sleeveDiameter")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "flangeBoltCircle")}{" "}
                        {/* DODAJ TĘ LINIĘ */}
                      </td>

                      <td className="px-4 py-3">
                        {renderCell(product, "flangeSize")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "legSpacing")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "hasBreak")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "hasForeignCooling")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "startType")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "customParameters")}
                      </td>
                      {/*<td className="px-4 py-3">{renderCell(product, 'seo.title')}</td>*/}
                      {/*<td className="px-4 py-3">{renderCell(product, 'seo.description')}</td>*/}
                      {/*<td className="px-4 py-3">{renderCell(product, 'seo.keywords')}</td>*/}
                      <td className="px-4 py-3">
                        {renderCell(product, "dataSheet")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "manufacturer")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "categories")}
                      </td>
                      <td className="px-4 py-3">
                        {renderCell(product, "description")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {/*<Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/products/${product._id}`)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>*/}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const productId = product.id;
                              if (!productId) return;
                              handleDelete(productId);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            product.id
                              ? selectedProducts.includes(product.id)
                              : false
                          }
                          onChange={(e) => {
                            const productId = product.id;
                            if (!productId) return;

                            if (e.target.checked) {
                              setSelectedProducts([
                                ...selectedProducts,
                                productId,
                              ]);
                            } else {
                              setSelectedProducts(
                                selectedProducts.filter(
                                  (id) => id !== productId
                                )
                              );
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Paginacja */}
          <div className="mt-4 flex justify-between items-center">
            <Button
              onClick={() => {
                const newPage = Math.max(0, currentPage - 1);
                setCurrentPage(newPage);
                fetchProductsForAdmin({
                  page: newPage,
                  limit: itemsPerPage,
                });
              }}
              disabled={currentPage === 0}
            >
              Poprzednia strona
            </Button>{" "}
            <span>
              <span>
                Strona {currentPage + 1} z {totalPages} (łącznie {totalProducts}{" "}
                produktów)
              </span>
            </span>
            <Button
              onClick={() => {
                const newPage = Math.min(totalPages - 1, currentPage + 1);
                setCurrentPage(newPage);
                fetchProductsForAdmin({
                  page: newPage,
                  limit: itemsPerPage,
                });
              }}
              disabled={currentPage >= totalPages - 1}
            >
              Następna strona
            </Button>{" "}
          </div>
        </>
      )}
      {showBulkEditor && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center">
          <div className=" rounded-lg w-full max-w-md">
            <BulkCategoryEditor
              selectedProducts={selectedProducts}
              onClose={() => {
                setShowBulkEditor(false);
                setSelectedProducts([]);
              }}
            />
          </div>
        </div>
      )}
      {previewImage && (
        <div
          className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-2 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Podgląd produktu"
              className="max-h-[85vh] object-contain"
            />
            <button
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {descriptionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-lg w-full max-w-4xl flex flex-col bg-background my-4 max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Edycja opisu</h2>
              <button
                onClick={() =>
                  setDescriptionModal({
                    isOpen: false,
                    productId: null,
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
                <label className="font-medium mb-2">Edytor tekstu</label>
                <textarea
                  className="flex-1 w-full p-3 border rounded min-h-[400px] font-mono text-sm"
                  value={descriptionModal.content}
                  onChange={(e) =>
                    setDescriptionModal((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Wpisz opis produktu... Każda nowa linia zostanie automatycznie zamieniona na nowy akapit."
                />
              </div>
              <div className="flex flex-col h-full">
                <label className="font-medium mb-2">Podgląd HTML</label>
                <div
                  className="flex-1 w-full p-3 border rounded overflow-y-auto prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatContentToHtml(descriptionModal.content),
                  }}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDescriptionModal({
                    isOpen: false,
                    productId: null,
                    content: "",
                  })
                }
              >
                Anuluj
              </Button>
              <Button
                onClick={async () => {
                  if (!descriptionModal.productId) return;
                  await handleCellEdit(
                    descriptionModal.productId,
                    "description",
                    formatContentToHtml(descriptionModal.content)
                  );
                  setDescriptionModal({
                    isOpen: false,
                    productId: null,
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
      {technicalDetailsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-lg w-full max-w-4xl flex flex-col bg-background my-4 max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                Edycja dokumentacji technicznej
              </h2>
              <button
                onClick={() =>
                  setTechnicalDetailsModal({
                    isOpen: false,
                    productId: null,
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
                <label className="font-medium mb-2">Edytor tekstu</label>
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
                <label className="font-medium mb-2">Podgląd HTML</label>
                <div
                  className="flex-1 w-full p-3 border rounded overflow-y-auto prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatContentToHtml(technicalDetailsModal.content),
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
                    productId: null,
                    content: "",
                  })
                }
              >
                Anuluj
              </Button>
              <Button
                onClick={async () => {
                  if (!technicalDetailsModal.productId) return;
                  await handleCellEdit(
                    technicalDetailsModal.productId,
                    "technicalDetails",
                    formatContentToHtml(technicalDetailsModal.content)
                  );
                  setTechnicalDetailsModal({
                    isOpen: false,
                    productId: null,
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
      {selectedProducts.length > 0 && (
        <SelectedProductsPanel
          selectedProducts={selectedProductsDetails}
          onRemove={(id) => {
            setSelectedProducts(
              selectedProducts.filter((productId) => productId !== id)
            );
          }}
          onClearAll={() => setSelectedProducts([])}
        />
      )}
      {customParameterModal.isOpen && (
        <div className="fixed inset-0 bg-opacity-50 bg-background flex items-center justify-center z-50 p-4">
          <div className="rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Dodaj nowy parametr</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nazwa parametru
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={customParameterModal.name}
                  onChange={(e) =>
                    setCustomParameterModal((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Wartość
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={customParameterModal.value}
                  onChange={(e) =>
                    setCustomParameterModal((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCustomParameterModal({
                      isOpen: false,
                      productId: null,
                      name: "",
                      value: "",
                    })
                  }
                >
                  Anuluj
                </Button>
                <Button
                  onClick={() => {
                    const product = products.find(
                      (p) => p.id === customParameterModal.productId
                    );
                    if (!product) return;

                    const newParams = [
                      ...(product.customParameters || []),
                      {
                        name: customParameterModal.name,
                        value: customParameterModal.value,
                      },
                    ];

                    handleCellEdit(
                      customParameterModal.productId!,
                      "customParameters",
                      newParams
                    );
                    setCustomParameterModal({
                      isOpen: false,
                      productId: null,
                      name: "",
                      value: "",
                    });
                  }}
                >
                  Dodaj
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {manufacturerModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Wybierz producenta</h3>
              <button
                onClick={() =>
                  setManufacturerModal({
                    isOpen: false,
                    productId: null,
                    selectedManufacturer: "",
                  })
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                autoFocus
                placeholder="Szukaj..."
                className="w-full px-3 py-2 border rounded"
                value={manufacturerSearchTerm}
                onChange={(e) => setManufacturerSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded mb-4">
              {manufacturers
                .filter(
                  (m) =>
                    m.name.toLowerCase() !== "silnik" &&
                    m.name
                      .toLowerCase()
                      .includes(manufacturerSearchTerm.toLowerCase())
                )
                .map((manufacturer) => (
                  <div
                    key={manufacturer.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      handleCellEdit(
                        manufacturerModal.productId!,
                        "manufacturer",
                        manufacturer.name
                      );
                      setManufacturerModal({
                        isOpen: false,
                        productId: null,
                        selectedManufacturer: "",
                      });
                      setManufacturerSearchTerm("");
                    }}
                  >
                    {manufacturer.name}
                  </div>
                ))}
            </div>

            {manufacturerSearchTerm &&
              !manufacturers.find(
                (m) =>
                  m.name.toLowerCase() === manufacturerSearchTerm.toLowerCase()
              ) && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      const name = manufacturerSearchTerm.trim();
                      await useManufacturerStore.getState().createManufacturer({
                        name,
                        description: "",
                        slug: `marka-producent/${name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`,
                        images: [],
                      });

                      handleCellEdit(
                        manufacturerModal.productId!,
                        "manufacturer",
                        name
                      );
                      setManufacturerModal({
                        isOpen: false,
                        productId: null,
                        selectedManufacturer: "",
                      });
                      setManufacturerSearchTerm("");

                      const { fetchManufacturers } =
                        useManufacturerStore.getState();
                      await fetchManufacturers();
                      setManufacturers(
                        useManufacturerStore.getState().manufacturers
                      );

                      toast({
                        title: "Sukces",
                        description: "Dodano nowego producenta",
                      });
                    } catch (error) {
                      toast({
                        title: "Błąd",
                        description: "Nie udało się dodać producenta",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Dodaj nowego producenta: {manufacturerSearchTerm}
                </Button>
              )}
          </div>
        </div>
      )}
      {linkingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  Powiąż produkt z ofertą Allegro
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Produkt: {linkingModal.productName}
                </p>
              </div>
              <button
                onClick={() =>
                  setLinkingModal({
                    isOpen: false,
                    productId: null,
                    productName: "",
                    searchTerm: "",
                    allegroOffers: [],
                    loading: false,
                  })
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* NOWA SEKCJA - bezpośrednie wpisanie ID */}
            <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">
                    Wpisz ID oferty Allegro (np. 10676972970)
                  </label>
                  <input
                    type="text"
                    placeholder="ID oferty Allegro..."
                    className="w-full px-3 py-2 border rounded"
                    id="allegro-offer-id-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const allegroId = e.currentTarget.value.trim();
                        console.log("Powiązywanie z ID:", allegroId);
                        linkProductToAllegro(allegroId);
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById(
                      "allegro-offer-id-input"
                    ) as HTMLInputElement;
                    if (input?.value.trim()) {
                      const allegroId = input.value.trim();
                      console.log("Powiązywanie z ID:", allegroId);
                      linkProductToAllegro(allegroId);
                    }
                  }}
                  className="px-6"
                >
                  Powiąż
                </Button>
              </div>
            </div>

            {/* Reszta modalki - lista ofert (opcjonalna) */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Lub wybierz z listy niepowiązanych ofert (jeśli dostępne):
              </p>
              <input
                type="text"
                placeholder="Filtruj listę ofert po nazwie..."
                className="w-full px-3 py-2 border rounded"
                value={linkingModal.searchTerm}
                onChange={(e) =>
                  setLinkingModal((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {linkingModal.loading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="mt-2">Próba pobrania listy ofert...</p>
                </div>
              ) : linkingModal.allegroOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkingModal.allegroOffers
                    .filter((offer) =>
                      offer.name
                        .toLowerCase()
                        .includes(linkingModal.searchTerm.toLowerCase())
                    )
                    .map((offer) => (
                      <div
                        key={offer.id}
                        className="border rounded p-3 hover:border-primary"
                      >
                        <div className="flex gap-3">
                          {offer.image && (
                            <img
                              src={offer.image}
                              alt={offer.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">
                              {offer.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              ID: {offer.id}
                            </p>
                            <p className="text-xs">
                              Cena: {offer.price} zł | Stan: {offer.stock} szt.
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => linkProductToAllegro(offer.id)}
                        >
                          Powiąż z tym produktem
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Nie udało się pobrać listy ofert.</p>
                  <p className="text-sm mt-2">
                    Użyj pola powyżej, aby wpisać ID oferty ręcznie.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnStorePage;

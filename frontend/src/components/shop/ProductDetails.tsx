// frontend/src/components/shop/ProductDetails.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import { ExtendedShippingAddress } from "@/types/order.types";
import { IProduct } from "@/types/product.types";
import { formatShippingDate } from "@/utils/deliveryDate";
import { AnimatePresence, motion } from "framer-motion";
import { Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
//import { ModalCheckout } from "@/components/shop/ModalCheckout";
import { SimilarProducts } from "@/components/shop/SimilarProducts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  FileText,
  Info,
  Minus,
  Plus,
  X,
} from "lucide-react";

interface PaymentMethodCardProps {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
}

interface ModalCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface ClickPosition {
  x: number;
  y: number;
}

interface TooltipPosition {
  type: "prepaid" | "cod" | "condition" | "warranty" | null;
  buttonRef: HTMLButtonElement | null;
}

interface ProductDetailsProps {
  product: IProduct;
}

export const ProductDetails = ({
  product: initialProduct,
}: ProductDetailsProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { trackEvent, getPageLocation } = useAnalytics();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const { cart, addItem } = useCartStore();
  const [product, setProduct] = useState<IProduct>(initialProduct);
  if (
    !product ||
    !product.categories?.[0]?.slug ||
    !product.marketplaces?.ownStore?.slug
  ) {
    console.error("Nieprawidłowe dane produktu:", product);
    return <div>Błąd: Nieprawidłowe dane produktu</div>;
  }
  const deliveryInfo = formatShippingDate(product.weight);
  const router = useRouter();

  const formatRpmValue = (value: string) => {
    // Najpierw usuńmy "obr./min" jeśli już występuje
    let cleanValue = value
      .toLowerCase()
      .replace(/obr\.\/min/g, "")
      .trim();

    // Zamień kropki na przecinki
    cleanValue = cleanValue.replace(/\./g, ",");

    // Sprawdź różne formaty separatorów (slash lub myślnik)
    if (cleanValue.includes("/") || cleanValue.includes("-")) {
      // Podziel na części i sformatuj każdą z nich
      const parts = cleanValue.split(/[/-]/);
      const formattedParts = parts.map((part) => part.trim()).join("/");
      return `${formattedParts} obr./min`;
    }

    // Dla pojedynczej wartości
    return `${cleanValue} obr./min`;
  };

  const formatPowerValue = (value: string) => {
    // Sprawdź, czy produkt jest silnikiem dwubiegowym
    const isDwubiegowy =
      product.categories?.some((cat) => cat.slug === "dwubiegowe") ||
      product.name.toLowerCase().includes("dwubiegowy") ||
      product.name.toLowerCase().includes("dwubiegow");

    if (isDwubiegowy) {
      // Dla silników dwubiegowych zachowaj oryginalny format z ukośnikiem
      let cleanValue = value.toLowerCase().replace(/kw/g, "").trim();
      cleanValue = cleanValue.replace(/\./g, ",");

      if (cleanValue.includes("/") || cleanValue.includes("-")) {
        // Zamień myślniki na ukośniki i usuń spacje
        cleanValue = cleanValue.replace(/-/g, "/").replace(/\s+/g, "");
        return `${cleanValue}kW`;
      }

      return `${cleanValue}kW`;
    }

    // Dla pozostałych produktów - standardowe formatowanie
    let cleanValue = value.toLowerCase().replace(/kw/g, "").trim();
    cleanValue = cleanValue.replace(/\./g, ",");

    if (cleanValue.includes("/") || cleanValue.includes("-")) {
      const parts = cleanValue.split(/[/-]/);
      const formattedParts = parts.map((part) => part.trim()).join(" - ");
      return `${formattedParts} kW`;
    }

    return `${cleanValue} kW`;
  };

  const handleTooltipClick = (
    e: React.MouseEvent,
    type: "condition" | "warranty",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Sprawdzamy czy kliknięto ten sam tooltip
    if (tooltipPosition?.type === type) {
      // Jeśli tak - zamykamy go
      setTooltipPosition(null);
    } else {
      // Jeśli nie - otwieramy nowy
      setTooltipPosition({
        type,
        buttonRef: e.currentTarget as HTMLButtonElement,
      });
    }
  };

  const getWarrantyInfo = (condition: string) => {
    switch (condition) {
      case "uzywany":
        return {
          period: "1-miesięczna",
          type: "rozruchowa",
          details: "Naprawy realizowane w naszym serwisie",
        };
      case "nieuzywany":
        return {
          period: "12-miesięczna",
          type: "techniczna",
          details: "Naprawy realizowane w naszym serwisie",
        };
      case "nowy":
        return {
          period: "24-miesięczna",
          type: "techniczna",
          details: "Serwis realizowany u producenta",
        };
      default:
        return null;
    }
  };

  const conditionDescriptions = {
    uzywany:
      "Produkt po profesjonalnym remoncie, kompleksowo sprawdzony i przetestowany. Gotowy do natychmiastowego użycia, objęty 1-miesieczną gwarancją rozruchową.",
    nieuzywany:
      "Produkt fabrycznie nowy, który nie był używany, ale był przechowywany w magazynie. Może nosić minimalne ślady składowania, zachowuje pełną sprawność techniczną i 12-miesięczną gwarancję.",
    nowy: "Produkt fabrycznie nowy, prosto od producenta. Nigdy nie użytkowany, w oryginalnym opakowaniu, objęty 24-miesięczną gwarancją.",
  };

  const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
    isSelected,
    onSelect,
    title,
    description,
    icon,
    cost,
  }) => (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
        "hover:bg-accent/50",
        isSelected && "ring-2 ring-primary",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Koszt dostawy:{" "}
          {cost.toLocaleString("pl-PL", {
            style: "currency",
            currency: "PLN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div
        className={cn(
          "h-5 w-5 rounded-full border-2",
          isSelected && "border-primary bg-primary",
        )}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>
    </div>
  );

  // Zostawiamy tylko ten jeden useEffect dla tooltipów
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipPosition) {
        const tooltip = document.querySelector(
          `[data-tooltip="${tooltipPosition.type}"]`,
        );
        const button = tooltipPosition.buttonRef;

        if (
          !tooltip?.contains(e.target as Node) &&
          !button?.contains(e.target as Node)
        ) {
          setTooltipPosition(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [tooltipPosition]);

  const DescriptionSection = ({
    description,
    isExpanded,
  }: {
    description: string | undefined;
    isExpanded: boolean;
  }) => {
    if (!description || description.length < 5) {
      return null;
    }

    const h2Match = description.match(/<h2[^>]*>(.*?)<\/h2>/);
    const firstParagraphMatch = description.match(/<p[^>]*>(.*?)<\/p>/);

    const headerText = h2Match ? h2Match[1].replace(/<[^>]+>/g, "") : "";
    const paragraphText = firstParagraphMatch
      ? firstParagraphMatch[1].replace(/<[^>]+>/g, "")
      : "";
    const shortPreview =
      paragraphText.split(" ").slice(0, 15).join(" ") + "...";

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {!isExpanded ? (
          <>
            <h2 className="text-2xl font-semibold mb-2">{headerText}</h2>
            <p className="text-base text-muted-foreground">{shortPreview}</p>
          </>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: description }}
            className="[&>h2]:text-2xl [&>h2]:font-semibold [&>p]:text-base [&>p]:leading-relaxed [&>.technical-specs]:bg-muted [&>.technical-specs]:p-4 [&>.technical-specs]:rounded-lg [&>.applications]:border-l-4 [&>.applications]:border-primary [&>.applications]:pl-4"
          />
        )}
      </div>
    );
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (product.description && product.description.length > 350) {
      setShouldShowButton(true);
    }
  }, [product.description]);

  const [shippingCosts, setShippingCosts] = useState({
    prepaid: 0,
    cod: 0,
  });
  const [shippingMethods, setShippingMethods] = useState<{
    prepaid: number;
    cod: number | null;
  }>({ prepaid: 0, cod: null });
  const [paymentMethod, setPaymentMethod] = useState<"prepaid" | "cod">(
    "prepaid",
  );
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPrepaidInfo, setShowPrepaidInfo] = useState(false);
  const [showCodInfo, setShowCodInfo] = useState(false);
  const [clickPosition, setClickPosition] = useState<ClickPosition | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [showDeliveryCalendar, setShowDeliveryCalendar] = useState(false);

  const excludedManufacturers = [
    "silnik",
    "falownik",
    "kołnierz",
    "motoreduktor",
    "wentylator",
    "pompa",
    "zbiornik",
    "napinacz",
  ];

  const getConditionDisplay = (condition: string) => {
    const conditionMap = {
      uzywany: "Używany",
      nowy: "Nowy",
      nieuzywany: "Nieużywany",
    };
    return conditionMap[condition as keyof typeof conditionMap] || condition;
  };

  if (!product) {
    return <div>Ładowanie...</div>;
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const deliveryInfo = document.querySelector("[data-delivery-info]");
      const deliveryButton = document.querySelector("[data-delivery-button]");

      if (showDeliveryCalendar && deliveryInfo && deliveryButton) {
        if (
          !deliveryInfo.contains(e.target as Node) &&
          !deliveryButton.contains(e.target as Node)
        ) {
          setShowDeliveryCalendar(false);
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [showDeliveryCalendar]);

  const calculateShippingCost = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Debugujemy podstawowe dane
      const productId = product._id || product.id;
      const totalWeight = product.weight * quantity;

      console.log("DEBUG: Dane produktu:", {
        productId,
        name: product.name,
        weight: product.weight,
        quantity,
        totalWeight,
        paymentMethod,
      });

      if (paymentMethod === "cod" && totalWeight > 575) {
        console.log("DEBUG: Płatność za pobraniem niedostępna dla tej wagi");
        setShippingCosts({
          ...shippingCosts,
          cod: 0,
        });
        setCalculationError("Płatność za pobraniem niedostępna dla tej wagi");
        return;
      }

      // Parametry dla prepaid
      const prepaidParams = {
        items: [
          {
            productId,
            quantity,
          },
        ],
        paymentMethod: "prepaid",
      };

      console.log("DEBUG: Parametry dla prepaid:", prepaidParams);

      // Parametry dla COD (jeśli dostępne)
      const codParams =
        totalWeight <= 575
          ? {
              items: [
                {
                  productId,
                  quantity,
                },
              ],
              paymentMethod: "cod",
            }
          : null;

      if (codParams) {
        console.log("DEBUG: Parametry dla COD:", codParams);
      } else {
        console.log("DEBUG: COD niedostępne dla tej wagi");
      }

      const [prepaidResponse, codResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(prepaidParams),
        }),
        codParams
          ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(codParams),
            })
          : Promise.resolve(null),
      ]);

      console.log("DEBUG: Status odpowiedzi prepaid:", prepaidResponse.status);
      if (codResponse) {
        console.log("DEBUG: Status odpowiedzi COD:", codResponse.status);
      }

      // Klonujemy response, bo możemy je odczytać tylko raz
      const prepaidResponseClone = prepaidResponse.clone();
      let prepaidText;

      try {
        prepaidText = await prepaidResponseClone.text();
        console.log("DEBUG: Prepaid response text:", prepaidText);
      } catch (e) {
        console.error("DEBUG: Błąd odczytu tekstu prepaid:", e);
      }

      // Ostrożnie pozyskujemy dane JSON
      let prepaidData;
      try {
        prepaidData = await prepaidResponse.json();
        console.log("DEBUG: Odpowiedź prepaid:", prepaidData);
      } catch (e) {
        console.error("DEBUG: Błąd parsowania JSON prepaid:", e);
        throw new Error("Nieprawidłowa odpowiedź serwera dla płatności online");
      }

      let codData = { data: { cost: 0 } };
      if (codResponse) {
        try {
          const codResponseClone = codResponse.clone();

          try {
            const codText = await codResponseClone.text();
            console.log("DEBUG: COD response text:", codText);
          } catch (e) {
            console.error("DEBUG: Błąd odczytu tekstu COD:", e);
          }

          codData = await codResponse.json();
          console.log("DEBUG: Odpowiedź COD:", codData);
        } catch (e) {
          console.error("DEBUG: Błąd parsowania JSON COD:", e);
          // Używamy domyślnego kosztu
        }
      }

      // Sprawdzamy, czy odpowiedź zawiera pole success
      if (prepaidData.success === false) {
        console.error("DEBUG: Błąd w odpowiedzi prepaid:", prepaidData.error);
        throw new Error(prepaidData.error || "Błąd obliczania kosztów wysyłki");
      }

      // Bezpieczne pozyskiwanie kosztów
      const prepaidCost = prepaidData.data?.cost ?? 0;
      const codCost = codData.data?.cost ?? 0;

      console.log("DEBUG: Pozyskane koszty:", {
        prepaid: prepaidCost,
        cod: codCost,
      });

      setShippingCosts({
        prepaid: prepaidCost,
        cod: codCost,
      });
    } catch (error) {
      console.error("DEBUG: Błąd w calculateShippingCost:", error);
      setShippingCosts({ prepaid: 0, cod: 0 });
      setCalculationError(
        error instanceof Error ? error.message : "Nieznany błąd",
      );
    } finally {
      setIsCalculating(false);
    }
  }, [product, quantity, paymentMethod]);

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleNextImage = () => {
    setActiveImageIndex(
      (prev) =>
        (prev + 1) % (product.galleryImages?.length || product.images.length),
    );
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0
        ? (product.galleryImages?.length || product.images.length) - 1
        : prev - 1,
    );
  };

  // Wywołujemy obliczenia przy zmianie metody płatności lub ilości
  useEffect(() => {
    calculateShippingCost();
  }, [paymentMethod, quantity]);

  const handleShippingSubmit = async (data: ExtendedShippingAddress) => {
    try {
      const currentShippingCost =
        paymentMethod === "cod" ? shippingCosts.cod : shippingCosts.prepaid;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                productId: product._id || product.id!,
                quantity,
                name: product.name,
                price,
                image: product.images[0],
                weight: product.weight,
              },
            ],
            totalWeight: product.weight * quantity,
            shipping: data,
            shippingCost: currentShippingCost,
            paymentMethod,
            total: price * quantity + currentShippingCost,
            returnUrl: window.location.href,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result.data;
    } catch (error) {
      console.error("Błąd podczas tworzenia zamówienia:", error);
      throw error;
    }
  };

  const price = product.marketplaces?.ownStore?.price || 0;

  const handleAddToCart = async () => {
    try {
      if (!product) {
        console.error("Produkt jest undefined");
        return;
      }

      const categorySlug = product.categories?.[0]?.slug;
      const productSlug = product.marketplaces?.ownStore?.slug;

      if (!categorySlug || !productSlug) {
        console.error("Brak wymaganych danych produktu:", {
          categorySlug,
          productSlug,
        });
        throw new Error("Brak wymaganych danych produktu");
      }

      // Sprawdzamy czy produkt już jest w koszyku
      const existingItem = cart.items.find(
        (item) => item.productId === (product._id || product.id),
      );

      if (existingItem) {
        // Jeśli produkt już jest w koszyku, po prostu przekierowujemy do checkoutu
        router.push("/checkout");
        return;
      }

      // Jeśli produktu nie ma w koszyku, dodajemy go
      addItem({
        productId: product._id || product.id!,
        quantity: quantity,
        name: product.name,
        price: price,
        image: product.mainImage || product.images[0],
        stock: product.stock || 0,
        weight: product.weight,
        mainImage: product.mainImage,
        slug: productSlug,
        categorySlug: categorySlug,
        manufacturer: product.manufacturer,
        shaftDiameter: product.shaftDiameter,
        condition: product.condition,
        mechanicalSize: product.mechanicalSize,
        categories:
          product.categories?.map((cat) => ({
            id: cat.id,
            slug: cat.slug,
          })) || [],
        marketplaces: {
          ownStore: {
            active: true,
            price: price,
            slug: productSlug,
          },
        },
        images: product.images,
      });

      trackEvent("add_to_cart_conversion", {
        location: getPageLocation(),
        productId: product._id || product.id,
        product_name: product.name,
        product_price: price,
        quantity: quantity,
        category: product.categories?.[0]?.name || "unknown",
        categoryId: product.categories?.[0]?.id || "unknown",
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });

      router.push("/checkout");
    } catch (error) {
      console.error("Błąd podczas dodawania do koszyka:", error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galeria zdjęć */}
        <div className="space-y-4">
          {/* Główne zdjęcie */}
          <motion.div className="aspect-square relative overflow-hidden rounded-lg border group">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeImageIndex}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full h-full"
              >
                <Image
                  src={
                    activeImageIndex === 0
                      ? product.mainImage || product.images[0]
                      : product.galleryImages?.[activeImageIndex - 1] ||
                        product.images[activeImageIndex]
                  }
                  alt={product.name}
                  fill
                  className="object-cover cursor-pointer"
                  onClick={handleFullScreen}
                />
              </motion.div>
            </AnimatePresence>

            {/* Strzałki nawigacji - tylko jeśli jest więcej niż jedno zdjęcie 
            {(product.images.length > 1 ||
              (product.galleryImages && product.galleryImages.length > 0)) && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/40 dark:bg-black/40 rounded-full p-1.5 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all duration-200 z-10"
                  aria-label="Poprzednie zdjęcie"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/40 dark:bg-black/40 rounded-full p-1.5 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all duration-200 z-10"
                  aria-label="Następne zdjęcie"
                >
                <ChevronRight className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                </button>
              </>
            )}*/}
          </motion.div>

          {/* Miniatury - tylko jeśli jest więcej niż jedno zdjęcie */}
          {(product.images.length > 1 ||
            (product.galleryImages && product.galleryImages.length > 0)) && (
            <div className="grid grid-cols-4 gap-2">
              {/* Miniatura głównego zdjęcia */}
              {(product.mainImage || product.images[0]) && (
                <div
                  className={cn(
                    "aspect-square relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-200",
                    activeImageIndex === 0 && "ring-2 ring-primary",
                  )}
                  onClick={() => setActiveImageIndex(0)}
                >
                  <Image
                    src={product.mainImage || product.images[0]}
                    alt={`${product.name} - zdjęcie główne`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Miniatury galerii */}
              {(product.galleryImages || product.images.slice(1)).map(
                (image: string, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "aspect-square relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-200",
                      activeImageIndex === index + 1 && "ring-2 ring-primary",
                    )}
                    onClick={() => setActiveImageIndex(index + 1)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - zdjęcie ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Informacje o produkcie */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">
            {capitalizeFirstLetter(product.name)}
          </h1>

          <div className="grid grid-cols-2 gap-4">
            {" "}
            {product.condition && (
              <div className="space-y-2 relative">
                <p className="text-sm text-gray-500">Stan</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium capitalize">
                    {getConditionDisplay(product.condition)}
                  </p>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors relative"
                    onClick={(e) => handleTooltipClick(e, "condition")}
                  >
                    <Info className="h-4 w-4" />
                    {tooltipPosition?.type === "condition" &&
                      tooltipPosition.buttonRef && (
                        <div className="absolute left-0 md:-left-20 top-full mt-2 z-50">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            }}
                            className="w-64"
                          >
                            <div
                              data-tooltip
                              className="bg-background border rounded-xl shadow-lg p-4 relative"
                            >
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background border-t border-l" />
                              <div className="relative bg-background rounded-lg p-1">
                                <p className="text-sm leading-relaxed text-foreground">
                                  {
                                    conditionDescriptions[
                                      product.condition as keyof typeof conditionDescriptions
                                    ]
                                  }
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                  </button>
                </div>
              </div>
            )}
            {/* Dodajemy informację o gwarancji */}
            {product.condition && (
              <div className="space-y-2 relative">
                <p className="text-sm text-gray-500">Gwarancja</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {getWarrantyInfo(product.condition)?.period}
                    </p>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors relative"
                      onClick={(e) => handleTooltipClick(e, "warranty")}
                    >
                      <Info className="h-4 w-4" />
                      {tooltipPosition?.type === "warranty" &&
                        tooltipPosition.buttonRef && (
                          <div className="absolute right-0 md:-right-20 top-full mt-2 z-50">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{
                                type: "spring",
                                damping: 20,
                                stiffness: 300,
                              }}
                              className="w-64"
                            >
                              <div
                                data-tooltip={tooltipPosition.type}
                                className="bg-background border rounded-xl shadow-lg p-4 relative"
                              >
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background border-t border-l" />
                                <div className="relative bg-background rounded-lg p-1">
                                  <p className="text-sm font-medium mb-1">
                                    Gwarancja{" "}
                                    {getWarrantyInfo(product.condition)?.period}{" "}
                                    {getWarrantyInfo(product.condition)?.type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {
                                      getWarrantyInfo(product.condition)
                                        ?.details
                                    }
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="py-4 border-t border-b">
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {price.toLocaleString("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  brutto
                </span>
              </div>

              <div>
                {product.stock > 0 ? (
                  <div className="text-green-600">
                    Dostępne: {product.stock} szt.
                  </div>
                ) : (
                  <div className="text-red-600">Niedostępne</div>
                )}
              </div>
            </div>

            {/* Nowy kontener dla Dostawy i Wysyłki */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div className="text-sm text-muted-foreground">
                Dostawa:{" "}
                {shippingCosts.prepaid.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </div>

              {/* Sekcja informacji o wysyłce */}
              <div className="relative">
                <div data-delivery-button className="flex items-center gap-2">
                  <div className="p-1.5 bg-background rounded-full">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Wysyłka {deliveryInfo}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {product.stock > 1 && (
                <>
                  <label className="text-sm">Ilość:</label>
                  <div className="flex items-center h-10 rounded-md border overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/30 transition-colors"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Zmniejsz ilość"
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>

                    <div className="relative w-12 h-full">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                          key={quantity}
                          initial={{ y: quantity > 1 ? 20 : -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: quantity > 1 ? -20 : 20, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className="absolute inset-0 flex items-center justify-center font-medium"
                        >
                          {quantity}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center justify-center w-10 h-full text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/30 transition-colors"
                      onClick={() =>
                        setQuantity(
                          Math.min(Math.min(1000, product.stock), quantity + 1),
                        )
                      }
                      disabled={quantity >= Math.min(1000, product.stock)}
                      aria-label="Zwiększ ilość"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                </>
              )}
              <Button
                size="lg"
                className="w-full"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                {quantity === 1
                  ? "Zamów teraz"
                  : `Zamów teraz ${quantity} produkty`}
              </Button>
            </div>
          </div>

          {/* Dialog potwierdzający dodanie do koszyka 
          <ModalCheckout
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            orderSummary={{
              name: product.name,
              image: product.images[0],
              quantity: quantity,
              price: price,
              shippingCost: shippingCosts[paymentMethod],
              stock: product.stock,
              paymentMethod: paymentMethod,
            }}
            onQuantityChange={(newQuantity) => {
              setQuantity(newQuantity);
              calculateShippingCost();
            }}
          >
            Sposób płatności
            <div className="space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4">
                  Wybierz sposób płatności
                </h3>

            Payment methods grid 
                <div className="grid gap-4">
                   Online payment
                  <PaymentMethodCard
                    isSelected={paymentMethod === "prepaid"}
                    onSelect={() => setPaymentMethod("prepaid")}
                    title="Płatność online"
                    description="Szybki przelew bankowy online, BLIK, Google Pay, karta płatnicza"
                    icon={<CreditCard className="h-5 w-5" />}
                    cost={shippingCosts.prepaid}
                  />

                   COD payment 
                  {product.weight <= 575 && (
                    <PaymentMethodCard
                      isSelected={paymentMethod === "cod"}
                      onSelect={() => setPaymentMethod("cod")}
                      title="Płatność za pobraniem"
                      description="Gotówką przy odbiorze"
                      icon={<Banknote className="h-5 w-5" />}
                      cost={shippingCosts.cod}
                    />
                  )}
                </div>
              </div>

               Checkout form
              <CheckoutForm
                onSubmit={handleShippingSubmit}
                paymentMethod={paymentMethod}
                totalWeight={product.weight * quantity}
                product={product}
                quantity={quantity}
                price={price}
                shippingCost={shippingCost}
              />
            </div>
          </ModalCheckout>*/}

          {/* Szczegóły techniczne */}
          <div className="mt-8 space-y-8">
            <div className="mt-12">
              <div className="grid grid-cols-2 gap-4">
                {product.power?.value && product.power.value !== "0" && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Moc</p>
                    <p className="font-medium">
                      {formatPowerValue(product.power.value)}
                    </p>
                  </div>
                )}
                {product.rpm?.value && product.rpm.value !== "0" && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Obroty</p>
                    <p className="font-medium">
                      {formatRpmValue(product.rpm.value)}
                    </p>
                  </div>
                )}

                {Number(product.weight) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Waga</p>
                    <p className="font-medium">
                      {Number(product.weight).toLocaleString("pl-PL")} kg
                    </p>
                  </div>
                )}

                {/* Reszta szczegółów technicznych bez zmian */}
                {Number(product.shaftDiameter) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Średnica wału</p>
                    <p className="font-medium">{product.shaftDiameter} mm</p>
                  </div>
                )}

                {Number(product.sleeveDiameter) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Średnica tulei</p>
                    <p className="font-medium">{product.sleeveDiameter} mm</p>
                  </div>
                )}

                {Number(product.flangeSize) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Średnica zamka kołnierza
                    </p>
                    <p className="font-medium">{product.flangeSize} mm</p>
                  </div>
                )}

                {Number(product.flangeBoltCircle) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Średnica podziałowa otworów
                    </p>
                    <p className="font-medium">{product.flangeBoltCircle} mm</p>
                  </div>
                )}

                {product.startType && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Rodzaj rozruchu</p>
                    <p className="font-medium">{product.startType}</p>
                  </div>
                )}

                {Number(product.mechanicalSize) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Wielkość mechaniczna
                    </p>
                    <p className="font-medium">{product.mechanicalSize}</p>
                  </div>
                )}

                {product.manufacturer &&
                  product.manufacturer !== "" &&
                  !excludedManufacturers.includes(
                    product.manufacturer.toLowerCase(),
                  ) && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Producent</p>
                      <p className="font-medium">{product.manufacturer}</p>
                    </div>
                  )}

                {product.legSpacing && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Rozstaw łap</p>
                    <p className="font-medium">{product.legSpacing} mm</p>
                  </div>
                )}

                {product.hasBreak && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      Hamulec
                      <Check className="w-4 h-4 text-green-500" />
                    </p>
                  </div>
                )}

                {product.hasEx && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      Wykonanie Ex
                      <Check className="w-4 h-4 text-green-500" />
                    </p>
                  </div>
                )}

                {product.hasForeignCooling && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      Obce chłodzenie
                      <Check className="w-4 h-4 text-green-500" />
                    </p>
                  </div>
                )}

                {product.customParameters &&
                  product.customParameters.length > 0 && (
                    <>
                      {product.customParameters.map((param, index) => (
                        <div key={index} className="space-y-2">
                          <p className="text-sm text-gray-500">{param.name}</p>
                          <p className="font-medium">{param.value}</p>
                        </div>
                      ))}
                    </>
                  )}

                {(product.name.includes(" OMT") ||
                  product.name.includes(" MS") ||
                  product.name.includes(" MY") ||
                  product.name.includes(" ML")) && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Możliwy montaż</p>
                    <p className="font-medium">B3, B34, B35, B14, B5</p>
                  </div>
                )}
              </div>

              {/* Karta katalogowa i dokumentacja */}
              {((Array.isArray(product.dataSheets) &&
                product.dataSheets.length > 0) ||
                product.technicalDetails) && (
                <div className="mt-6 pt-4 border-t space-y-4">
                  {product.dataSheets && product.dataSheets.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Karta katalogowa
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.dataSheets.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-3 rounded-md border border-input hover:bg-accent"
                          >
                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                              <FileText className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="flex-grow">
                              <span className="block font-medium">
                                Karta katalogowa {index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                PDF - otwórz w nowej karcie
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.technicalDetails && (
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Dokumentacja techniczna
                      </h3>
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground bg-muted/50 rounded-lg p-4"
                        dangerouslySetInnerHTML={{
                          __html: product.technicalDetails,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opis pod szczegółami technicznymi */}
            {product.description && product.description.length >= 5 && (
              <div className="relative space-y-4">
                <DescriptionSection
                  description={product.description}
                  isExpanded={isExpanded}
                />
                {shouldShowButton && (
                  <div className="text-center mt-4">
                    <button
                      onClick={handleToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full bg-muted/50 hover:bg-muted"
                    >
                      <span>{isExpanded ? "Zwiń opis" : "Rozwiń opis"}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={handleFullScreen}
          >
            <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <Image
                    src={
                      activeImageIndex === 0
                        ? product.mainImage || product.images[0]
                        : product.galleryImages?.[activeImageIndex - 1] ||
                          product.images[activeImageIndex]
                    }
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Strzałki nawigacji w trybie pełnoekranowym - tylko jeśli jest więcej niż jedno zdjęcie 
              {(product.images.length > 1 ||
                (product.galleryImages && product.galleryImages.length > 0)) && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-3 hover:bg-white/30 transition-colors duration-200 z-10"
                    aria-label="Poprzednie zdjęcie"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-3 hover:bg-white/30 transition-colors duration-200 z-10"
                    aria-label="Następne zdjęcie"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}*/}

              {/* Miniatury na dole w trybie pełnoekranowym - tylko jeśli jest więcej niż jedno zdjęcie */}
              {(product.images.length > 1 ||
                (product.galleryImages &&
                  product.galleryImages.length > 0)) && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {(product.mainImage || product.images[0]) && (
                    <div
                      className={cn(
                        "w-16 h-16 relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-200",
                        activeImageIndex === 0 && "ring-2 ring-primary",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(0);
                      }}
                    >
                      <Image
                        src={product.mainImage || product.images[0]}
                        alt={`${product.name} - zdjęcie główne`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {(product.galleryImages || product.images.slice(1)).map(
                    (image: string, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "w-16 h-16 relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-200",
                          activeImageIndex === index + 1 &&
                            "ring-2 ring-primary",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(index + 1);
                        }}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} - zdjęcie ${index + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Przycisk zamknięcia */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFullScreen();
                }}
                className="absolute top-8 right-8 bg-white/20 rounded-full p-3 hover:bg-white/30 transition-colors duration-200 z-10"
                aria-label="Zamknij"
              >
                <X className="w-8 h-8 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SimilarProducts productId={product.id ?? product._id ?? ""} />
    </div>
  );
};

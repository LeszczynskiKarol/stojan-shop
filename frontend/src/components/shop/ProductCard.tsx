// frontend/src/components/shop/ProductCard.tsx
"use client";
import { formatPrice } from "@/utils/formatPrice";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IProduct } from "@/types/product.types";
import { useToast } from "@/components/ui/use-toast";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProductCardProps {
  product: IProduct;
  isHomePage?: boolean;
}

export const ProductCard = ({
  product: initialProduct,
  isHomePage = false,
}: ProductCardProps) => {
  const { toast } = useToast();
  const { trackEvent, getPageLocation } = useAnalytics();
  const { updateProductStock } = useProductStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [wasAddButtonClicked, setWasAddButtonClicked] = useState(false);
  const [shippingCosts, setShippingCosts] = useState({
    prepaid: 0,
    cod: 0,
  });
  const [shippingCost, setShippingCost] = useState<number>(0);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px to standardowy breakpoint dla mobile
    };

    // Sprawdź przy starcie
    checkMobile();

    // Sprawdzaj przy zmianie rozmiaru okna
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);
  const price = product.marketplaces?.ownStore?.price || 0;

  const mainCategories = [
    "trojfazowe",
    "jednofazowe",
    "wentylatory-przemyslowe",
    "motoreduktory",
    "z-hamulcem",
    "dwubiegowe",
    "pierscieniowe",
    "akcesoria",
  ];

  const categorySlug = (() => {
    // Najpierw sprawdź category_path z marketplaces
    if (product.marketplaces?.ownStore?.category_path) {
      const originalPath = product.marketplaces.ownStore.category_path;
      // Usuwamy ukośniki z początku i końca
      const cleanPath = originalPath.replace(/^\/|\/$/g, "");
      // Dodajemy warunek dla /z-hamulcem/
      if (cleanPath === "z-hamulcem") {
        return "z-hamulcem";
      }
      // Jeśli nie jest to z-hamulcem, obcinamy całą resztę
      return cleanPath.split("/")[0];
    }

    // Jeśli nie ma category_path, szukaj głównej kategorii
    const mainCategory = product.categories?.find((cat) =>
      mainCategories.includes(cat.slug)
    );

    if (mainCategory) {
      return mainCategory.slug;
    }

    return product.categories?.[0]?.slug;
  })();
  const productSlug = product.marketplaces?.ownStore?.slug;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Sprawdzenie stanu magazynowego
      const checkStockResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/check-stock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id || product._id,
            requestedQuantity: quantity,
          }),
        }
      );

      const stockData = await checkStockResponse.json();

      if (!stockData.success || !stockData.data.isAvailable) {
        toast({
          title: "Produkt niedostępny",
          description: "Przepraszamy, ale produkt nie jest już dostępny...",
          variant: "destructive",
        });

        setProduct((prev) => ({
          ...prev,
          stock: stockData.data.currentStock,
        }));
        return;
      }

      addItem({
        productId: product._id || product.id!,
        quantity: quantity,
        name: product.name,
        price: price,
        image: product.mainImage || product.images[0],
        weight: product.weight,
        mainImage: product.mainImage,
        slug: productSlug,
        categorySlug: categorySlug,
        stock: product.stock || 0,
        manufacturer: product.manufacturer,
        shaftDiameter: product.shaftDiameter,
        condition: product.condition,
        mechanicalSize: product.mechanicalSize,
        // Dodajemy domyślną wartość dla categories jeśli jest undefined
        categories: product.categories?.map((cat) => ({
          id: cat.id,
          slug: cat.slug,
        })) || [{ id: categorySlug || "", slug: categorySlug || "" }],
        marketplaces: {
          ownStore: {
            active: true,
            price: price,
            slug: productSlug,
          },
        },
        images: product.images,
      });

      // Obliczenie kosztów wysyłki
      const [prepaidResponse, codResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                productId: product._id || product.id,
                quantity: quantity,
              },
            ],
            paymentMethod: "prepaid",
          }),
        }),
        product.weight * quantity <= 575
          ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items: [
                  {
                    productId: product._id || product.id,
                    quantity: quantity,
                  },
                ],
                paymentMethod: "cod",
              }),
            })
          : Promise.resolve(null),
      ]);

      const prepaidData = await prepaidResponse.json();
      const codData = codResponse
        ? await codResponse.json()
        : { data: { cost: 0 } };

      setShippingCosts({
        prepaid: prepaidData.data.cost,
        cod: codData.data.cost,
      });

      // Śledzenie eventu
      await trackEvent("add_to_cart_conversion", {
        location: getPageLocation(),
        product_id: product._id || product.id,
        product_name: product.name,
        product_category: product.categories?.[0]?.name,
        product_price: price,
        quantity: quantity,
        total_value: price * quantity,
        currency: "PLN",
        timestamp: new Date().toISOString(),
      });

      // Aktualizacja stanu
      updateProductStock(product.id!, product.stock - quantity);
      setProduct((prev) => ({
        ...prev,
        stock: prev.stock - quantity,
      }));

      toast({
        title: "Dodano do koszyka",
        description: `${quantity} x ${product.name}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Błąd podczas dodawania do koszyka:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać produktu do koszyka",
        variant: "destructive",
      });
    }
  };

  // Funkcja do kapitalizacji pierwszej litery
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div
      className="relative group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Linka obejmuje TYLKO główną część karty */}
      <Link
        href={`/${categorySlug}/${productSlug}`}
        onClick={async () => {
          await trackEvent("product_click", {
            location: getPageLocation(),
            product_id: product._id || product.id,
            product_name: product.name,
            product_category: product.categories?.[0]?.name,
            timestamp: new Date().toISOString(),
          });
        }}
      >
        {/* Zdjęcie produktu */}
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.mainImage || product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Podstawowe informacje */}
        <div className="p-4">
          <h3 className="text-sm font-medium line-clamp-2 mb-2 text-card-foreground">
            {capitalizeFirstLetter(product.name)}
          </h3>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="font-medium text-lg text-card-foreground">
              {formatPrice(price)}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm transition-all duration-300 transform group-hover:scale-[1.02] overflow-hidden border bg-card"></div>

        {/* Nakładka na hover */}
        <AnimatePresence>
          {isHovered && !isMobile && !isHomePage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col pointer-events-auto"
            >
              {/* Górna część z informacjami */}
              <div className="flex-1 p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-background/95 via-background/95 to-background/95 dark:from-background/98 dark:via-background/98 dark:to-background/98 backdrop-blur-[2px]">
                <h3 className="font-medium text-base md:text-lg lg:text-xl text-foreground line-clamp-2">
                  {capitalizeFirstLetter(product.name)}
                </h3>

                <div className="space-y-2 text-sm md:text-base">
                  {product.power.value !== "0" && (
                    <div className="flex justify-between text-card-foreground items-center">
                      <span className="text-muted-foreground">Moc:</span>
                      <span className="font-medium">{product.power.value}</span>
                    </div>
                  )}

                  {product.rpm.value !== "0" && (
                    <div className="flex justify-between text-card-foreground items-center">
                      <span className="text-muted-foreground">Obroty:</span>
                      <span className="font-medium">
                        {product.rpm.value} obr./min
                      </span>
                    </div>
                  )}

                  {product.shaftDiameter > 0 && (
                    <div className="flex justify-between text-card-foreground items-center">
                      <span className="text-muted-foreground">Śr. wału:</span>
                      <span className="font-medium">
                        {product.shaftDiameter} mm
                      </span>
                    </div>
                  )}

                  {product.mechanicalSize > 0 && (
                    <div className="flex justify-between text-card-foreground items-center">
                      <span className="text-muted-foreground">
                        Wielkość mech.:
                      </span>
                      <span className="font-medium">
                        {product.mechanicalSize}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dolna część z przyciskami */}
              <div className="p-4 bg-gradient-to-b from-background/95 via-background/95 to-background/95">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setWasAddButtonClicked(true); // Ustawiamy flagę
                        handleAddToCart(e);
                        return false;
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Do koszyka
                    </Button>
                  </div>

                  <div className="text-xl font-bold text-center text-card-foreground">
                    {formatPrice(price)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </div>
  );
};

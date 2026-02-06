// frontend/src/components/shop/CartWidget.tsx
"use client";
import React, { useEffect, useCallback, useState, useRef } from "react";
import { formatPrice } from "@/utils/formatPrice";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Receipt,
  Package,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export const CartWidget = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const widgetRef = useRef<HTMLDivElement>(null);

  // Pobieramy wszystko z store
  const {
    cart,
    isDropdownOpen,
    setDropdownOpen,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  // PRZENIEŚ TE HOOKI TUTAJ - PRZED WARUNKOWYM RETURNEM!
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(64);

  // Obliczenia (przed useCallback aby były dostępne)
  const itemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsTotal = cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalWeight = cart.items.reduce(
    (sum, item) => sum + (item.weight || 0) * item.quantity,
    0
  );

  // useCallback też musi być PRZED warunkowym returnem
  const calculateShippingCost = useCallback(async () => {
    if (!cart.items || cart.items.length === 0) {
      setShippingCost(0);
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            paymentMethod: "prepaid",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.cost) {
          setShippingCost(data.data.cost);
        }
      }
    } catch (error) {
      console.error("Błąd obliczania kosztów dostawy:", error);
      setShippingCost(0);
    } finally {
      setIsCalculating(false);
    }
  }, [cart.items]);

  // useEffect też musi być PRZED warunkowym returnem
  useEffect(() => {
    calculateShippingCost();
  }, [calculateShippingCost]);

  // Obserwuj wysokość headera
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        const height = header.getBoundingClientRect().height;
        setHeaderHeight(height);
      }
    };

    updateHeaderHeight();
    window.addEventListener("scroll", updateHeaderHeight);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("scroll", updateHeaderHeight);
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  // Ustaw CSS variable dla wysokości CartWidget
  useEffect(() => {
    if (itemsCount > 0 && widgetRef.current) {
      const height = widgetRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--cart-widget-height",
        `${height}px`
      );
    } else {
      document.documentElement.style.setProperty("--cart-widget-height", "0px");
    }

    return () => {
      document.documentElement.style.setProperty("--cart-widget-height", "0px");
    };
  }, [itemsCount, isDropdownOpen]);

  if (pathname === "/checkout" || pathname.startsWith("/checkout")) {
    return null;
  }

  // TERAZ DOPIERO warunkowe returny
  if (pathname === "/checkout" || pathname.startsWith("/checkout")) {
    return null;
  }

  // Funkcja pomocnicza dla tekstu
  const getProductText = (count: number) => {
    if (count === 1) return "produkt";
    if (
      count % 10 >= 2 &&
      count % 10 <= 4 &&
      (count % 100 < 10 || count % 100 >= 20)
    ) {
      return "produkty";
    }
    return "produktów";
  };

  // Obsługa aktualizacji ilości
  const handleQuantityUpdate = (productId: string, delta: number) => {
    const item = cart.items.find((i) => i.productId === productId);
    if (item) {
      const newQuantity = Math.max(
        1,
        Math.min(item.quantity + delta, item.stock || 99)
      );
      updateQuantity(productId, newQuantity);
    }
  };

  // Obsługa usuwania produktu
  const handleRemoveItem = (productId: string) => {
    const item = cart.items.find((i) => i.productId === productId);
    if (item) {
      removeItem(productId);
      toast({
        title: "Usunięto z koszyka",
        description: item.name,
        duration: 2000,
      });
    }
  };

  // Obsługa czyszczenia koszyka
  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Koszyk został wyczyszczony",
      duration: 2000,
    });
  };

  // Jeśli koszyk pusty, nie pokazuj
  if (itemsCount === 0) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ top: `${headerHeight}px` }}
      className="fixed top-16 left-0 right-0 z-40 bg-background border-b shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="py-3 flex items-center justify-between">
          {/* Lewa strona - informacje o koszyku */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {itemsCount} {getProductText(itemsCount)}
              </span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatPrice(itemsTotal)}
            </div>
          </div>

          {/* Prawa strona - przyciski */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2"
            >
              {isDropdownOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Zwiń</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Pokaż</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => router.push("/checkout")}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Receipt className="w-4 h-4" />
              <span>Zamów</span>
            </Button>
          </div>
        </div>

        {/* Rozwijana zawartość koszyka */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t"
            >
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                {/* Lista produktów */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-card rounded-lg p-3 border"
                    >
                      <div className="flex gap-3">
                        {/* Zdjęcie produktu */}
                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Informacje o produkcie */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${item.categorySlug}/${item.slug}`}
                            className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(item.price)} / szt.
                          </div>

                          {/* Kontrolki ilości */}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleQuantityUpdate(item.productId, -1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-10 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleQuantityUpdate(item.productId, 1)
                              }
                              disabled={item.quantity >= (item.stock || 99)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>

                            <div className="ml-auto flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {formatPrice(item.price * item.quantity)}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Podsumowanie */}
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Wartość produktów:
                    </span>
                    <span className="font-medium">
                      {formatPrice(itemsTotal)}
                    </span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dostawa:</span>
                      <span className="font-medium">
                        {isCalculating ? (
                          <span className="text-xs">Obliczanie...</span>
                        ) : (
                          `${formatPrice(shippingCost)}`
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Razem:</span>
                    <span className="text-primary">
                      {formatPrice(itemsTotal + (shippingCost || 0))}
                    </span>
                  </div>
                </div>

                {/* Przyciski akcji */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClearCart}
                  >
                    Wyczyść koszyk
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/checkout");
                    }}
                  >
                    Przejdź do kasy
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

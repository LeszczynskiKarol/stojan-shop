// frontend/src/app/checkout/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useCartStore } from "@/store/cartStore";
import { ExtendedShippingAddress } from "@/types/order.types";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import React, { useState, useEffect, useCallback } from "react";
import { CartStore } from "@/store/cartStore";
import { CartItem } from "@/types/cart.types";
import { motion } from "framer-motion";
import Image from "next/image";
import { Plus, Minus, X, CreditCard, Banknote } from "lucide-react";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { PaymentMethodCard } from "@/components/shop/PaymentMethodCard";
import { formatPrice } from "@/utils/formatPrice";

interface DeleteModalProps {
  item: CartItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface DeleteModalProps {
  item: CartItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

// Komponent modalu

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<CartItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"prepaid" | "cod">(
    "prepaid"
  );
  const [cartQuantities, setCartQuantities] = useState<{
    [key: string]: number;
  }>(
    Object.fromEntries(
      cart.items.map((item) => [item.productId, item.quantity])
    )
  );
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [shippingCosts, setShippingCosts] = useState({
    prepaid: 0,
    cod: 0,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [savedFormData, setSavedFormData] =
    useState<ExtendedShippingAddress | null>(null);

  const DeleteConfirmationModal = ({
    item,
    onClose,
    onConfirm,
  }: DeleteModalProps) => {
    if (!item) return null;

    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
        >
          <div className="relative bg-background rounded-lg shadow-lg border mx-4">
            {/* Nagłówek */}
            <div className="p-4 text-center space-y-2">
              <div className="relative w-20 h-20 mx-auto">
                <Image
                  src={item.image || ""}
                  alt={item.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h3 className="text-lg font-medium mt-4">
                Usunąć produkt z zamówienia?
              </h3>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>

            {/* Przyciski */}
            <div className="border-t p-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-md bg-background hover:bg-accent border transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Usuń
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  };

  const calculateShippingCost = useCallback(async () => {
    if (!cart.items.length || !cartQuantities) return;

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Sprawdź wagę
      const totalWeight = cart.items.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0
      );

      if (totalWeight > 575) {
        // Dla ciężkich tylko przedpłata
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: cart.items.map((item) => ({
                productId: item.productId,
                quantity: cartQuantities[item.productId] || item.quantity,
              })),
              paymentMethod: "prepaid",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Błąd HTTP: ${response.status}`);
        }

        const data = await response.json();
        setShippingCosts({
          prepaid: data.data.cost,
          cod: 0,
        });

        if (paymentMethod === "cod") {
          setPaymentMethod("prepaid");
        }
      } else {
        // Dla normalnych przesyłek, pobierz oba koszty od razu
        const [prepaidResponse, codResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart.items.map((item) => ({
                productId: item.productId,
                quantity: cartQuantities[item.productId] || item.quantity,
              })),
              paymentMethod: "prepaid",
            }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart.items.map((item) => ({
                productId: item.productId,
                quantity: cartQuantities[item.productId] || item.quantity,
              })),
              paymentMethod: "cod",
            }),
          }),
        ]);

        const [prepaidData, codData] = await Promise.all([
          prepaidResponse.json(),
          codResponse.json(),
        ]);

        setShippingCosts({
          prepaid: prepaidData.data.cost,
          cod: codData.data.cost,
        });
      }
    } catch (error) {
      console.error("Błąd:", error);
      setCalculationError(
        error instanceof Error ? error.message : "Nieznany błąd"
      );
    } finally {
      setIsCalculating(false);
    }
  }, [cart.items, cartQuantities]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.items.find((item) => item.productId === productId);
    if (!item) return;

    // Najpierw pobieramy aktualną ilość z cartQuantities lub z cart.items
    const currentQuantity = cartQuantities[productId] || item.quantity;

    // Sprawdzamy dostępność w magazynie
    const stock = item.stock || 0;

    // Obliczamy nową ilość względem aktualnej ilości
    const validQuantity = Math.max(1, Math.min(newQuantity, stock));

    // Aktualizuj stan w cartStore
    useCartStore.getState().updateQuantity(productId, validQuantity);

    // Aktualizuj lokalny stan
    setCartQuantities((prev) => ({
      ...prev,
      [productId]: validQuantity,
    }));

    calculateShippingCost();
  };

  const handleShippingSubmit = async (data: ExtendedShippingAddress) => {
    try {
      // Oblicz aktualny koszt wysyłki
      const currentShippingCost =
        paymentMethod === "cod" ? shippingCosts.cod : shippingCosts.prepaid;

      // Oblicz sumę
      const subtotal = cart.items.reduce(
        (sum, item) =>
          sum + item.price * (cartQuantities[item.productId] || item.quantity),
        0
      );
      const total = subtotal + currentShippingCost;

      // Przygotuj dane zamówienia z analytics session
      const analyticsSessionId =
        localStorage.getItem("analytics_session_id") || `session_${Date.now()}`;

      // Zapisz analytics session jeśli nie istnieje
      if (!localStorage.getItem("analytics_session_id")) {
        localStorage.setItem("analytics_session_id", analyticsSessionId);
      }

      // NOWE: Zapisz dane formularza przed wysłaniem
      localStorage.setItem(
        "checkoutFormData",
        JSON.stringify({
          ...data,
          paymentMethod,
          timestamp: Date.now(),
        })
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart.items.map((item) => ({
              ...item,
              productId: item.productId,
              quantity: cartQuantities[item.productId] || item.quantity,
              weight: item.weight || 0,
            })),
            shipping: data,
            subtotal,
            shippingCost: currentShippingCost,
            total,
            totalWeight: cart.items.reduce(
              (sum, item) =>
                sum +
                (item.weight || 0) *
                  (cartQuantities[item.productId] || item.quantity),
              0
            ),
            paymentMethod,
            returnUrl: window.location.href,
            analyticsSessionId,
          }),
        }
      );
      console.log("🔍 [CHECKPOINT 2] checkout/page - Wysyłam do API:", {
        differentShippingAddress: data.differentShippingAddress,
        mainAddress: {
          street: data.street,
          postalCode: data.postalCode,
          city: data.city,
        },
        shippingAddress: {
          street: data.shippingStreet,
          postalCode: data.shippingPostalCode,
          city: data.shippingCity,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Odpowiedź z serwera:", result);

      if (!result.success) {
        throw new Error(result.error || "Błąd tworzenia zamówienia");
      }

      // KLUCZOWE: Obsługa przekierowań
      if (paymentMethod === "prepaid" && result.data.checkoutUrl) {
        // Dla płatności online - przekieruj do Stripe
        console.log("Przekierowuję do Stripe:", result.data.checkoutUrl);

        // Zapisz dane przed przekierowaniem
        localStorage.setItem(
          "analytics_pending_order",
          JSON.stringify({
            sessionId: analyticsSessionId,
            orderId: result.data.order.id,
            orderNumber: result.data.order.orderNumber,
          })
        );

        // Przekieruj do Stripe
        window.location.href = result.data.checkoutUrl;
      } else if (paymentMethod === "cod" && result.data.order) {
        // Dla płatności za pobraniem - przekieruj na stronę sukcesu
        console.log("Przekierowuję na stronę sukcesu dla COD");

        // Wyczyść koszyk i dane formularza
        useCartStore.getState().clearCart();
        localStorage.removeItem("checkoutFormData"); // Czyść dane po sukcesie

        // Zapisz dane zamówienia dla strony sukcesu
        localStorage.setItem(
          "cod_order_success",
          JSON.stringify({
            orderId: result.data.order.id,
            orderNumber: result.data.order.orderNumber,
          })
        );

        // Przekieruj na stronę sukcesu
        router.push(`/checkout/success?order_id=${result.data.order.id}`);
      } else {
        // Nieoczekiwana odpowiedź
        throw new Error("Nieoczekiwana odpowiedź z serwera");
      }

      // Zwróć result dla kompatybilności z CheckoutForm
      return result.data;
    } catch (error) {
      console.error("Błąd podczas tworzenia zamówienia:", error);

      // Pokaż toast z błędem
      toast({
        title: "Błąd",
        description:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas składania zamówienia",
        variant: "destructive",
        duration: 5000,
      });

      throw error;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      const params = new URLSearchParams(window.location.search);

      // Sprawdź czy są zapisane dane formularza (mogą być z poprzedniej sesji)
      const savedData = localStorage.getItem("checkoutFormData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Sprawdź czy dane nie są za stare (np. starsze niż 24h)
          const dataAge = Date.now() - parsedData.timestamp;
          if (dataAge < 24 * 60 * 60 * 1000) {
            // 24 godziny
            setSavedFormData(parsedData);
            // Ustaw metodę płatności
            if (parsedData.paymentMethod) {
              setPaymentMethod(parsedData.paymentMethod);
            }
          } else {
            // Dane za stare, usuń je
            localStorage.removeItem("checkoutFormData");
          }
        } catch (error) {
          console.error("Błąd parsowania zapisanych danych formularza:", error);
          localStorage.removeItem("checkoutFormData");
        }
      }

      if (params.get("stripe_cancel")) {
        // Obsługa powrotu z anulowanej płatności Stripe
        const savedState = localStorage.getItem("pendingCartState");
        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState) as {
              quantity: number;
              paymentMethod: "prepaid" | "cod";
              stock: number;
            };

            // Najpierw sprawdzamy aktualny stan magazynowy
            const checkStockResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/products/check-stock`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  productId: cart.items[0].productId,
                  requestedQuantity: parsedState.quantity,
                }),
              }
            );

            const stockData = await checkStockResponse.json();
            const currentStock =
              stockData.data.availableStock || parsedState.stock;

            // Aktualizacja koszyka z aktualnym stanem magazynowym
            useCartStore.setState((state: CartStore) => {
              const updatedItems = state.cart.items.map((item: CartItem) => ({
                ...item,
                quantity: parsedState.quantity,
                stock: currentStock,
              }));

              const newTotal = updatedItems.reduce(
                (sum: number, item: CartItem) =>
                  sum + item.price * parsedState.quantity,
                0
              );

              return {
                ...state,
                cart: {
                  ...state.cart,
                  items: updatedItems,
                  total: newTotal,
                },
              };
            });

            // Aktualizacja lokalnych quantities
            const newQuantities: Record<string, number> = {};
            cart.items.forEach((item: CartItem) => {
              newQuantities[item.productId] = Math.min(
                parsedState.quantity,
                currentStock
              );
            });
            setCartQuantities(newQuantities);

            localStorage.removeItem("pendingCartState");
          } catch (error) {
            console.error("Błąd podczas przywracania stanu:", error);
          }
        }

        // Pokaż informację użytkownikowi
        toast({
          title: "Płatność anulowana",
          description:
            "Twoje dane zostały zachowane. Możesz spróbować ponownie.",
          duration: 5000,
        });
      }

      await calculateShippingCost();
      setIsLoading(false);
    };

    initializePage();
  }, []);

  useEffect(() => {
    calculateShippingCost();
  }, [paymentMethod, calculateShippingCost]);

  useEffect(() => {
    const newTotal = cart.items.reduce(
      (sum, item) =>
        sum + item.price * (cartQuantities[item.productId] || item.quantity),
      0
    );

    useCartStore.setState((state) => ({
      ...state,
      cart: {
        ...state.cart,
        total: newTotal,
      },
    }));
  }, [cartQuantities, cart.items]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-muted-foreground">Ładowanie koszyka...</p>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Twój koszyk jest pusty</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-primary hover:text-primary/80"
          >
            Wróć do sklepu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="md:sticky sticky md:top-0 flex h-16 items-center justify-between border-b bg-background/95 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="rounded-full p-2 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="text-lg font-medium">Finalizacja zamówienia</span>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[30%_65%] gap-8">
          {/* Podsumowanie zamówienia */}
          <div className="md:sticky md:top-24 space-y-6">
            {" "}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-medium mb-4">
                Podsumowanie zamówienia
              </h3>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={item.image || ""}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setProductToDelete(item)}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-background border shadow-sm hover:bg-accent transition-colors"
                        aria-label="Usuń produkt"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              (cartQuantities[item.productId] ||
                                item.quantity) - 1
                            )
                          }
                          className="p-2 rounded-full hover:bg-accent transition-colors"
                          disabled={cartQuantities[item.productId] <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium">
                          {cartQuantities[item.productId] || item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              (cartQuantities[item.productId] ||
                                item.quantity) + 1
                            )
                          }
                          className="p-2 rounded-full hover:bg-accent transition-colors relative group"
                          disabled={
                            cartQuantities[item.productId] >= (item.stock || 0)
                          }
                        >
                          <Plus className="w-4 h-4" />
                          {item.stock && (
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-background border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              W magazynie: {item.stock} szt.
                            </span>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {formatPrice(item.price)} ×{" "}
                        {cartQuantities[item.productId] || item.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Wartość produktów</span>
                      <span>
                        {formatPrice(
                          cart.items.reduce(
                            (sum, item) =>
                              sum +
                              item.price *
                                (cartQuantities[item.productId] ||
                                  item.quantity),
                            0
                          )
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Dostawa</span>
                      <span>
                        {formatPrice(
                          paymentMethod === "cod"
                            ? shippingCosts.cod
                            : shippingCosts.prepaid
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Łącznie</span>
                      <span>
                        {formatPrice(
                          cart.total +
                            (paymentMethod === "cod"
                              ? shippingCosts.cod
                              : shippingCosts.prepaid)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sposób płatności */}
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">
                Wybierz sposób płatności
              </h3>
              <div className="grid gap-4">
                <PaymentMethodCard
                  isSelected={paymentMethod === "prepaid"}
                  onSelect={() => setPaymentMethod("prepaid")}
                  title="Płatność online"
                  description="Szybki przelew online, BLIK, Google Pay, karta płatnicza"
                  icon={<CreditCard className="h-5 w-5" />}
                  cost={shippingCosts.prepaid}
                />

                {cart.items.reduce(
                  (sum, item) => sum + item.weight * item.quantity,
                  0
                ) <= 575 && (
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
            {/* Formularz dostawy */}
            <CheckoutForm
              onSubmit={handleShippingSubmit}
              paymentMethod={paymentMethod}
              savedFormData={savedFormData}
              totalWeight={cart.items.reduce(
                (sum, item) => sum + item.weight * item.quantity,
                0
              )}
              product={{
                ...cart.items[0],
                power: {
                  value: "0",
                  range: "",
                  unit: "W",
                },
                rpm: {
                  value: "0",
                  range: "",
                  unit: "obr/min",
                },
                stock: 1,
                id: cart.items[0].productId,
                _id: cart.items[0].productId,
                images: [cart.items[0].image || ""],
                manufacturer: cart.items[0].manufacturer || "",
                shaftDiameter: cart.items[0].shaftDiameter || 0,
                startType:
                  (cart.items[0].startType as
                    | "bezpośredni - 220/380V"
                    | "bezpośredni - 230/400V"
                    | "gwiazda-trójkąt - 380/660V"
                    | "gwiazda-trójkąt - 400/690V"
                    | "gwiazda-trójkąt - 380V△"
                    | "gwiazda-trójkąt - 400V△"
                    | null) || null,
                condition: (cart.items[0].condition || "uzywany") as
                  | "uzywany"
                  | "nowy"
                  | "nieuzywany",
                mechanicalSize: cart.items[0].mechanicalSize || 0,
                hasBreak: false, // tu dodaj
                hasForeignCooling: false,
                hasEx: false,
                categories:
                  cart.items[0].categories?.map((cat) => ({
                    id: cat.id,
                    name: cat.slug,
                    slug: cat.slug,
                  })) || [],
                marketplaces: {
                  ownStore: {
                    active: true,
                    price: cart.items[0].price,
                    slug: cart.items[0].slug,
                  },
                },
              }}
              quantity={cart.items[0].quantity}
              price={cart.items[0].price}
              shippingCost={
                paymentMethod === "cod"
                  ? shippingCosts.cod
                  : shippingCosts.prepaid
              }
            />
          </div>
        </div>
      </div>
      {/* Dialog potwierdzenia usunięcia */}
      <Dialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <DialogContent className="pointer-events-none">
          {" "}
          {/* dodane pointer-events-none */}
          <div className="bg-background rounded-lg shadow-lg border w-full max-w-sm mx-auto pointer-events-auto">
            {" "}
            {/* zmieniona struktura */}
            <div className="p-6 space-y-6">
              {" "}
              {/* zwiększone paddingi */}
              {productToDelete && (
                <>
                  {/* Zdjęcie */}
                  <div className="relative w-24 h-24 mx-auto">
                    <Image
                      src={productToDelete.image || ""}
                      alt={productToDelete.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Tekst */}
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold">
                      Potwierdź usunięcie
                    </h3>
                    <p className="text-muted-foreground">
                      Czy na pewno chcesz usunąć ten produkt z zamówienia?
                    </p>
                    <p className="font-medium text-lg">
                      {productToDelete.name}
                    </p>
                  </div>

                  {/* Przyciski */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setProductToDelete(null)}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-background hover:bg-accent border transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={() => {
                        useCartStore
                          .getState()
                          .removeItem(productToDelete.productId);
                        toast({
                          title: "Produkt usunięty",
                          description: `${productToDelete.name} został usunięty z koszyka`,
                          duration: 3000,
                        });
                        setProductToDelete(null);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

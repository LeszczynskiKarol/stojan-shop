// frontend/src/app/checkout/success/CheckoutSuccessContent.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useTracking } from "@/hooks/useTracking";
import { Button } from "@/components/ui/Button";
import { useConsent } from "@/context/ConsentContext";
import { Dialog } from "@/components/ui/Dialog";
import { Order, ShippingAddress } from "@/types/order.types";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();
  const { consentSettings } = useConsent();
  const { trackConversion } = useTracking();
  const { trackEvent, getPageLocation } = useAnalytics();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [showDialog, setShowDialog] = useState(true);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    if (orderDetails) {
      if (consentSettings.ad_storage === "granted") {
        // Wewnętrzne śledzenie konwersji
        trackConversion({
          value: orderDetails.total,
          currency: "PLN",
          transaction_id: orderDetails.orderNumber,
        });
      }
    }
  }, [orderDetails, consentSettings]);

  useEffect(() => {
    const completePendingOrder = async () => {
      const pendingOrderData = localStorage.getItem("analytics_pending_order");
      if (pendingOrderData) {
        const { sessionId } = JSON.parse(pendingOrderData);

        // Odtwarzamy sesję analityczną
        localStorage.setItem("analytics_session_id", sessionId);

        trackEvent("order_success", {
          location: getPageLocation(),
          order_id: orderNumber,
          payment_method: "stripe",
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        });

        // Czyścimy dane
        localStorage.removeItem("analytics_pending_order");
      }
    };

    completePendingOrder();
  }, []);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const sessionId = searchParams.get("session_id");
      const orderIdFromUrl = searchParams.get("order_id");

      console.log("Próba pobrania zamówienia z:", {
        sessionId,
        orderIdFromUrl,
      });

      try {
        let orderId = orderIdFromUrl;

        // Jeśli mamy sessionId, pobierz orderId z sesji Stripe
        if (sessionId) {
          const stripeResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/orders/stripe-session/${sessionId}`
          );
          const stripeData = await stripeResponse.json();
          console.log("Dane z sesji Stripe:", stripeData);
          orderId = stripeData.orderId; // teraz to będzie działać
        }

        // Jeśli mamy orderId (z URL lub ze Stripe), pobierz szczegóły zamówienia
        if (orderId) {
          const orderResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`
          );
          const orderData = await orderResponse.json();
          console.log("Pobrane dane zamówienia:", orderData);

          console.log("🔍 [CHECKPOINT 6] Success page - Order shipping:", {
            differentShippingAddress:
              orderData.data.shipping.differentShippingAddress,
            mainAddress: {
              street: orderData.data.shipping.street,
              postalCode: orderData.data.shipping.postalCode,
              city: orderData.data.shipping.city,
            },
            shippingAddress: {
              street: orderData.data.shipping.shippingStreet,
              postalCode: orderData.data.shipping.shippingPostalCode,
              city: orderData.data.shipping.shippingCity,
            },
          });

          setOrderDetails(orderData.data);
          setOrderNumber(orderData.data.orderNumber);
        }
      } catch (error) {
        console.error("Błąd:", error);
      }

      clearCart();
    };

    fetchOrderDetails();
  }, [searchParams, clearCart]);

  const handleContinueShopping = () => {
    setShowDialog(false);
    router.push("/");
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <div className="p-8 rounded-lg shadow-lg max-w-5xl mx-auto bg-card">
        {/* Nagłówek */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Dziękujemy za zakup!
          </h1>
          <p className="text-muted-foreground">
            Twoje zamówienie zostało pomyślnie złożone. Na Twój adres email
            wysłaliśmy potwierdzenie zamówienia.
          </p>
          <p className="text-sm mt-2 text-muted-foreground">
            Numer zamówienia:{" "}
            <span className="font-medium text-foreground">
              {orderNumber || "Ładowanie..."}
            </span>
          </p>
        </div>

        {orderDetails && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Lewa kolumna - szczegóły zamówienia */}
            <div className="space-y-6">
              <div className="bg-accent rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Szczegóły zamówienia
                </h2>
                {orderDetails.items.map((item) => (
                  <div key={item.productId} className="flex gap-4 mb-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-muted-foreground">
                          Ilość: {item.quantity}
                        </span>
                        <span>
                          {(Number(item.price) * Number(item.quantity)).toFixed(
                            2
                          )}{" "}
                          zł
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Koszt dostawy</span>
                    <span>
                      {Number(orderDetails.shippingCost).toFixed(2)} zł
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Razem</span>
                    <span className="text-primary">
                      {Number(orderDetails.total).toFixed(2)} zł
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prawa kolumna - dane zamawiającego i dostawa */}
            <div className="space-y-6">
              {/* Dane zamawiającego */}
              <div className="bg-accent rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Dane kontaktowe</h3>
                    {orderDetails.shipping.companyName ? (
                      <>
                        <p className="text-foreground font-semibold">
                          {orderDetails.shipping.companyName}
                        </p>
                        {orderDetails.shipping.nip && (
                          <p className="text-muted-foreground text-sm">
                            NIP: {orderDetails.shipping.nip}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-foreground">
                        {orderDetails.shipping.firstName}{" "}
                        {orderDetails.shipping.lastName}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Email: {orderDetails.shipping.email}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Tel: {orderDetails.shipping.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Adres</h3>
                    <p className="text-foreground">
                      {orderDetails.shipping.street}
                    </p>
                    <p className="text-foreground">
                      {orderDetails.shipping.postalCode}{" "}
                      {orderDetails.shipping.city}
                    </p>
                  </div>
                  {/* Adres dostawy - tylko gdy jest inny */}
                  {orderDetails.shipping.differentShippingAddress && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        Adres dostawy
                      </h2>
                      <div className="space-y-2">
                        {orderDetails.shipping.companyName ? (
                          <p className="text-foreground font-semibold">
                            {orderDetails.shipping.companyName}
                          </p>
                        ) : (
                          <p className="text-foreground">
                            {orderDetails.shipping.firstName}{" "}
                            {orderDetails.shipping.lastName}
                          </p>
                        )}
                        <p className="text-foreground">
                          {orderDetails.shipping.shippingStreet}
                        </p>
                        <p className="text-foreground">
                          {orderDetails.shipping.shippingPostalCode}{" "}
                          {orderDetails.shipping.shippingCity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleContinueShopping}
          className="w-full mt-8 bg-primary text-primary-foreground"
        >
          Zamknij
        </Button>
      </div>
    </Dialog>
  );
}

// frontend/src/app/checkout/cancel/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function CheckoutCancelPage() {
  const router = useRouter();
  const { trackEvent, getPageLocation } = useAnalytics();
  const [showDialog, setShowDialog] = useState(true);

  useEffect(() => {
    const handleCancelledPayment = async () => {
      const pendingOrderData = localStorage.getItem("analytics_pending_order");
      if (pendingOrderData) {
        const { orderId, sessionId } = JSON.parse(pendingOrderData);

        // Odtwarzamy sesję analityczną
        localStorage.setItem("analytics_session_id", sessionId);

        trackEvent("order_cancelled", {
          location: getPageLocation(),
          order_id: orderId,
          payment_method: "stripe",
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        });

        // Czyścimy dane
        localStorage.removeItem("analytics_pending_order");
      }
    };

    handleCancelledPayment();
  }, []);

  const handleRetry = () => {
    window.history.back();
  };

  const handleContinueShopping = () => {
    setShowDialog(false);
    router.push("/");
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <div className="p-8 rounded-lg shadow-lg max-w-5xl mx-auto bg-card">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-2">
            Płatność anulowana
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            Twoja płatność została anulowana. Nie martw się - Twoje zamówienie
            jest zapisane i możesz spróbować ponownie w każdej chwili.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-accent rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Dlaczego warto dokończyć zakup?
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium">
                    Gwarantowana dostępność przez 1 godzinę
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Produkt jest zarezerwowany tylko dla Ciebie przez 60 min od
                    złożenia zamówienia. Czas start!
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Pamiętaj, że:</h3>
                  <p className="text-sm text-muted-foreground">
                    - Możesz zamówić z płatnością online lub za pobraniem
                  </p>

                  <p className="text-sm text-muted-foreground">
                    - Oferujemy różne metody płatności - wszystkie są bezpieczne
                    i szyfrowane
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-accent rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Co chcesz zrobić?</h2>
            <div className="space-y-4">
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Spróbuj ponownie</div>
                    <div className="text-sm opacity-90">Wróć do płatności</div>
                  </div>
                </div>
                <div className="text-2xl">→</div>
              </button>

              <button
                onClick={handleContinueShopping}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-accent-foreground/5 hover:bg-accent-foreground/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowLeft className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Wróć do sklepu</div>
                    <div className="text-sm text-muted-foreground">
                      Kontynuuj zakupy
                    </div>
                  </div>
                </div>
                <div className="text-2xl">→</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

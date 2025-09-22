// frontend/src/app/formy-platnosci/page.tsx
import { Metadata } from "next";
import {
  CreditCard,
  Wallet,
  Building2,
  Clock,
  Shield,
  CheckCircle,
  Banknote,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Formy płatności - Stojan S.C. | Silniki Elektryczne",
  description:
    "Dostępne formy płatności w sklepie Stojan S.C. Płatność przelewem, kartą, Przelewy24, za pobraniem. Bezpieczne i wygodne metody płatności.",
  keywords: [
    "formy płatności",
    "przelew",
    "karta płatnicza",
    "Przelewy24",
    "płatność za pobraniem",
    "metody płatności",
  ],
};

export default function FormyPlatnosciPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Formy płatności</h1>
          <p className="text-lg text-muted-foreground">
            Wybierz najwygodniejszą dla siebie metodę płatności
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Dostępne formy płatności */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Dostępne sposoby płatności
              </h2>
            </div>

            <p className="text-muted-foreground mb-6">
              Sprzedawca udostępnia Klientowi następujące sposoby płatności z
              tytułu Umowy Sprzedaży:
            </p>

            <div className="space-y-4">
              {/* Przelewy24 */}
              <div className="bg-background rounded-lg p-6 border border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      Płatność szybkim przelewem online (Przelewy24), kartą,
                      BLIK-iem, Google Pay, Apple Pay. Dostawcą płatności jest
                      Stripe.
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Szybkie i bezpieczne płatności online. Obsługujemy
                      wszystkie główne karty płatnicze oraz przelewy z
                      większości banków.
                    </p>
                  </div>
                </div>
              </div>

              {/* Płatność za pobraniem */}
              <div className="bg-background rounded-lg p-6 border border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      Płatność za pobraniem przy odbiorze przesyłki
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Zapłać kurierowi przy odbiorze towaru. Wygodna opcja bez
                      konieczności płatności z góry.
                    </p>
                  </div>
                </div>
              </div>

              {/* Płatność gotówką */}
              <div className="bg-background rounded-lg p-6 border border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      Płatność gotówką przy odbiorze osobistym
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Odbierz zamówienie osobiście w naszej siedzibie i zapłać
                      gotówką.
                    </p>
                  </div>
                </div>
              </div>

              {/* Przelew tradycyjny */}
              <div className="bg-background rounded-lg p-6 border border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      Płatność przelewem na rachunek bankowy Sprzedawcy
                    </h3>
                    <div className="mt-3 p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm font-semibold mb-2">
                        Dane do przelewu:
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Bank:</span>{" "}
                          <strong>Santander Consumer Bank</strong>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Numer rachunku:
                          </span>{" "}
                          <strong className="font-mono">
                            19 1090 1506 0000 0000 5002 0796
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminy płatności */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Termin płatności</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">
                    Płatność gotówką przy odbiorze osobistym lub przelewem
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Płatność następuję w momencie wydania produktu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Płatność za pobraniem</p>
                  <p className="text-muted-foreground text-sm">
                    W przypadku wyboru przez Klienta płatności za pobraniem przy
                    odbiorze przesyłki, Klient obowiązany jest do dokonania
                    płatności <strong>przy odbiorze przesyłki</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bezpieczeństwo */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Bezpieczeństwo płatności
              </h2>
            </div>
            <p className="text-muted-foreground">
              Wszystkie płatności elektroniczne są przetwarzane przez zaufanych
              partnerów płatniczych z wykorzystaniem najwyższych standardów
              bezpieczeństwa. Używamy plików cookie i podobnych technologii, aby
              poprawić Twoje doświadczenia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend/src/app/koszty-i-czas-wysylki/page.tsx
import { Metadata } from "next";
import {
  Truck,
  Clock,
  Package,
  Calculator,
  Info,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Koszty i czas wysyłki - Stojan S.C. | Silniki Elektryczne",
  description:
    "Sprawdź koszty wysyłki i czas dostawy silników elektrycznych. Dostawa kurierem, transport własny, odbiór osobisty. Szybka realizacja zamówień.",
  keywords: [
    "koszty wysyłki",
    "czas dostawy",
    "kurier",
    "transport",
    "dostawa silników",
    "cennik wysyłki",
  ],
};

export default function KosztyICzasWysylkiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Koszty i czas wysyłki</h1>
          <p className="text-lg text-muted-foreground">
            Koszt dostawy uzależniony jest od metody dostawy, formy płatności
            oraz łącznej wagi zamówienia
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Informacja ogólna */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Informacje ogólne</h2>
            </div>
            <p className="text-muted-foreground">
              Koszt dostawy uzależniony jest od metody dostawy, formy płatności
              oraz łącznej wagi zamówienia. W przypadku spedycji gabarytowej
              koszt dostawy jest określany indywidualnie. Poniżej znajduje się
              szczegółowe wyliczenie kosztów.
            </p>
          </div>

          {/* Cennik wysyłki */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Cennik wysyłki</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-semibold">
                      Waga i rodzaj przesyłki
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Cena brutto przy płatności przelewem (w zł)
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Cena brutto przy płatności za pobraniem (w zł)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paczka do 9 kg</td>
                    <td className="py-3 px-4 font-semibold">19 zł</td>
                    <td className="py-3 px-4 font-semibold">23 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paczka 9,5 - 27,5 kg</td>
                    <td className="py-3 px-4 font-semibold">27 zł</td>
                    <td className="py-3 px-4 font-semibold">29 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paczka 28 - 30 kg</td>
                    <td className="py-3 px-4 font-semibold">33 zł</td>
                    <td className="py-3 px-4 font-semibold">35 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paczka 30,5 - 36,5 kg</td>
                    <td className="py-3 px-4 font-semibold">50 zł</td>
                    <td className="py-3 px-4 font-semibold">60 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Półpaleta 37 - 90 kg</td>
                    <td className="py-3 px-4 font-semibold">145 zł</td>
                    <td className="py-3 px-4 font-semibold">155 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Półpaleta 91 - 185 kg</td>
                    <td className="py-3 px-4 font-semibold">165 zł</td>
                    <td className="py-3 px-4 font-semibold">175 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paleta 186 - 375 kg</td>
                    <td className="py-3 px-4 font-semibold">235 zł</td>
                    <td className="py-3 px-4 font-semibold">245 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paleta 376 - 575 kg</td>
                    <td className="py-3 px-4 font-semibold">270 zł</td>
                    <td className="py-3 px-4 font-semibold">280 zł</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paleta 576 - 775 kg</td>
                    <td className="py-3 px-4 font-semibold">290 zł</td>
                    <td className="py-3 px-4 font-semibold">–</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paleta 776 - 970 kg</td>
                    <td className="py-3 px-4 font-semibold">315 zł</td>
                    <td className="py-3 px-4 font-semibold">–</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Paleta 971 - 1470 kg</td>
                    <td className="py-3 px-4 font-semibold">300 zł</td>
                    <td className="py-3 px-4 font-semibold">–</td>
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">Powyżej 1500 kg</td>
                    <td className="py-3 px-4 font-semibold">500 zł</td>
                    <td className="py-3 px-4 font-semibold">–</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Uwaga:</strong> Cena przesyłek zagranicznych uzależniona
                jest od strefy, gabarytu oraz wagi. Płatność za pobraniem
                dostępna tylko dla przesyłek do 575 kg.
              </p>
            </div>
          </div>

          {/* Czas dostawy */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Czas dostawy</h2>
            </div>

            <div className="space-y-6">
              <p className="text-muted-foreground">
                Terminy dostawy są uzależnione od stanów magazynowych
                znajdujących się przy każdym produkcie na stronie, liczone są w
                dniach roboczych (z wyłączeniem sobót) od daty złożenia
                zamówienia przy płatności „Za pobraniem" lub od daty zapłaty
                przy wyborze pozostałych form płatności.
              </p>

              {/* Paczki małe */}
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/50">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />
                  <div className="space-y-2">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Paczki do 36,5 kg
                    </p>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 ml-4">
                      <li>
                        • Wysyłka tego samego dnia roboczego przy zamówieniu do
                        godz. 12:00
                      </li>
                      <li>• Dostawa następnego dnia roboczego</li>
                      <li>
                        • Standardowy czas dostawy: <strong>24 godziny</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Przesyłki duże */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Przesyłki powyżej 36,5 kg
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                      <li>
                        • Wysyłka tego samego dnia roboczego przy zamówieniu do
                        godz. 10:00
                      </li>
                      <li>• Dostawa w ciągu 1-2 dni roboczych</li>
                      <li>
                        • Standardowy czas dostawy:{" "}
                        <strong>24-48 godzin</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Uwaga */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-1" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">Ważne informacje:</p>
                    <ul className="space-y-1 ml-4">
                      <li>
                        • Zamówienia złożone po godzinach granicznych są
                        wysyłane następnego dnia roboczego
                      </li>
                      <li>
                        • W przypadku produktów z magazynu czas dostawy wynosi
                        24-48 h
                      </li>
                      <li>
                        • Dni robocze nie obejmują sobót, niedziel i świąt
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

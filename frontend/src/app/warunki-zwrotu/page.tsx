// frontend/src/app/warunki-zwrotu/page.tsx
import { Metadata } from "next";
import {
  Package,
  AlertCircle,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  CreditCard,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Warunki zwrotu - Stojan S.C. | Silniki Elektryczne",
  description:
    "Warunki zwrotu towarów w sklepie Stojan S.C. Odstąpienie od umowy w ciągu 10 dni. Procedura zwrotu i reklamacji produktów.",
  keywords: [
    "warunki zwrotu",
    "zwrot towaru",
    "reklamacja",
    "odstąpienie od umowy",
    "gwarancja",
  ],
};

export default function WarunkiZwrotuPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Warunki zwrotu</h1>
          <p className="text-lg text-muted-foreground">
            Poznaj nasze zasady dotyczące zwrotu i wymiany towarów
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Prawa konsumenta */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Prawa konsumenta</h2>
            </div>
            <p className="text-muted-foreground">
              1. Nasz sklep w pełni respektuje Państwa prawa wynikające z ustawy
              z dnia 2 marca 2000r. o ochronie niektórych praw konsumentów oraz
              o odpowiedzialności za szkodę wyrządzoną przez produkt
              niebezpieczny. (Dz. U. Nr 22, poz. 271).
            </p>
          </div>

          {/* Odstąpienie od umowy */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Odstąpienie od umowy</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              2. Konsument, który zawarł umowę poza lokalem przedsiębiorstwa
              może od niej odstąpić bez podania przyczyny, składając stosowne
              oświadczenie na piśmie w terminie do <strong>10 dni</strong> od
              daty zawarcia umowy, pod warunkiem, że:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  towar jest nieuszkodzony
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">nie był używany</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">jest czysty</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  ma oryginalnie i nieuszkodzone opakowanie
                </span>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  W przypadku produktów składających się z wielu elementów
                  opakowanie musi być fabrycznie zamknięte. Po rozpakowaniu
                  istnieje możliwość uszkodzenia w trakcie transportu lub może
                  wykluczać prawidłowe magazynowanie. Przekroczenie terminu
                  będzie podstawą do nieuwzględnienia odstąpienia od umowy.
                  Zwrot powinien być poparty pisemnym oświadczeniem pod rygorem
                  nieważności.
                </p>
              </div>
            </div>
          </div>

          {/* Wyjątki */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <XCircle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Towary niepodlegające zwrotowi
              </h2>
            </div>
            <p className="text-muted-foreground">
              3. Wymianie lub zwrotowi nie podlegają towary sprzedawane na
              indywidualne zamówienie Kupującego
            </p>
          </div>

          {/* Procedura zwrotu */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Procedura zwrotu</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                4. Razem ze zwracanym produktem należy przesłać oryginał
                paragonu lub kopię faktury i oświadczenie. Towar należy
                dostarczyć w terminie do 10 dni od jego wydania. Jeżeli na
                fakturze znajdują się również inne towary nie podlegające
                zwrotowi, to po zmianie zamówienia odeślemy Państwu fakturę
                korygującą. Jeżeli w cenie produktu zawarte były koszty wysyłki
                czy dostawy, kwota będzie pomniejszona o tą wartość.
              </p>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
                <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Ważne!
                </p>
                <p>
                  5. Nasz sklep nie przyjmuje przesyłek wysyłanych na koszt
                  sklepu, odsyłanych za pobraniem lub/i bez opisu na liście
                  przewozowym. Klient musi dostarczyć zwracany towar na własny
                  koszt.
                </p>
              </div>
            </div>
          </div>

          {/* Zwrot płatności */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Zwrot płatności</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                6. Gwarantujemy zwrot ceny produktu w terminie 14 dni od chwili
                jego otrzymania, którą prześlemy przelewem na Państwa konto.
                Koszt dostawy, wysyłki oraz koszt zwrotu produktu nie jest
                zwracany przez sklep.
              </p>
              <p>
                7. Sprzedawca zobowiązuje się rozpatrzyć zgłoszenie zwrotu w
                ciągu 7 dni od dnia dostarczenia przesyłki do Sklepu, jeśli
                wszystkie ww. warunki zwrotu towaru zostaną spełnione, zwrot
                pieniędzy w wysokości ceny odesłanego towaru (zwrotowi nie
                podlegają koszty dostawy), nastąpi w terminie do 7 dni od daty
                otrzymania zwrotu, na wskazane przez Zamawiającego konto
                bankowe.
              </p>
            </div>
          </div>

          {/* Towar nieuznanego zwrotu */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Towar nieuznanego zwrotu
              </h2>
            </div>
            <p className="text-muted-foreground">
              8. Towar, którego zwrot nie zostanie uznany zostanie odesłany do
              Nabywcy po przelaniu przez Nabywcę na konto Sklepu odpowiedniej
              kwoty na poczet ponownego wysłania przesyłki do Nabywcy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

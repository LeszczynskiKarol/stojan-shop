// frontend/src/app/przetwarzanie-danych-osobowych/page.tsx
import { Metadata } from "next";
import {
  Shield,
  Clock,
  Lock,
  Info,
  UserCheck,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Przetwarzanie danych osobowych - Stojan S.C. | RODO",
  description:
    "Informacje o przetwarzaniu danych osobowych w sklepie Stojan S.C. zgodnie z RODO. Dowiedz się jak dbamy o bezpieczeństwo Twoich danych.",
  keywords: [
    "RODO",
    "dane osobowe",
    "przetwarzanie danych",
    "ochrona danych",
    "polityka prywatności",
  ],
};

export default function PrzetwarzanieDanychPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Przetwarzanie danych osobowych
          </h1>
          <p className="text-lg text-muted-foreground">
            Informacje związane z ochroną Państwa danych osobowych zgodnie z
            RODO
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Wprowadzenie */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Drodzy Klienci</h2>
            </div>
            <div className="prose prose-gray max-w-none space-y-4">
              <p className="text-muted-foreground">
                Przekazujemy Państwu informacje związane z ochroną Państwa
                danych osobowych, z prośbą o zapoznanie się z ich treścią.
              </p>
              <p className="text-muted-foreground">
                Stojan S.C. jako Administrator Państwa danych osobowych
                nieustannie podnosi standardy obsługi oraz bezpieczeństwa
                przetwarzanych danych osobowych swoich Klientów. Dlatego też,
                wprowadzamy zmiany dostosowujące stosowaną przez nas Politykę
                Ochrony Danych do wymogów (RODO) tj. Rozporządzenia Parlamentu
                Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w
                sprawie ochrony osób fizycznych w związku z przetwarzaniem
                danych osobowych i w sprawie swobodnego przepływu takich danych
                oraz uchylenia dyrektywy 95/46/WE.
              </p>
            </div>
          </div>

          {/* Administrator danych */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Administrator danych</h2>
            </div>
            <p className="text-muted-foreground">
              Zgodnie z art. 13 ust. 1 i ust. 2 RODO informuję, iż:
            </p>
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground">
                Administratorem Pani/Pana danych osobowych są{" "}
                <strong>Włodzimierz Leszczyński i Adam Król</strong> prowadzący
                działalność gospodarczą pod firmą:
              </p>
              <p className="mt-2 font-semibold">
                Stojan S.C. Włodzimierz Leszczyński, Adam Król
                <br />
                87-152 Pigża, ul. Wojewódzka 2<br />
                NIP: 8790003705 (ADO)
              </p>
            </div>
          </div>

          {/* Cele przetwarzania */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Cele przetwarzania danych
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Pani/Pana dane osobowe przetwarzane są w celu umożliwienia
              rejestracji w sklepie, realizacji zamówienia i wysyłki zakupionego
              towaru oraz celów wynikających z prawnie uzasadnionych interesów
              realizowanych przez Administratora. Oznacza to w szczególności:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prowadzenie badań statystycznych
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  rozpatrywanie reklamacji
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  dochodzenie ewentualnych roszczeń
                </span>
              </li>
            </ul>
          </div>

          {/* Podstawa prawna */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Podstawa prawna przetwarzania
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Podstawą prawną przetwarzania przez Administratora Pani/Pana
              danych osobowych w celach wskazanych powyżej jest:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border/50">
                <p className="font-semibold mb-2">Wykonanie umowy sprzedaży</p>
                <p className="text-sm text-muted-foreground">
                  zgodnie z art. 6 ust. 1 lit. b RODO
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border/50">
                <p className="font-semibold mb-2">
                  Prawnie usprawiedliwiony interes administratora
                </p>
                <p className="text-sm text-muted-foreground">
                  zgodnie z art. 6. ust. 1 lit. f RODO – w celu obsługi,
                  dochodzenia i obrony w razie zaistnienia wzajemnych roszczeń,
                  w tym – w przypadku odstąpienia przez Pana/Panią od umowy,
                  zapobiegania oszustwom, rozpatrzenia reklamacji
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border/50">
                <p className="font-semibold mb-2">
                  Zgoda na przetwarzanie danych osobowych
                </p>
                <p className="text-sm text-muted-foreground">
                  zgodnie z art. 6 ust. 1 lit. a RODO – w sytuacjach, w których
                  wyrażana zostaje na: promocję i marketing produktów lub usług
                  oferowanych przez Administratora, przekazywanie informacji
                  handlowych drogą elektroniczną, wykorzystywanie telefonicznych
                  urządzeń końcowych i automatycznych systemów wywołujących dla
                  celów marketingu bezpośredniego
                </p>
              </div>
            </div>
          </div>

          {/* Odbiorcy danych */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Odbiorcy danych</h2>
            </div>
            <p className="text-muted-foreground">
              Odbiorcami Pani/Pana danych osobowych będą na podstawie umów
              powierzenia przetwarzania danych, zgodnie z obowiązującymi
              przepisami prawa w zakresie ochrony danych osobowych, w
              szczególności: podmioty uczestniczące w realizacji zamówienia, np.
              firma kurierska, obsługa informatyczna przy pomocy których to
              podmiotów realizowana jest dostawa, lub inne podmioty, gdy jest to
              niezbędne do realizacji ww. celów.
            </p>
          </div>

          {/* Okres przetwarzania */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">
                Okres przetwarzania danych
              </h2>
            </div>
            <p className="text-muted-foreground">
              Przewidywany okres przetwarzania Pani/Pana danych osobowych wynosi{" "}
              <strong>5 lat</strong>.
            </p>
          </div>

          {/* Prawa osoby */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Pani/Pana prawa</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Posiada Pani/Pan następujące prawa:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo dostępu do treści swoich danych oraz prawo ich
                  sprostowania
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo do usunięcia danych
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo do ograniczenia przetwarzania
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo do przenoszenia danych
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo wniesienia sprzeciwu
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo do cofnięcia zgody na przetwarzanie danych w dowolnym
                  momencie, bez wpływu na zgodność z prawem przetwarzania,
                  którego dokonano na podstawie zgody przed jej cofnięciem
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  prawo wniesienia skargi do organu nadzorczego, gdy uzna
                  Pani/Pan, iż przetwarzanie danych osobowych Pani/Pana
                  dotyczących, narusza przepisy ogólnego Rozporządzenia o
                  ochronie danych osobowych z dnia 27 kwietnia 2016 r. (RODO)
                </span>
              </li>
            </ul>
          </div>

          {/* Informacje dodatkowe */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-8 border border-orange-200 dark:border-orange-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold">Ważne informacje</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Podanie przez Pana/Panią danych osobowych jest dobrowolne i
                stanowi warunek zawarcia umowy. Niepodanie danych osobowych
                będzie skutkować odmową realizacji zamówienia.
              </p>
              <p className="text-muted-foreground">
                Transfer danych osobowych wprowadzanych do formularza odbywa się
                przy użyciu bezpiecznego protokołu SSL.
              </p>
              <p className="text-muted-foreground">
                Administrator zapewnia Pani/Panu możliwość zmiany, modyfikacji
                lub usunięcia swoich danych osobowych poprzez: kliknięcie
                odpowiedniego linku, kontakt e-mail na adres:{" "}
                <strong>stojan@silniki-elektryczne.com.pl</strong> lub drogą
                pocztową na podany wcześniej adres siedziby ADO.
              </p>
              <p className="text-muted-foreground font-semibold">
                Używamy plików cookie i podobnych technologii, aby poprawić
                Twoje doświadczenia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

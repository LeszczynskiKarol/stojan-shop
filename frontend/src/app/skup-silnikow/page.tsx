// frontend/src/app/skup-silnikow/page.tsx
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  FileCheck,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Scale,
  TrendingUp,
  Truck,
  Wrench,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Skup Silników Elektrycznych | Stojan S.C.",
  description:
    "Profesjonalny skup silników elektrycznych - uczciwa wycena, rozliczenie wagowe, indywidualna ocena. Skup silników sprawnych i uszkodzonych. Tel: 500 385 112",
  keywords: [
    "skup silników elektrycznych",
    "skup silników",
    "sprzedaż silników",
    "wycena silników",
    "skup złomu silników",
    "pigża",
  ],
};

export default function SkupSilnikowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-6">
              <Scale className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Skup silników elektrycznych
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Profesjonalny skup silników elektrycznych - uczciwa wycena na
              podstawie stanu technicznego i wagi urządzenia
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="tel:500385112"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg"
              >
                <Phone className="h-5 w-5" />
                Zadzwoń: 500 385 112
              </a>
              <Link
                href="/kontakt"
                className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors font-semibold"
              >
                <MessageSquare className="h-5 w-5" />
                Napisz do nas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Rozliczenie wagowe */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
            <div className="p-4 bg-primary/10 rounded-xl w-fit mb-6">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Rozliczenie wagowe</h3>
            <p className="text-muted-foreground mb-4">
              Rozliczamy skup na podstawie wagi silnika - uczciwa cena za każdy
              kilogram.
            </p>
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Cena orientacyjna
              </div>
            </div>
          </div>

          {/* Indywidualna wycena */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
            <div className="p-4 bg-primary/10 rounded-xl w-fit mb-6">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Wycena indywidualna</h3>
            <p className="text-muted-foreground mb-4">
              Każdy silnik oceniamy indywidualnie - stan techniczny, typ,
              producent mają wpływ na ostateczną cenę.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                Bezpłatna wycena
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                Uczciwa ocena stanu
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                Natychmiastowa płatność
              </li>
            </ul>
          </div>

          {/* Możliwość odbioru */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
            <div className="p-4 bg-primary/10 rounded-xl w-fit mb-6">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Możliwość odbioru</h3>
            <p className="text-muted-foreground mb-4">
              Przy większych partiach oferujemy odbiór własnym transportem.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Odbiór silników od klienta</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Możliwość dostawy własnej</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ustalenie indywidualne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Co kupujemy */}
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 shadow-lg border border-border/50 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Co skupujemy?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Silniki sprawne</h4>
                  <p className="text-sm text-muted-foreground">
                    Silniki w pełni sprawne technicznie - najlepsza wycena
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Silniki uszkodzone</h4>
                  <p className="text-sm text-muted-foreground">
                    Silniki wymagające naprawy - wycena na podstawie wagi
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Silniki różnych mocy</h4>
                  <p className="text-sm text-muted-foreground">
                    Od małych (0.09 kW) do dużych (200+ kW)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Różni producenci</h4>
                  <p className="text-sm text-muted-foreground">
                    SEW, Siemens, ABB, Tamel i inne marki
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Partie silników</h4>
                  <p className="text-sm text-muted-foreground">
                    Skup pojedynczych sztuk oraz większych partii
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Różne typy</h4>
                  <p className="text-sm text-muted-foreground">
                    1-fazowe, 3-fazowe, z hamulcem, specjalne
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jak przebiega skup */}
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Jak przebiega skup?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold text-primary mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Kontakt</h4>
              <p className="text-sm text-muted-foreground">
                Skontaktuj się telefonicznie lub mailowo
              </p>
            </div>

            <div className="relative">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold text-primary mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Opis silnika</h4>
              <p className="text-sm text-muted-foreground">
                Podaj parametry: moc, typ, stan techniczny
              </p>
            </div>

            <div className="relative">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold text-primary mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Wycena</h4>
              <p className="text-sm text-muted-foreground">
                Wstępna wycena lub spotkanie z oceną
              </p>
            </div>

            <div className="relative">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold text-primary mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Transakcja</h4>
              <p className="text-sm text-muted-foreground">
                Ważenie, płatność i odbiór/dostawa
              </p>
            </div>
          </div>
        </div>

        {/* Czynniki wpływające na cenę */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-8 border border-green-500/20">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold">Wyższa cena za:</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Silniki w pełni sprawne</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Silniki znanych producentów</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Większe partie (hurtowe)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Dobry stan wizualny</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Większa moc silnika</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-8 border border-orange-500/20">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-semibold">Cena zależy od:</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Wrench className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Stanu technicznego silnika</span>
              </li>
              <li className="flex items-start gap-2">
                <Scale className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Wagi całkowitej urządzenia</span>
              </li>
              <li className="flex items-start gap-2">
                <Package className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Typu konstrukcji (korpus, uzwojenia)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Euro className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Aktualnych cen surowców wtórnych
                </span>
              </li>
              <li className="flex items-start gap-2">
                <FileCheck className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Kompletności dokumentacji</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 border border-primary/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Masz silniki do sprzedania?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Skontaktuj się z nami już dziś - szybka wycena i uczciwe warunki
              współpracy
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <a
                href="tel:500385112"
                className="flex items-center justify-center gap-4 p-6 rounded-xl bg-card hover:bg-card/80 transition-colors group border border-border"
              >
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Zadzwoń</div>
                  <div className="text-xl font-semibold">500 385 112</div>
                </div>
              </a>

              <a
                href="mailto:stojan@silniki-elektryczne.com.pl"
                className="flex items-center justify-center gap-4 p-6 rounded-xl bg-card hover:bg-card/80 transition-colors group border border-border"
              >
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">Napisz</div>
                  <div className="text-lg font-semibold">E-mail</div>
                </div>
              </a>
            </div>

            <div className="bg-background/50 rounded-xl p-6 border border-border/50">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>Godziny pracy</span>
              </div>
              <div className="space-y-1">
                <div className="font-semibold">
                  Poniedziałek - Piątek: 8:00 - 16:00
                </div>
                <div className="font-semibold">Sobota: 9:00 - 14:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend/src/app/odstapienie-od-umowy/page.tsx
import { Metadata } from "next";
import {
  FileText,
  Calendar,
  Info,
  Download,
  Mail,
  Package,
  Clock,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Odstąpienie od umowy - Stojan S.C. | Silniki Elektryczne",
  description:
    "Informacje o prawie odstąpienia od umowy. Procedura zwrotu towaru w ciągu 14 dni. Formularz odstąpienia od umowy do pobrania.",
  keywords: [
    "odstąpienie od umowy",
    "zwrot towaru",
    "14 dni",
    "formularz odstąpienia",
    "prawo konsumenta",
  ],
};

export default function OdstapienieOdUmowyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Odstąpienie od umowy</h1>
          <p className="text-lg text-muted-foreground">
            Informacje o prawie do odstąpienia od umowy zawartej na odległość
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Prawo odstąpienia */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Prawo odstąpienia</h2>
            </div>
            <div className="prose prose-gray max-w-none space-y-4">
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Tutaj dodaj informacje o prawie odstąpienia od umowy */}
                Tutaj umieść treść dotyczącą prawa odstąpienia od umowy...
              </p>
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Dodatkowy akapit */}
                Kolejny akapit z informacjami...
              </p>
            </div>
          </div>

          {/* Termin odstąpienia */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Termin na odstąpienie</h2>
            </div>
            <div className="prose prose-gray max-w-none space-y-4">
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Informacje o terminie 14 dni */}
                Tutaj umieść informacje o terminie 14 dni...
              </p>
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Szczegóły dotyczące liczenia terminu */}
                Dodatkowe informacje o liczeniu terminu...
              </p>
            </div>
          </div>

          {/* Sposób odstąpienia */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Jak odstąpić od umowy</h2>
            </div>
            <div className="prose prose-gray max-w-none space-y-4">
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Procedura odstąpienia */}
                Tutaj opisz procedurę odstąpienia od umowy...
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{/* MIEJSCE NA TREŚĆ */}Krok 1...</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{/* MIEJSCE NA TREŚĆ */}Krok 2...</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{/* MIEJSCE NA TREŚĆ */}Krok 3...</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Zwrot towaru */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Zwrot towaru</h2>
            </div>
            <div className="prose prose-gray max-w-none space-y-4">
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Informacje o zwrocie towaru */}
                Tutaj umieść informacje o procedurze zwrotu towaru...
              </p>
              <p className="text-muted-foreground">
                {/* MIEJSCE NA TREŚĆ - Adres do zwrotu */}
                Adres do zwrotu i dodatkowe informacje...
              </p>
            </div>
          </div>

          {/* Informacja dodatkowa */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Informacja dodatkowa</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground">
                Zawarte w tym komunikacie zapisy dotyczące konsumenta stosuje
                się od dnia 1 stycznia 2021 r. i dla umów zawartych od tego dnia
                również do kupującego będącego osobą fizyczną zawierającą umowę
                bezpośrednio związaną z jej działalnością gospodarczą, gdy z
                treści tej umowy wynika, że nie posiada ona dla tej osoby
                charakteru zawodowego, wynikającego w szczególności z przedmiotu
                wykonywanej przez nią działalności gospodarczej, udostępnionego
                na podstawie przepisów o Centralnej Ewidencji i Informacji o
                Działalności Gospodarczej.
              </p>
            </div>
          </div>

          {/* Formularz do pobrania */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Formularz odstąpienia</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {/* MIEJSCE NA TREŚĆ - Informacja o formularzu */}
              Pobierz gotowy formularz odstąpienia od umowy...
            </p>
            <a
              href="https://s3.eu-north-1.amazonaws.com/piszemy.com.pl/stojan/invoices/Formularz-odstapienia-od-umowy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg"
            >
              <Download className="h-5 w-5" />
              Pobierz formularz (PDF)
            </a>
          </div>

          {/* Kontakt */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Masz pytania?</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {/* MIEJSCE NA TREŚĆ - Zachęta do kontaktu */}
              Jeśli masz pytania dotyczące odstąpienia od umowy...
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:500385112"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-background border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                Zadzwoń: 500 385 112
              </a>
              <a
                href="mailto:stojan@silniki-elektryczne.com.pl"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-background border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                Napisz do nas
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

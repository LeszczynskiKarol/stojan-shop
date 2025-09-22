// frontend/src/app/kontakt/page.tsx
import { Metadata } from "next";
import { ContactMap } from "@/components/contact/ContactMap";
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  FileText,
  Navigation,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kontakt - Stojan S.C. | Silniki Elektryczne",
  description:
    "Skontaktuj się z nami - Stojan S.C. Pigża. Sprzedaż silników elektrycznych. Tel: 500 385 112. Zapraszamy do kontaktu!",
  keywords: ["kontakt", "stojan", "silniki elektryczne", "pigża", "adres"],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            {/* Company Card */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Dane firmy</h2>
              </div>

              <div className="space-y-4">
                <div className="font-semibold text-lg">Stojan S.C.</div>
                <div className="text-muted-foreground">
                  Adam Król, Włodzimierz Leszczyński
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div>ul. Wojewódzka 2</div>
                      <div>87-152 Pigża</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div>NIP: 879-000-37-05</div>
                      <div>REGON: 870039184</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Methods */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-6">Dane kontaktowe</h3>

              <div className="space-y-4">
                <a
                  href="tel:500385112"
                  className="flex items-center gap-4 p-4 rounded-lg bg-background hover:bg-primary/5 transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Telefon</div>
                    <div className="font-semibold">500 385 112</div>
                  </div>
                </a>

                <a
                  href="mailto:stojan@silniki-elektryczne.com.pl"
                  className="flex items-center gap-4 p-4 rounded-lg bg-background hover:bg-primary/5 transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">E-mail</div>
                    <div className="font-semibold break-all">
                      stojan@silniki-elektryczne.com.pl
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Godziny otwarcia</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Poniedziałek - Piątek
                  </span>
                  <span className="font-semibold">8:00 - 16:00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Sobota</span>
                  <span className="font-semibold">9:00 - 14:00</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Niedziela</span>
                  <span className="font-semibold text-red-500">Zamknięte</span>
                </div>
              </div>
            </div>

            {/* Navigation Button */}
            <a
              href="https://maps.google.com/?q=Stojan+s.c.+A.+Król+W.+Leszczyński+Pigża"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg"
            >
              <Navigation className="h-5 w-5" />
              Wyznacz trasę w Google Maps
            </a>
          </div>

          {/* Map Section */}
          <div className="space-y-8">
            <div className="bg-card rounded-2xl p-2 shadow-lg border border-border/50 overflow-hidden">
              <ContactMap />
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-4">Dojazd</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Nasza siedziba znajduje się w Pigży przy ulicy Wojewódzkiej 2,
                  w województwie kujawsko-pomorskim.
                </p>
                <p>
                  Dogodna lokalizacja z łatwym dojazdem zarówno dla klientów
                  indywidualnych, jak i firm transportowych.
                </p>
                <p className="font-semibold text-foreground">
                  Zapraszamy do kontaktu i odwiedzin!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

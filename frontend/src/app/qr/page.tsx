// frontend/src/app/qr/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ShoppingBag,
  Heart,
  Zap,
  ArrowRight,
  Gift,
  Star,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dziękujemy za zakup! - Stojan S.C. | Silniki Elektryczne",
  description:
    "Dziękujemy za zaufanie i wybór naszych silników elektrycznych. Zapraszamy do ponownych zakupów!",
  robots: "noindex, nofollow",
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-8 animate-bounce-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-secondary p-6 rounded-full shadow-2xl">
                <CheckCircle2 className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
              Dziękujemy za zakup!
            </h1>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <p className="text-lg">
                Życzymy udanego użytkowania zamówionego produktu. Jesteśmy
                przekonani, że będzie dobrze się spisywał!
              </p>
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-fade-in-up delay-400">
            <Link
              href="/"
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 py-5 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingBag className="h-6 w-6 group-hover:animate-bounce" />
              Przeglądaj produkty
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/kontakt"
              className="group flex items-center justify-center gap-3 bg-card hover:bg-accent text-foreground px-8 py-5 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl border-2 border-primary/30 transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="h-6 w-6 text-primary group-hover:animate-pulse" />
              Skontaktuj się z nami
            </Link>
          </div>

          {/* Contact Info */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/50 animate-fade-in-up delay-500">
            <h3 className="text-xl font-semibold mb-6 text-center">
              Masz pytania? Jesteśmy do Twojej dyspozycji!
            </h3>
            <h3 className="text-xl font-semibold mb-6 text-center">
              Dziękujemy za zaufanie i zapraszamy ponownie do naszego sklepu.
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="tel:500385112"
                className="flex items-center gap-4 p-4 rounded-lg bg-background hover:bg-primary/5 transition-colors group"
              >
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Telefon</div>
                  <div className="font-semibold text-lg">500 385 112</div>
                </div>
              </a>

              <a
                href="mailto:stojan@silniki-elektryczne.com.pl"
                className="flex items-center gap-4 p-4 rounded-lg bg-background hover:bg-primary/5 transition-colors group"
              >
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">E-mail</div>
                  <div className="font-semibold text-sm md:text-base break-all">
                    stojan@silniki-elektryczne.com.pl
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center mt-12 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
            <p className="text-muted-foreground text-lg mb-2">
              Dziękujemy za zaufanie i wybór Stojan S.C.
            </p>
            <p className="text-sm text-muted-foreground">
              Do zobaczenia wkrótce! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

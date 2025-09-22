// frontend/src/app/(main)/layout.tsx

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import CookieConsent from "@/components/CookieConsent";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main
        className="container mx-auto py-8 px-4 flex-grow"
        style={{
          marginTop: "calc(64px + var(--cart-widget-height, 0px))",
          transition: "margin-top 0.3s ease",
        }}
      >
        {children}
      </main>
      <Footer />
      <Toaster />
      <CookieConsent />
    </div>
  );
}

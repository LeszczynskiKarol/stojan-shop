// frontend/src/app/layout.tsx
import { Header } from "@/components/layout/Header";
import { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Script from "next/script";
import { ConsentProvider } from "@/context/ConsentContext";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://stojan-shop.pl"
  ),
  title: {
    default: "Silniki elektryczne - sklep internetowy | Stojan Shop",
    template: "%s | Stojan Shop",
  },
  description:
    "Silniki elektryczne trójfazowe, jednofazowe, z hamulcem. Szeroki wybór napędów elektrycznych różnych mocy.",
  keywords: "silniki elektryczne, napędy elektryczne, motoreduktory",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },

  // MANIFEST DLA PWA
  manifest: "/site.webmanifest",
  verification: {
    google: "xFcDL4OEm7GF0jFWvzfsXIleZSpbMUW3QTb7-3r89gM",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://www.silniki-elektryczne.com.pl",
    siteName: "Sklep Stojan - Silniki Elektryczne",
    title: "Silniki elektryczne - sklep internetowy Stojan",
    description: "Profesjonalny sklep z silnikami elektrycznymi",
    images: [
      {
        url: "/logo_dark.png",
        width: 1200,
        height: 630,
        alt: "Stojan - Silniki Elektryczne",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        {/* Google Tag Manager - Consent Mode Initialization */}
        <Script
          id="consent-mode-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Definiuj funkcję gtag przed GTM
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              
              // Ustaw domyślny consent mode (denied)
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'granted',
                'personalization_storage': 'denied',
                'security_storage': 'granted',
                'wait_for_update': 2500
              });
              
              // Sprawdź czy są zapisane ustawienia
              try {
                const savedSettings = localStorage.getItem('consentSettings');
                if (savedSettings) {
                  const settings = JSON.parse(savedSettings);
                  gtag('consent', 'update', settings);
                }
              } catch (e) {
                console.error('Error loading consent settings:', e);
              }
            `,
          }}
        />

        {/* DODAJ TEN TAG GOOGLE ADS TUTAJ */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-988030143"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Konfiguracja Google Ads
              gtag('config', 'AW-988030143', {
                'allow_ad_personalization_signals': false // będzie kontrolowane przez consent
              });
            `,
          }}
        />

        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MSS5RSBK');
            `,
          }}
        />

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MSS5RSBK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConsentProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <Header />

              <AuthProvider>
                <main
                  style={{
                    marginTop: "calc(64px + var(--cart-widget-height, 0px))",
                    transition: "margin-top 0.3s ease",
                  }}
                >
                  {children}
                </main>
                <CookieConsent />
              </AuthProvider>
              <Footer />
              <Toaster />
            </div>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

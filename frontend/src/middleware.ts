// frontend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const POWER_PAGES = [
  "/silniki-elektryczne-009-kw",
  "/silniki-elektryczne-012-kw",
  "/silniki-elektryczne-018-kw",
  "/silniki-elektryczne-025-kw",
  "/silniki-elektryczne-037-kw",
  "/silniki-elektryczne-055-kw",
  "/silniki-elektryczne-075-kw",
  "/silniki-elektryczne-1-1-kw",
  "/silniki-elektryczne-1-5-kw",
  "/silniki-elektryczne-2-2-kw",
  "/silniki-elektryczne-3-kw",
  "/silniki-elektryczne-4-kw",
  "/silniki-elektryczne-5-5-kw",
  "/silniki-elektryczne-7-5-kw",
  "/silniki-elektryczne-11-kw",
  "/silniki-elektryczne-18-5-kw",
  "/silniki-elektryczne-22-kw",
  "/silniki-elektryczne-30-kw",
  "/silniki-elektryczne-55-kw",
  "/silniki-elektryczne-75-kw",
  "/silniki-elektryczne-110-kw",
  "/silniki-elektryczne-160-kw",
  "/silniki-elektryczne-200-kw",
];

const STATIC_PATHS = [
  ...POWER_PAGES,
  "/szukaj",
  "/koszyk",
  "/QR",
  "/qr",
  "/zamowienie",
  "/admin",
  "/o-nas",
  "/kontakt",
  "/regulamin",
  "/polityka-prywatnosci",
  "/dostawa-i-platnosc",
  "/legal",
  "/pomoc",
  "/zwroty",
  "/reklamacje",
  "/login",
  "/register",
  "/reset-password",
  "/profil",
  "/moje-zamowienia",
  "/odstapienie-od-umowy",
  "/koszty-i-czas-wysylki",
  "/formy-platnosci",
  "/przetwarzanie-danych-osobowych",
  "/regulamin-sklepu",
  "/polityka-prywatnosci",
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  // Dodajemy nagłówki bezpieczeństwa
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Sprawdź czy ścieżka jest statyczna
  const isStaticPath = STATIC_PATHS.some(
    (staticPath) => path === staticPath || path.startsWith(`${staticPath}/`)
  );

  if (isStaticPath) {
    return response;
  }

  if (path.startsWith("/legal/")) {
    return response;
  }

  // Sprawdź czy to plik statyczny, zasoby Next.js, favicon lub SITEMAP
  if (
    path.includes(".") ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path === "/favicon.ico" ||
    path.startsWith("/android-chrome") ||
    path.startsWith("/apple-touch-icon") ||
    path === "/site.webmanifest" ||
    path === "/browserconfig.xml" ||
    // SITEMAP - dodane wykluczenia
    path === "/sitemap_index.xml" ||
    path.startsWith("/sitemap-") ||
    path.endsWith(".xml")
  ) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.xml|.*\\.webmanifest).)",
    "/legal/:path",
  ],
};

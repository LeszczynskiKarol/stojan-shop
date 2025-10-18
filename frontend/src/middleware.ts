// frontend/src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const POWER_PAGES = [
  // Podstawowe moce
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

  // MOC + OBROTY (do 18.5 kW)
  // 0.09 kW
  "/silniki-elektryczne-009-kw-700-obr",
  "/silniki-elektryczne-009-kw-900-obr",
  "/silniki-elektryczne-009-kw-1400-obr",
  "/silniki-elektryczne-009-kw-2900-obr",
  // 0.12 kW
  "/silniki-elektryczne-012-kw-700-obr",
  "/silniki-elektryczne-012-kw-900-obr",
  "/silniki-elektryczne-012-kw-1400-obr",
  "/silniki-elektryczne-012-kw-2900-obr",
  // 0.18 kW
  "/silniki-elektryczne-018-kw-700-obr",
  "/silniki-elektryczne-018-kw-900-obr",
  "/silniki-elektryczne-018-kw-1400-obr",
  "/silniki-elektryczne-018-kw-2900-obr",
  // 0.25 kW
  "/silniki-elektryczne-025-kw-700-obr",
  "/silniki-elektryczne-025-kw-900-obr",
  "/silniki-elektryczne-025-kw-1400-obr",
  "/silniki-elektryczne-025-kw-2900-obr",
  // 0.37 kW
  "/silniki-elektryczne-037-kw-700-obr",
  "/silniki-elektryczne-037-kw-900-obr",
  "/silniki-elektryczne-037-kw-1400-obr",
  "/silniki-elektryczne-037-kw-2900-obr",
  // 0.55 kW
  "/silniki-elektryczne-055-kw-700-obr",
  "/silniki-elektryczne-055-kw-900-obr",
  "/silniki-elektryczne-055-kw-1400-obr",
  "/silniki-elektryczne-055-kw-2900-obr",
  // 0.75 kW
  "/silniki-elektryczne-075-kw-700-obr",
  "/silniki-elektryczne-075-kw-900-obr",
  "/silniki-elektryczne-075-kw-1400-obr",
  "/silniki-elektryczne-075-kw-2900-obr",
  // 1.1 kW
  "/silniki-elektryczne-1-1-kw-700-obr",
  "/silniki-elektryczne-1-1-kw-900-obr",
  "/silniki-elektryczne-1-1-kw-1400-obr",
  "/silniki-elektryczne-1-1-kw-2900-obr",
  // 1.5 kW
  "/silniki-elektryczne-1-5-kw-700-obr",
  "/silniki-elektryczne-1-5-kw-900-obr",
  "/silniki-elektryczne-1-5-kw-1400-obr",
  "/silniki-elektryczne-1-5-kw-2900-obr",
  // 2.2 kW
  "/silniki-elektryczne-2-2-kw-700-obr",
  "/silniki-elektryczne-2-2-kw-900-obr",
  "/silniki-elektryczne-2-2-kw-1400-obr",
  "/silniki-elektryczne-2-2-kw-2900-obr",
  // 3 kW
  "/silniki-elektryczne-3-kw-700-obr",
  "/silniki-elektryczne-3-kw-900-obr",
  "/silniki-elektryczne-3-kw-1400-obr",
  "/silniki-elektryczne-3-kw-2900-obr",
  // 4 kW
  "/silniki-elektryczne-4-kw-700-obr",
  "/silniki-elektryczne-4-kw-900-obr",
  "/silniki-elektryczne-4-kw-1400-obr",
  "/silniki-elektryczne-4-kw-2900-obr",
  // 5.5 kW
  "/silniki-elektryczne-5-5-kw-700-obr",
  "/silniki-elektryczne-5-5-kw-900-obr",
  "/silniki-elektryczne-5-5-kw-1400-obr",
  "/silniki-elektryczne-5-5-kw-2900-obr",
  // 7.5 kW
  "/silniki-elektryczne-7-5-kw-700-obr",
  "/silniki-elektryczne-7-5-kw-900-obr",
  "/silniki-elektryczne-7-5-kw-1400-obr",
  "/silniki-elektryczne-7-5-kw-2900-obr",
  // 11 kW
  "/silniki-elektryczne-11-kw-700-obr",
  "/silniki-elektryczne-11-kw-900-obr",
  "/silniki-elektryczne-11-kw-1400-obr",
  "/silniki-elektryczne-11-kw-2900-obr",
  // 18.5 kW
  "/silniki-elektryczne-18-5-kw-700-obr",
  "/silniki-elektryczne-18-5-kw-900-obr",
  "/silniki-elektryczne-18-5-kw-1400-obr",
  "/silniki-elektryczne-18-5-kw-2900-obr",
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
  "/blog",
  "/admin/blog",
  "/admin/blog/new",
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

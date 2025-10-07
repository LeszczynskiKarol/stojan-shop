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

// Lista statycznych ścieżek, które nie powinny być traktowane jako kategorie
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

  // Sprawdź czy ścieżka jest statyczna (nie powinna być traktowana jako kategoria)
  const isStaticPath = STATIC_PATHS.some(
    (staticPath) => path === staticPath || path.startsWith(`${staticPath}/`)
  );

  // Jeśli to statyczna ścieżka (w tym /szukaj), pozwól Next.js ją obsłużyć normalnie
  if (isStaticPath) {
    return response;
  }

  // Jeśli ścieżka zaczyna się od /legal, pozwól na to (dla kompatybilności wstecznej)
  if (path.startsWith("/legal/")) {
    return response;
  }

  // Sprawdź czy to plik statyczny lub zasoby Next.js
  if (
    path.includes(".") ||
    path.startsWith("/_next") ||
    path.startsWith("/api")
  ) {
    return response;
  }

  // Dla wszystkich innych ścieżek (potencjalne kategorie/produkty)
  // możesz tutaj dodać dodatkową logikę jeśli potrzeba
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).)", "/legal/:path"],
};

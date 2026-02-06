// frontend/src/app/api/admin/allegro-products/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = new URLSearchParams();

    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    // TUTAJ JEST ZMIANA - używamy allegroProducts zamiast allegro-products
    const fullUrl = `${process.env.API_URL}/api/allegroProducts/search?${queryParams}`; // POPRAWIONE - backticks

    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd z backendu:", errorText);
      return NextResponse.json(
        { success: false, message: "Błąd pobierania produktów z bazy" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Błąd API:", error);
    return NextResponse.json(
      { success: false, message: "Błąd pobierania produktów z bazy" },
      { status: 500 }
    );
  }
}

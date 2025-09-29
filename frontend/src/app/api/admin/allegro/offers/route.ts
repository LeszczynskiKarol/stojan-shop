// frontend/src/app/api/admin/allegro/offers/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [API ALLEGRO] Otrzymano żądanie POST");

    const body = await request.json();
    console.log(
      "🔧 [API ALLEGRO] Body żądania:",
      JSON.stringify(body, null, 2)
    );

    const apiUrl = `${process.env.API_URL}/api/allegro/offers`;
    console.log("🔧 [API ALLEGRO] Przekierowuję do:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    console.log(
      "🔧 [API ALLEGRO] Status odpowiedzi z backendu:",
      response.status
    );

    const responseText = await response.text();
    console.log("🔧 [API ALLEGRO] Odpowiedź z backendu (raw):", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("🔧 [API ALLEGRO] Błąd parsowania odpowiedzi:", e);
      return NextResponse.json(
        { error: "Nieprawidłowa odpowiedź z serwera", details: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("🔧 [API ALLEGRO] Błąd z backendu:", data);
      return NextResponse.json(
        { error: data.error || "Błąd podczas tworzenia oferty na Allegro" },
        { status: response.status }
      );
    }

    console.log("🔧 [API ALLEGRO] Sukces, zwracam dane:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("🔧 [API ALLEGRO] Krytyczny błąd:", error);
    return NextResponse.json(
      {
        error: `Błąd podczas tworzenia oferty: ${
          error instanceof Error ? error.message : "Nieznany błąd"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Twoja istniejąca funkcja GET pozostaje bez zmian
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "0";
    const limit = searchParams.get("limit") || "20";
    const apiUrl = `${process.env.API_URL}/api/allegro/offers?page=${page}&limit=${limit}`;
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Treść błędu:", errorText);
      throw new Error(
        `Błąd podczas pobierania ofert: ${response.status} ${errorText}`
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Szczegóły błędu:", error);
    return NextResponse.json(
      {
        error: `Błąd podczas pobierania ofert: ${
          error instanceof Error ? error.message : "Nieznany błąd"
        }`,
      },
      { status: 500 }
    );
  }
}

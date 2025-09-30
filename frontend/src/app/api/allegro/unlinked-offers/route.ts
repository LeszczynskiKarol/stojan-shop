// frontend/src/app/api/allegro/unlinked-offers/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[FRONTEND API] Rozpoczęcie pobierania ofert Allegro");

    const baseUrl =
      process.env.API_URL || "https://api.silniki-elektryczne.com.pl";
    const fullUrl = `${baseUrl}/api/allegro/unlinked-offers`;

    console.log("[FRONTEND API] Wywołanie URL:", fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("[FRONTEND API] Status odpowiedzi:", response.status);

    const responseText = await response.text();
    console.log(
      "[FRONTEND API] Treść odpowiedzi (pierwsze 500 znaków):",
      responseText.substring(0, 500)
    );

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("[FRONTEND API] Sparsowane dane:", data);
    } catch (parseError) {
      console.error("[FRONTEND API] Błąd parsowania JSON:", parseError);
      return NextResponse.json(
        { success: false, error: "Błąd parsowania odpowiedzi" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("[FRONTEND API] Błędna odpowiedź:", response.status, data);
      return NextResponse.json(
        { success: false, error: data.error || "Błąd pobierania ofert" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[FRONTEND API] Złapany błąd:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Błąd serwera: " +
          (error instanceof Error ? error.message : "Nieznany błąd"),
      },
      { status: 500 }
    );
  }
}

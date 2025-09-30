// frontend/src/app/api/allegro/unlinked-offers/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl =
      process.env.API_URL || "https://api.silniki-elektryczne.com.pl";
    const response = await fetch(`${baseUrl}/api/allegro/unlinked-offers`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] Błąd pobierania ofert:", errorText);
      return NextResponse.json(
        { success: false, error: "Błąd pobierania ofert" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Błąd:", error);
    return NextResponse.json(
      { success: false, error: "Błąd serwera" },
      { status: 500 }
    );
  }
}

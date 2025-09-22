// frontend/src/app/api/allegroProducts/matches/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const fullUrl = `${process.env.API_URL}/api/allegroProducts/matches`; // POPRAWIONE - backticks

    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[FRONTEND API] Błędna odpowiedź:", response.status);
      const errorText = await response.text();
      console.error("[FRONTEND API] Treść błędu:", errorText);
      return NextResponse.json(
        { success: false, message: "Błąd przy sprawdzaniu dopasowań" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[FRONTEND API] Złapany błąd:", error);
    return NextResponse.json(
      { success: false, message: "Błąd dopasowywania produktów" },
      { status: 500 }
    );
  }
}

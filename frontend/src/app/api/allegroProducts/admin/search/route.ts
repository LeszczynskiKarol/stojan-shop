// frontend/src/app/api/allegroProducts/admin/search/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(
      `${process.env.API_URL}/api/allegroProducts/admin/search?${queryString}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("[FRONTEND API] Błędna odpowiedź:", response.status);
      const errorText = await response.text();
      console.error("[FRONTEND API] Treść błędu:", errorText);
      return NextResponse.json(
        { success: false, message: "Błąd wyszukiwania produktów" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[FRONTEND API] Złapany błąd:", error);
    return NextResponse.json(
      { success: false, message: "Błąd wyszukiwania produktów" },
      { status: 500 }
    );
  }
}

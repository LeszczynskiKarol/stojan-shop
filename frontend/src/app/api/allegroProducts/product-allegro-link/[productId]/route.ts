// frontend/src/app/api/allegroProducts/product-allegro-link/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const response = await fetch(
      `${process.env.API_URL}/api/allegroProducts/product-allegro-link/${productId}`,
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
        { success: false, message: "Błąd pobierania linku Allegro" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[FRONTEND API] Złapany błąd:", error);
    return NextResponse.json(
      { success: false, message: "Błąd pobierania linku Allegro" },
      { status: 500 }
    );
  }
}

// frontend/src/app/api/allegro/link-product/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    console.log(
      "[API ROUTE] Powiązywanie produktu:",
      productId,
      "z Allegro:",
      body.allegroOfferId
    );

    const baseUrl =
      process.env.API_URL || "https://api.silniki-elektryczne.com.pl";
    const response = await fetch(
      `${baseUrl}/api/allegro/link-product/${productId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[API ROUTE] Błąd powiązywania:",
        response.status,
        errorText
      );
      return NextResponse.json(
        { success: false, error: "Błąd powiązywania produktu" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[API ROUTE] Sukces powiązania:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API ROUTE] Błąd:", error);
    return NextResponse.json(
      { success: false, error: "Błąd serwera" },
      { status: 500 }
    );
  }
}

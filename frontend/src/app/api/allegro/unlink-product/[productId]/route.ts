// frontend/src/app/api/allegro/unlink-product/[productId]/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;

    console.log(
      "[API ROUTE] Usuwanie powiązania Allegro dla produktu:",
      productId,
    );

    const baseUrl =
      process.env.API_URL || "https://api.silniki-elektryczne.com.pl";
    const response = await fetch(
      `${baseUrl}/api/allegro/unlink-product/${productId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[API ROUTE] Błąd usuwania powiązania:",
        response.status,
        errorText,
      );
      return NextResponse.json(
        { success: false, error: "Błąd usuwania powiązania" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("[API ROUTE] Sukces usunięcia powiązania:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API ROUTE] Błąd:", error);
    return NextResponse.json(
      { success: false, error: "Błąd serwera" },
      { status: 500 },
    );
  }
}

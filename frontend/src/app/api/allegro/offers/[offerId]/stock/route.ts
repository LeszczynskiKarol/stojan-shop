// frontend/src/app/api/allegro/offers/[offerId]/stock/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${process.env.API_URL}/api/allegro/offers/${offerId}/stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd aktualizacji stanu:", errorText);
      return NextResponse.json(
        { success: false, message: "Błąd aktualizacji stanu" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Błąd:", error);
    return NextResponse.json(
      { success: false, message: "Błąd serwera" },
      { status: 500 }
    );
  }
}

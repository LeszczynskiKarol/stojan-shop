// frontend/src/app/api/allegroProducts/import/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> } // ZMIANA: Promise<>
) {
  try {
    const { productId } = await params; // ZMIANA: await params
    const body = await request.json();

    const response = await fetch(
      `${process.env.API_URL}/api/allegroProducts/import/${productId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error("Błąd importu");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Błąd importu produktu" },
      { status: 500 }
    );
  }
}

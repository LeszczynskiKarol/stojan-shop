// frontend/src/app/api/admin/allegro/import-all/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/allegro/admin/allegro/import-all`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Błąd importu z backendu:", errorText);
      return NextResponse.json(
        {
          success: false,
          message: `Błąd importu: ${response.status}`,
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Błąd podczas importu wszystkich produktów:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Błąd podczas importu produktów z Allegro",
        error: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}

// frontend/src/app/api/products/unlinked-count/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl =
      process.env.API_URL || "https://api.silniki-elektryczne.com.pl";
    const response = await fetch(`${baseUrl}/api/products/unlinked-count`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Błąd pobierania liczby niepowiązanych produktów");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Błąd:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

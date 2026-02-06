// src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.API_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Błąd odpowiedzi z backendu:', response.status);
      const errorText = await response.text();
      console.error('Treść błędu:', errorText);
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Szczegóły błędu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się pobrać kategorii',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

// frontend/src/app/api/admin/allegro/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '0';
    const limit = searchParams.get('limit') || '20';

    const apiUrl = `${process.env.API_URL}/api/allegro/offers?page=${page}&limit=${limit}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Treść błędu:', errorText);
      throw new Error(`Błąd podczas pobierania ofert: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Szczegóły błędu:', error);
    return NextResponse.json(
      {
        error: `Błąd podczas pobierania ofert: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`,
      },
      { status: 500 }
    );
  }
}

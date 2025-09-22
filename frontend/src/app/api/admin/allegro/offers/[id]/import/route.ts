// frontend/src/app/api/admin/allegro/offers/[offerId]/import/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const apiUrl = `${process.env.API_URL}/api/allegro/offers/${resolvedParams.id}/import`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd podczas importowania oferty: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Szczegóły błędu:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Nieznany błąd' }, { status: 500 });
  }
}

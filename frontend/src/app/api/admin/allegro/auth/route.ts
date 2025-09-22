// frontend/src/app/api/allegro/auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.API_URL}/api/allegro/auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Błąd podczas pobierania URL autoryzacji');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd autoryzacji Allegro:', error);
    return NextResponse.json(
      { error: 'Nie udało się rozpocząć autoryzacji z Allegro' },
      { status: 500 }
    );
  }
}

// frontend/src/app/api/products/manufacturers/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = new URL('/api/products/manufacturers', process.env.API_URL);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd podczas pobierania listy producentów:', error);
    return NextResponse.json(
      { success: false, error: 'Nie udało się pobrać listy producentów' },
      { status: 500 }
    );
  }
}

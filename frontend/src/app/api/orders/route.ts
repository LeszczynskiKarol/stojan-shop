// frontend/src/app/api/orders/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const limit = searchParams.get('limit') || '20';
    const status = searchParams.get('status');

    let url = `${process.env.API_URL}/api/orders?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd podczas pobierania zamówień:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas pobierania zamówień' },
      { status: 500 }
    );
  }
}

// frontend/src/app/api/admin/allegro/auth/status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.API_URL}/api/allegro/auth/status`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd sprawdzania statusu autoryzacji:', error);
    return NextResponse.json({ data: { isAuthenticated: false } });
  }
}

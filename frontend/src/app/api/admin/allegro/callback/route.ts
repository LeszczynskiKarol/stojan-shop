// frontend/src/app/api/allegro/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/products?error=no-code', req.url));
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/allegro/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    // Dodajmy sprawdzenie odpowiedzi
    if (!response.ok) {
      console.error('Błąd odpowiedzi:', await response.text());
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Ustawiamy stan autentykacji na true
      const authStore = await import('@/store/allegroAuthStore');
      authStore.useAllegroAuthStore.getState().setAuthenticated(true);

      return NextResponse.redirect(new URL('/products?auth=success', req.url));
    }

    return NextResponse.redirect(new URL('/products?error=auth', req.url));
  } catch (error) {
    console.error('Szczegóły błędu autentykacji:', error);
    return NextResponse.redirect(new URL('/products?error=auth', req.url));
  }
}

// frontend/src/app/api/orders/[id]/status/route.ts
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const body = await request.json();
    const response = await fetch(`${process.env.API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Błąd podczas aktualizacji statusu' },
      { status: 500 }
    );
  }
}

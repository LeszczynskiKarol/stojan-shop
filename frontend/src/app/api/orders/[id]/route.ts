// frontend/src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params;
  const { id } = resolvedParams;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`);

    if (!response.ok) {
      throw new Error('Nie udało się pobrać zamówienia');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać zamówienia' }, { status: 404 });
  }
}

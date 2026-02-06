// frontend/src/app/api/orders/[id]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const formData = await request.formData();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${resolvedParams.id}/invoice`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Nie udało się wysłać faktury' }, { status: 500 });
  }
}

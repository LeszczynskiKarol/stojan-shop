// frontend/src/app/api/admin/categories/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const response = await fetch(`${process.env.API_URL}/api/categories/${resolvedParams.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się pobrać kategorii',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const body = await request.json();

    const response = await fetch(`${process.env.API_URL}/api/categories/${resolvedParams.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się zaktualizować kategorii',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const response = await fetch(`${process.env.API_URL}/api/categories/${resolvedParams.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się usunąć kategorii',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

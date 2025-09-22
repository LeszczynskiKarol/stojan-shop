// src/app/api/admin/products/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Pobierz wszystkie parametry z URLa
    const { searchParams } = new URL(request.url);
    const apiUrl = new URL(`${process.env.API_URL}/api/products/admin/products`);

    // Przekaż wszystkie parametry
    for (const [key, value] of searchParams.entries()) {
      apiUrl.searchParams.append(key, value);
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Błąd odpowiedzi z backendu:', response.status);
      const errorText = await response.text();
      console.error('Treść błędu:', errorText);
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Szczegóły błędu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się pobrać produktów',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const productData = await request.json();

    const response = await fetch(`${process.env.API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd podczas tworzenia produktu');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd podczas aktualizacji produktu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się dodaćć produktu',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${process.env.API_URL}/api/products/${body.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Błąd aktualizacji produktu:', errorText);
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd podczas aktualizacji produktu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się zaktualizować produktu',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new Error('Brak ID produktu');
    }

    const response = await fetch(`${process.env.API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Błąd usuwania produktu:', errorText);
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Błąd podczas usuwania produktu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Nie udało się usunąć produktu',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}

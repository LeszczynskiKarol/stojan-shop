// frontend/src/app/(admin)/admin/manufacturers/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ManufacturerForm } from '@/components/admin/manufacturers/ManufacturerForm';
import { IManufacturer } from '@/types/manufacturer.types';

export default function EditManufacturerPage() {
  const { id } = useParams();
  const [manufacturer, setManufacturer] = useState<IManufacturer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManufacturer = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/manufacturers/${id}`);
        const data = await response.json();
        setManufacturer(data.data);
      } catch (error) {
        console.error('Błąd:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchManufacturer();
    }
  }, [id]);

  if (loading) return <div>Ładowanie...</div>;
  if (!manufacturer) return <div>Nie znaleziono producenta</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edytuj producenta</h1>
      <ManufacturerForm initialData={manufacturer} />
    </div>
  );
}

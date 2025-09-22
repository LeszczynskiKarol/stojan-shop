// frontend/src/app/(admin)/admin/categories/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CategoryForm } from '@/components/admin/categories/CategoryForm';

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    // Tutaj dodamy pobieranie danych kategorii
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/admin/categories/${params.id}`);
        if (!response.ok) {
          console.error('Błąd HTTP:', response.status);
          const errorText = await response.text();
          console.error('Treść błędu:', errorText);
          return;
        }
        const data = await response.json();

        setCategory(data.data);
      } catch (error) {
        console.error('Błąd podczas pobierania kategorii:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id !== 'new') {
      fetchCategory();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {category ? 'Edytuj stronę kategorii' : 'Dodaj nową stronę kategorii'}
      </h1>
      <CategoryForm initialData={category} />
    </div>
  );
}

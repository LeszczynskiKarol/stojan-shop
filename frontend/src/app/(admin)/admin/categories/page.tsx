// frontend/src/app/(admin)/admin/categories/page.tsx
'use client';

import { useEffect } from 'react';
import { useCategoryStore } from '@/store/categoryStore';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { CategoryList } from '@/components/admin/categories/CategoryList';
import { useRouter } from 'next/navigation';

export default function CategoriesPage() {
  const { categories, fetchCategories, loading } = useCategoryStore();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Zarządzanie Stronami Kategorii</h1>
        <Button
          onClick={() => router.push('/admin/categories/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Dodaj stronę kategorii
        </Button>
      </div>

      <CategoryList categories={categories} loading={loading} />
    </div>
  );
}

// frontend/src/app/(admin)/admin/categories/new/page.tsx
'use client';

import { CategoryForm } from '@/components/admin/categories/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dodaj nową kategorię</h1>
      <CategoryForm />
    </div>
  );
}

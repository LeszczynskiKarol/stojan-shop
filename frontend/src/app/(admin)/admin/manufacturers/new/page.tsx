// frontend/src/app/(admin)/admin/manufacturers/new/page.tsx
import { ManufacturerForm } from '@/components/admin/manufacturers/ManufacturerForm';

export default function NewManufacturerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dodaj producenta</h1>
      <ManufacturerForm />
    </div>
  );
}

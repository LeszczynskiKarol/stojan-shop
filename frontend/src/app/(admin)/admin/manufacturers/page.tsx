// frontend/src/app/(admin)/admin/manufacturers/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useManufacturerStore } from '@/store/manufacturerStore';

export default function ManufacturersPage() {
  const router = useRouter();
  const { manufacturers, loading, error, fetchManufacturers, deleteManufacturer } =
    useManufacturerStore();

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego producenta?')) {
      try {
        await deleteManufacturer(id);
        router.refresh();
      } catch (error) {
        console.error('Błąd podczas usuwania:', error);
      }
    }
  };

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Producenci</h1>
        <Link href="/admin/manufacturers/new">
          <Button>Dodaj producenta</Button>
        </Link>
      </div>

      <div className="rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b text-left">Nazwa</th>
              <th className="px-6 py-3 border-b text-left">URL</th>
              <th className="px-6 py-3 border-b text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(manufacturers) && manufacturers.length > 0 ? (
              manufacturers.map((manufacturer) => (
                <tr key={manufacturer.id}>
                  <td className="px-6 py-4 border-b">{manufacturer.name}</td>
                  <td className="px-6 py-4 border-b">{manufacturer.slug}</td>
                  <td className="px-6 py-4 border-b text-right">
                    <Button
                      variant="ghost"
                      onClick={() => router.push(`/admin/manufacturers/${manufacturer.id}`)}
                      className="mr-2"
                    >
                      Edytuj
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(manufacturer.id)}>
                      Usuń
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center">
                  Brak producentów
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

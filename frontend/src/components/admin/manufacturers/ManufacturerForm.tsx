// frontend/src/components/admin/manufacturers/ManufacturerForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { IManufacturer } from '@/types/manufacturer.types';
import { useManufacturerStore } from '@/store/manufacturerStore';

interface ManufacturerFormProps {
  initialData?: IManufacturer | null;
}

export function ManufacturerForm({ initialData }: ManufacturerFormProps) {
  const router = useRouter();
  const { createManufacturer, updateManufacturer } = useManufacturerStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    seo: {
      title: initialData?.seo?.title || '',
      description: initialData?.seo?.description || '',
      keywords: initialData?.seo?.keywords?.join(', ') || '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const manufacturerData = {
        ...formData,
        seo: {
          ...formData.seo,
          keywords: formData.seo.keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        },
      };

      if (initialData) {
        await updateManufacturer(initialData.id, manufacturerData);
      } else {
        await createManufacturer(manufacturerData);
      }

      router.push('/admin/manufacturers');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nazwa producenta</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Opis</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">SEO</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Tytuł SEO</label>
            <Input
              value={formData.seo.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, title: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opis SEO</label>
            <Textarea
              value={formData.seo.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, description: e.target.value },
                }))
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Słowa kluczowe (oddzielone przecinkami)
            </label>
            <Input
              value={formData.seo.keywords}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, keywords: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/manufacturers')}>
          Anuluj
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}
    </form>
  );
}

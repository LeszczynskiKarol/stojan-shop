// frontend/src/app/marka-producent/[slug]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Metadata } from '@/components/Metadata';
import { useProductStore } from '@/store/productStore';
import { IManufacturer } from '@/types/manufacturer.types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export default function ManufacturerPage() {
  const { slug } = useParams();
  const [manufacturer, setManufacturer] = useState<IManufacturer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { products, fetchProducts } = useProductStore();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Filtorwanie produktów ze stanem > 0
  const availableProducts = products.filter((product) => product.stock > 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/manufacturers/by-slug/${slug}`);
        const data = await response.json();

        if (data.success) {
          setManufacturer(data.data);
          await fetchProducts({
            manufacturer: data.data.name,
          });
        }
      } catch (error) {
        console.error('Błąd:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, fetchProducts]);

  if (isLoading) return <div>Ładowanie...</div>;
  if (!manufacturer) return <div>Nie znaleziono producenta</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Metadata
        title={manufacturer.seo?.title || `${manufacturer.name} - Silniki Elektryczne`}
        description={manufacturer.seo?.description || `Napędy producenta ${manufacturer.name}`}
        keywords={manufacturer.seo?.keywords}
      />

      <Breadcrumbs items={[{ label: manufacturer.name, href: `/marka-producent/${slug}` }]} />

      <h1 className="text-3xl font-bold mb-4 mt-4">{manufacturer.name}</h1>

      {manufacturer.description && (
        <div className="mb-8">
          <div
            className={`prose max-w-none ${
              !isDescriptionExpanded ? 'max-h-32 overflow-hidden' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: manufacturer.description }}
          />
          <Button
            variant="ghost"
            className="mt-2 flex items-center gap-2"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            {isDescriptionExpanded ? (
              <>
                Pokaż mniej <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Pokaż więcej <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">Napędy producenta {manufacturer.name}</h2>
        <ProductGrid products={availableProducts} />
      </div>
    </div>
  );
}

// frontend/app/(admin)/admin/products/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductDetailsCard } from '@/components/products/ProductDetailsCard';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { ProductWithId } from '@/types/product.types';
import { useAllegroAuthStore } from '@/store/allegroAuthStore';
import { productAPI } from '@/lib/api';

const ProductPage = () => {
  const params = useParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, checkAuthStatus } = useAllegroAuthStore();

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      if (!productId) {
        console.error('Brak ID produktu');
        toast({
          title: 'Błąd',
          description: 'Nieprawidłowe ID produktu',
          variant: 'destructive',
        });
        return;
      }

      try {
        const authStatus = await checkAuthStatus();

        if (!authStatus) {
          router.push('/admin/marketplaces/allegro');
          return;
        }

        try {
          const response = await productAPI.getById(productId);

          if (response.success && response.data) {
            setProduct(response.data);
            return;
          }
        } catch (error) {
          console.log('Nie znaleziono produktu w bazie, próbuję Allegro...');
        }

        // Jeśli produkt nie istnieje w naszej bazie, próbujemy pobrać z Allegro
        try {
          const allegroResponse = await fetch(`/api/allegro/offers/${params.id}`);

          if (!allegroResponse.ok) {
            throw new Error(`Błąd pobierania z Allegro: ${allegroResponse.status}`);
          }

          const allegroData = await allegroResponse.json();
          if (allegroData.success && allegroData.data) {
            setProduct(allegroData.data);
          } else {
            throw new Error('Brak danych produktu w odpowiedzi Allegro');
          }
        } catch (allegroError) {
          console.error('Błąd pobierania z Allegro:', allegroError);
          throw allegroError;
        }
      } catch (error) {
        console.error('Błąd ogólny:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się pobrać szczegółów produktu',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      init();
    }
  }, [productId, router, checkAuthStatus, toast]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div>Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <Button onClick={() => router.back()} variant="ghost" className="mb-6">
          ← Powrót
        </Button>
        <div className="text-center text-red-500">Nie znaleziono produktu</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button onClick={() => router.back()} variant="ghost" className="mb-6">
        ← Powrót
      </Button>
      <ProductDetailsCard product={product} />
    </div>
  );
};

export default ProductPage;

// frontend/src/components/products/ProductDetailsCard.tsx
'use client';
import React from 'react';
import { Home, ShoppingCart, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AllegroSection } from './sections/AllegroSection';
import { OwnStoreSection } from './sections/OwnStoreSection';
import { IProduct } from '@/types/product.types';

interface ProductDetailsCardProps {
  product: IProduct;
}

export const ProductDetailsCard: React.FC<ProductDetailsCardProps> = ({ product }) => {
  return (
    <div>
      <Tabs defaultValue="ownStore" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ownStore">
            <Home className="w-4 h-4 mr-2" />
            Sklep własny
          </TabsTrigger>
          <TabsTrigger value="allegro">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Allegro
          </TabsTrigger>
          <TabsTrigger value="olx">
            <Store className="w-4 h-4 mr-2" />
            OLX
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allegro">
          <AllegroSection product={product} />
        </TabsContent>

        <TabsContent value="olx">
          <div className="p-4 text-center text-muted-foreground">Sekcja OLX w przygotowaniu</div>
        </TabsContent>

        <TabsContent value="ownStore">
          <OwnStoreSection product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

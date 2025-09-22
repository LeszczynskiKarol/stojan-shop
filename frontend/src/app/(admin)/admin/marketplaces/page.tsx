// frontend/src/app/(admin)/admin/marketplaces/page.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { ShoppingBag, Home, Store } from 'lucide-react';

const MarketplacesPage = () => {
  const router = useRouter();

  const marketplaces = [
    {
      id: 'allegro',
      name: 'Allegro',
      icon: ShoppingBag,
      description: 'Zarządzaj ofertami na platformie Allegro',
      color: 'bg-orange-500',
    },
    {
      id: 'olx',
      name: 'OLX',
      icon: Store,
      description: 'Zarządzaj ogłoszeniami na OLX',
      color: 'bg-green-500',
    },
    {
      id: 'own-store',
      name: 'Sklep własny',
      icon: Home,
      description: 'Zarządzaj produktami w sklepie własnym',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Zarządzanie marketplace</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {marketplaces.map((marketplace) => {
          const Icon = marketplace.icon;
          return (
            <Card
              key={marketplace.id}
              className="cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => router.push(`/admin/marketplaces/${marketplace.id}`)}
            >
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-full ${marketplace.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{marketplace.name}</h2>
                <p className="text-gray-600">{marketplace.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplacesPage;

// frontend/src/components/shop/Cart.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export const Cart = () => {
  const { cart, removeItem, updateQuantity } = useCartStore();
  const router = useRouter();

  if (cart.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Twój koszyk jest pusty</h2>
        <Button onClick={() => router.push('/shop')}>Przejdź do sklepu</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Koszyk</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center border-b border-border py-4 space-x-4"
            >
              {item.image && (
                <div className="w-24 h-24 relative">
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
                </div>
              )}
              <div className="flex-grow">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-500">
                  {item.price.toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                  })}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                    className="border rounded p-1"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(item.productId)} className="text-red-500">
                    Usuń
                  </button>
                </div>
              </div>
              <div className="font-semibold">
                {(item.price * item.quantity).toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-bold mb-4">Podsumowanie</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Suma częściowa</span>
              <span>
                {cart.subtotal.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Dostawa</span>
              <span>
                {cart.shipping.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </span>
            </div>
            <div className="border-t pt-2 font-bold">
              <div className="flex justify-between">
                <span>Razem</span>
                <span>
                  {cart.total.toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                  })}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push('/checkout')} className="w-full mt-6" size="lg">
            Przejdź do kasy
          </Button>
        </div>
      </div>
    </div>
  );
};

// frontend/src/components/products/AllegroAuthButton.tsx
import React from 'react';
import { useAllegroAuthStore } from '@/store/allegroAuthStore';
import { Button } from '@/components/ui/Button';

export const AllegroAuthButton = () => {
  const { isAuthenticated } = useAllegroAuthStore();

  if (!isAuthenticated) {
    return null;
  }

  return <Button type="submit">Wystaw na Allegro</Button>;
};

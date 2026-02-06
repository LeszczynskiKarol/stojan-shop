// frontend/src/components/providers/OrderEventsProvider.tsx
'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export const OrderEventsProvider = () => {
  const { handleOrderCancellation } = useCartStore();

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ORDER_CANCELLED') {
          handleOrderCancellation(data.orderId);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [handleOrderCancellation]);

  return null;
};

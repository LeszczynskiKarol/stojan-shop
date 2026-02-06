// frontend/src/components/shop/StripePaymentForm.tsx
'use client';

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

export const StripePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [error, setError] = useState<string>();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        },
      });

      if (submitError) {
        setError(submitError.message);
      } else {
        clearCart();
        router.push('/checkout/success');
      }
    } catch (error) {
      console.error('Błąd płatności:', error);
      setError('Wystąpił błąd podczas przetwarzania płatności');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" disabled={!stripe || processing} className="w-full">
        {processing ? 'Przetwarzanie...' : 'Zapłać'}
      </Button>
    </form>
  );
};

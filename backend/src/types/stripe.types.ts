// backend/src/types/stripe.types.ts
import Stripe from 'stripe';

export interface StripeWebhookPayload {
  id: string;
  object: string;
  type: 'checkout.session.completed' | 'checkout.session.expired';
  data: {
    object: {
      id: string;
      amount: number;
      status: string;
      metadata: {
        orderId: string;
      };
    };
  };
}

export interface StripeCheckoutSession extends Stripe.Checkout.Session {
  metadata: {
    orderId: string;
  };
}

export interface StripeWebhookEvent extends Omit<Stripe.Event, 'data'> {
  data: {
    object: StripeCheckoutSession;
  };
}

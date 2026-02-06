// backend/src/services/stripe.service.ts
import Stripe from 'stripe';
import { env } from '../config/env.config';

export class StripeService {
  public stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {});
  }

  async createCheckoutSession(orderData: {
    orderId: string;
    items: any[];
    shipping: any;
    total: number;
    returnUrl?: string;
    shippingCost: number;
    analyticsSessionId: string;
  }) {
    try {
      const lineItems = [
        // produkty
        ...orderData.items.map((item) => ({
          price_data: {
            currency: 'pln',
            product_data: {
              name: item.name || 'Produkt',
              images: [item.mainImage || item.image || item.images?.[0]].filter(
                Boolean
              ),
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        // koszt wysyłki
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: 'Koszt dostawy',
            },
            unit_amount: Math.round(orderData.shippingCost * 100),
          },
          quantity: 1,
        },
      ];

      // KLUCZOWA ZMIANA: Nie wysyłamy całych danych do metadata!
      // Metadata służy TYLKO do powiązania płatności z zamówieniem
      // Wszystkie dane klienta są już zapisane w bazie danych w obiekcie Order
      const metadata = {
        orderId: orderData.orderId,
        analytics_session_id: orderData.analyticsSessionId,
        // NIE DODAWAJ formData ani companyData!
        // Te dane są już w bazie danych
      };

      // Sprawdzenie długości metadata (dla bezpieczeństwa)
      const metadataString = JSON.stringify(metadata);
      if (metadataString.length > 500) {
        console.error('Metadata za długie:', metadataString.length);
        // W razie problemów zachowaj tylko orderId
        throw new Error('Metadata przekracza limit 500 znaków');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card', 'blik', 'p24'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: orderData.shipping.email,
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout?stripe_cancel=true`,
        metadata: metadata, // Tylko orderId i analytics_session_id
        payment_method_options: {
          p24: {
            // tos_shown_and_accepted: true,
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji checkout:', error);
      throw error;
    }
  }

  async constructEventFromPayload(payload: string | Buffer, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Błąd konstruowania eventu:', error);
      throw error;
    }
  }
}

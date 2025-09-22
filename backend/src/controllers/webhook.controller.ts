// backend/src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { env } from '../config/env.config';
import { ApiError } from '../utils/apiError';
import { StripeService } from '../services/stripe.service';
import { ProductService } from '../services/product.service';
import type Stripe from 'stripe';

export class WebhookController {
  private orderService: OrderService;
  private stripeService: StripeService;
  private productService: ProductService;

  constructor() {
    this.orderService = new OrderService();
    this.stripeService = new StripeService();
    this.productService = new ProductService();
  }

  handleStripeWebhook = async (req: Request, res: Response) => {
    console.log('🎯 Webhook otrzymany:', {
      headers: req.headers['stripe-signature'],
      body: req.body,
    });

    try {
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        console.error('Brak podpisu Stripe');
        throw new ApiError(400, 'Brak podpisu Stripe');
      }

      if (!env.STRIPE_WEBHOOK_SECRET) {
        console.error('Brak skonfigurowanego STRIPE_WEBHOOK_SECRET');
        throw new ApiError(500, 'Błąd konfiguracji webhooków');
      }

      const payload = (req as any).rawBody || req.body;
      const signature = Array.isArray(sig) ? sig[0] : sig;

      const event = this.stripeService.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = session.metadata?.orderId;
          if (!orderId) {
            console.error('Brak orderId w metadanych sesji');
            throw new Error('Brak orderId w metadanych sesji');
          }
          await this.handleCheckoutCompleted(session);
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (!session.metadata?.orderId) {
            throw new Error('Brak orderId w metadanych sesji');
          }
          await this.handleCheckoutExpired(session);
          break;
        }
        default:
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Szczegółowy błąd webhooka:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });

      res
        .status(400)
        .send(
          `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
  };

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      if (!session.metadata?.orderId) {
        console.error('Brak orderId w metadanych sesji:', session);
        throw new Error('Brak orderId w metadanych sesji');
      }

      // Najpierw aktualizujemy status na paid - to wyśle maile
      await this.orderService.updateOrderStatus(
        session.metadata.orderId,
        'paid'
      );

      console.log(
        '🔄 Rozpoczynam synchronizację z Allegro po płatności Stripe'
      );
      await this.orderService.reserveStockForOrder(session.metadata.orderId);
      console.log('✅ Synchronizacja z Allegro zakończona');

      const order = await this.orderService.getOrderById(
        session.metadata.orderId
      );
      const itemsWithIds = order.items.filter((item) => {
        if (!item.productId) {
          console.error('Pominięto przedmiot bez productId:', item);
          return false;
        }
        return true;
      });

      for (const item of itemsWithIds) {
        try {
          await this.productService.updateStock(item.productId, -item.quantity);
        } catch (error) {
          console.error(
            `Błąd aktualizacji stanu dla produktu ${item.productId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania płatności:', {
        error,
        session: session.id,
        orderId: session.metadata?.orderId,
      });
      throw error;
    }
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    try {
      if (!session.metadata?.orderId) {
        throw new Error('Brak orderId w metadanych sesji');
      }

      await this.orderService.updateOrderStatus(
        session.metadata.orderId,
        'cancelled'
      );
    } catch (error) {
      console.error('Błąd podczas obsługi wygaśnięcia sesji:', error);
      throw error;
    }
  }
}

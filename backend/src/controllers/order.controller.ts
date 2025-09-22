// backend/src/controllers/order.controller.ts
import express, { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { OrderService } from '../services/order.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { StripeService } from '../services/stripe.service';
import { AnalyticsService } from '../services/analytics.service';
import { CartItem } from '../types/cart.types';
import { Order } from '../types/order.types';

export class OrderController {
  private orderService: OrderService;
  private stripeService: StripeService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.orderService = new OrderService();
    this.stripeService = new StripeService();
    this.analyticsService = new AnalyticsService();
  }

  public handleSSE = async (req: Request, res: Response) => {
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const handleOrderCancelled = (data: { orderId: string }) => {
        res.write(
          `data: ${JSON.stringify({ type: 'ORDER_CANCELLED', orderId: data.orderId })}\n\n`
        );
      };

      this.orderService.onOrderCancelled(handleOrderCancelled);

      // Wysyłamy inicjalne połączenie
      res.write('data: {"type": "connected"}\n\n');

      // Obsługa rozłączenia
      req.on('close', () => {
        this.orderService.removeOrderCancelledListener(handleOrderCancelled);
        res.end();
      });
    } catch (error) {
      console.error('SSE Error:', error);
      res.status(500).end();
    }
  };

  public createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { items, shipping, paymentMethod } = req.body;

      const shippingCost = await this.orderService.calculateShippingCost(
        items,
        paymentMethod
      );

      const subtotal = items.reduce((sum: number, item: CartItem) => {
        return sum + item.price * item.quantity;
      }, 0);

      // Dodajemy obliczanie totalWeight
      const totalWeight = items.reduce((sum: number, item: CartItem) => {
        return sum + Number(item.weight) * item.quantity;
      }, 0);

      const total = subtotal + shippingCost;

      const result = await this.orderService.createOrder({
        items,
        shipping,
        subtotal,
        shippingCost,
        total,
        totalWeight,
        paymentMethod,
        returnUrl: req.body.returnUrl,
        analyticsSessionId: req.body.analyticsSessionId,
      });

      if (paymentMethod === 'cod' && result.data.order) {
        // Wywołujemy updateOrderStatus, który wyśle maile
        await this.orderService.updateOrderStatus(result.data.order.id, 'paid');
      }

      // Owijamy result w dodatkową strukturę success
      res.status(201).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Błąd:', error);
      res
        .status(500)
        .json(
          ApiResponse.error(
            (error as Error).message || 'Błąd podczas tworzenia zamówienia'
          )
        );
    }
  };

  public getOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.json(ApiResponse.success(order));
    } catch (error) {
      res.status(404).json(ApiResponse.error('Zamówienie nie znalezione'));
    }
  };

  public handleStripeWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.log('❌ Brak podpisu Stripe');

      res.status(400).json(ApiResponse.error('Brak podpisu Stripe'));
      return;
    }

    try {
      const event = await this.stripeService.constructEventFromPayload(
        req.body,
        sig
      );

      // Sprawdzamy czy to event sesji checkoutowej
      if (
        !(
          'checkout.session.completed' === event.type ||
          'checkout.session.expired' === event.type
        )
      ) {
        console.log('⚠️ Nieobsługiwany typ eventu:', event.type);

        res.json({ received: true });
        return;
      }

      // W tym momencie wiemy, że to na pewno event sesji checkoutowej
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = session.metadata || {};
      const orderId = metadata.orderId;
      const analyticsSessionId = metadata.analytics_session_id;

      if (!orderId || !analyticsSessionId) {
        throw new Error('Brak wymaganych danych w metadanych sesji');
      }

      if (!orderId) {
        console.error('Brak orderId w metadata');
        res.status(400).json(ApiResponse.error('Brak orderId w metadata'));
        return;
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          const orderId = session.metadata?.orderId;

          if (!orderId) {
            throw new Error('Brak orderId w metadanych sesji');
          }

          // Pobieramy szczegóły PaymentIntent, aby uzyskać informacje o metodzie płatności
          const paymentIntent =
            await this.stripeService.stripe.paymentIntents.retrieve(
              session.payment_intent as string
            );

          // Wywołujemy trackEvent z dodatkowymi informacjami o płatności
          await this.analyticsService.trackEvent({
            eventType: 'order_success',
            sessionId: analyticsSessionId,
            data: {
              order_id: orderId,
              payment_method: 'stripe',
              payment_type: paymentIntent.payment_method_types[0],
              payment_status: paymentIntent.status,
              payment_amount: session.amount_total
                ? session.amount_total / 100
                : 0,
              timestamp: new Date().toISOString(),
            },
          });

          await this.orderService.updateOrder(orderId, {
            stripeSessionId: session.id,
            status: 'paid' as const,
            paymentDetails: {
              method: 'stripe',
              type: paymentIntent.payment_method_types[0],
              status: paymentIntent.status,
            },
          });

          await this.orderService.reserveStockForOrder(orderId);

          break;
        }

        case 'checkout.session.expired': {
          // Nie czyścimy koszyka, tylko aktualizujemy status
          await this.orderService.updateOrderStatus(orderId, 'cancelled');

          break;
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Błąd webhooka:', error);
      res
        .status(400)
        .json(
          ApiResponse.error(
            `Błąd webhooka: ${error.message || 'Nieznany błąd'}`
          )
        );
    }
  };

  public getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      // Parsuj filtry - upewnij się że zawsze mamy wartości boolean
      const filters = {
        status: req.query.status as Order['status'],
        searchTerm: req.query.search as string,
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
        hidePending: req.query.hidePending === 'true', // Zawsze boolean
        hideCancelled: req.query.hideCancelled === 'true', // Zawsze boolean
        sortField: req.query.sortField as string,
        sortDirection: (req.query.sortDirection as 'ASC' | 'DESC') || 'DESC',
      };

      const result = await this.orderService.getAllOrders(page, limit, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Błąd pobierania zamówień:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zamówień',
      });
    }
  };

  // Nowa metoda do aktualizacji statusu
  public updateOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await this.orderService.updateOrderStatus(id, status);
      res.json(ApiResponse.success(order));
    } catch (error) {
      console.error('Błąd podczas aktualizacji statusu:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas aktualizacji statusu'));
    }
  };

  public getOrderByStripeSession = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const order = await this.orderService.findByStripeSessionId(sessionId);

      if (!order) {
        console.log('❌ Nie znaleziono zamówienia dla sessionId:', sessionId);
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono zamówienia',
        });
      }

      return res.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } catch (error) {
      console.error('💥 Błąd podczas pobierania zamówienia:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd serwera',
      });
    }
  };

  public uploadInvoice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new Error('Brak plików');
      }

      // Pobierz aktualne zamówienie aby sprawdzić limit
      const order = await this.orderService.getOrderById(id);
      const currentUrls = order.invoiceUrls || [];

      if (currentUrls.length + files.length > 4) {
        throw new ApiError(
          400,
          'Przekroczono maksymalną liczbę dokumentów (4)'
        );
      }

      // Uploaduj wszystkie pliki i zbierz URLe
      const uploadPromises = files.map((file) =>
        this.orderService.uploadInvoice(id, file.buffer, file.originalname)
      );

      const urls = await Promise.all(uploadPromises);

      // Zapisz wszystkie URLe na raz
      await this.orderService.updateOrder(id, {
        invoiceUrls: [...currentUrls, ...urls],
      });

      res.json(ApiResponse.success({ invoiceUrls: urls }));
    } catch (error) {
      console.error('Błąd podczas uploadowania dokumentów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Nie udało się zapisać dokumentów'));
    }
  };

  public deleteInvoice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { fileName } = req.body;

      await this.orderService.deleteInvoice(id, fileName);

      // Zwracamy prawidłową odpowiedź JSON
      res.json({
        success: true,
        message: 'Faktura została usunięta',
      });
    } catch (error) {
      console.error('Błąd podczas usuwania faktury:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Nie udało się usunąć faktury',
        });
      }
    }
  };
  public getOrderStats = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, groupBy } = req.query;

      const parsedStartDate = startDate
        ? new Date(startDate as string)
        : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      const parsedGroupBy = (groupBy as 'day' | 'week' | 'month') || 'day';

      const stats = await this.orderService.getOrderStats(
        parsedStartDate,
        parsedEndDate,
        parsedGroupBy
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error w kontrolerze:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching order statistics',
      });
    }
  };

  public getOrderByNumber = async (
    req: express.Request,
    res: express.Response
  ): Promise<void> => {
    try {
      const orderNumber = req.params.orderNumber;

      const order = await this.orderService.findByOrderNumber(orderNumber);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Nie znaleziono zamówienia',
        });
        return;
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Błąd podczas pobierania zamówienia:', error);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd serwera',
      });
    }
  };

  public deleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      // Używaj cancelOrder z domyślnym powodem dla kompatybilności wstecznej
      await this.orderService.cancelOrder(
        id,
        'Usunięte przez administratora',
        'admin'
      );
      res.json({ success: true, message: 'Zamówienie zostało anulowane' });
    } catch (error) {
      console.error('Błąd podczas anulowania zamówienia:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas anulowania zamówienia',
      });
    }
  };

  public deleteMultipleOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Brak ID zamówień do anulowania',
        });
        return;
      }

      // Używaj cancelMultipleOrders z domyślnym powodem
      await this.orderService.cancelMultipleOrders(
        ids,
        'Usunięte przez administratora',
        'admin'
      );
      res.json({
        success: true,
        message: `Anulowano ${ids.length} zamówień`,
      });
    } catch (error) {
      console.error('Błąd podczas anulowania zamówień:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas anulowania zamówień',
      });
    }
  };

  public cancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, cancelledBy } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Powód anulowania jest wymagany',
        });
        return;
      }

      await this.orderService.cancelOrder(id, reason, cancelledBy);
      res.json({
        success: true,
        message: 'Zamówienie zostało anulowane',
      });
    } catch (error) {
      console.error('Błąd podczas anulowania zamówienia:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas anulowania zamówienia',
      });
    }
  };

  public cancelMultipleOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { ids, reason, cancelledBy } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Brak ID zamówień do anulowania',
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Powód anulowania jest wymagany',
        });
        return;
      }

      await this.orderService.cancelMultipleOrders(ids, reason, cancelledBy);
      res.json({
        success: true,
        message: `Anulowano ${ids.length} zamówień`,
      });
    } catch (error) {
      console.error('Błąd podczas anulowania zamówień:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas anulowania zamówień',
      });
    }
  };

  public getDetailedStats = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      // Używamy istniejącej metody getAllOrders
      const result = await this.orderService.getAllOrders(0, 1000, {
        dateFrom: startDate ? new Date(startDate as string) : undefined,
        dateTo: endDate ? new Date(endDate as string) : undefined,
      });

      const orders = result.orders;

      // Analiza produktów z typami
      const productStats = new Map<
        string,
        { quantity: number; revenue: number; orders: number }
      >();

      orders.forEach((order: Order) => {
        order.items.forEach((item: any) => {
          const current = productStats.get(item.name) || {
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
          productStats.set(item.name, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + item.price * item.quantity,
            orders: current.orders + 1,
          });
        });
      });

      res.json({
        success: true,
        data: {
          topProducts: Array.from(productStats.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10),
          ordersByStatus: orders.reduce(
            (acc: Record<string, number>, order: Order) => {
              acc[order.status] = (acc[order.status] || 0) + 1;
              return acc;
            },
            {}
          ),
          totalRevenue: orders.reduce(
            (sum: number, o: Order) => sum + Number(o.total),
            0
          ),
          averageOrderValue:
            orders.length > 0
              ? orders.reduce(
                  (sum: number, o: Order) => sum + Number(o.total),
                  0
                ) / orders.length
              : 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd pobierania szczegółowych statystyk',
      });
    }
  };
}

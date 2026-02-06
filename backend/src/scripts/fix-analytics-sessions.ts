// backend/src/scripts/fix-analytics-sessions.ts
import { AppDataSource } from '../config/database';
import { AnalyticsEvent } from '../entities/AnalyticsEvent';
import { AnalyticsSession, TrafficSource } from '../entities/AnalyticsSession';
import { Order } from '../entities/Order';

async function fixAnalyticsSessions() {
  await AppDataSource.initialize();

  console.log('🔧 Naprawiam sesje analityczne...');

  // Pobierz wszystkie zamówienia
  const orders = await AppDataSource.getRepository(Order).find({
    where: [{ status: 'paid' }, { status: 'shipped' }, { status: 'delivered' }],
    order: { createdAt: 'DESC' },
  });

  console.log(`📦 Znaleziono ${orders.length} opłaconych zamówień`);

  for (const order of orders) {
    // Szukaj eventów order_success dla tego zamówienia
    const orderEvents = await AppDataSource.getRepository(AnalyticsEvent)
      .createQueryBuilder('event')
      .where('event.eventType = :type', { type: 'order_success' })
      .andWhere(
        `event.data->>'order_id' = :orderId OR event.data->>'orderId' = :orderId`,
        {
          orderId: order.orderNumber,
        }
      )
      .getMany();

    if (orderEvents.length > 0) {
      // Mamy event - napraw sesję
      for (const orderEvent of orderEvents) {
        const session = await AppDataSource.getRepository(
          AnalyticsSession
        ).findOne({
          where: { sessionId: orderEvent.sessionId },
        });

        if (session) {
          console.log(
            `✅ Naprawiam sesję ${session.sessionId} dla zamówienia ${order.orderNumber}`
          );

          session.conversion = {
            occurred: true,
            type: 'order_success',
            value: Number(order.total),
            orderId: order.orderNumber,
            paymentMethod: order.paymentMethod === 'cod' ? 'cod' : 'online',
            paymentType: order.paymentMethod,
            paymentStatus: 'completed',
          };

          await AppDataSource.getRepository(AnalyticsSession).save(session);
        }
      }
    } else {
      // Nie ma eventu - utwórz nową sesję z datą zamówienia
      console.log(
        `📝 Tworzę brakującą sesję dla zamówienia ${order.orderNumber}`
      );

      const newSession = new AnalyticsSession();
      newSession.sessionId = `order-fix-${order.id}`;
      newSession.trafficSource = TrafficSource.DIRECT;
      newSession.ipAddress = '0.0.0.0';
      newSession.userAgent = 'Order Fix Script';
      newSession.browserName = 'System';
      newSession.browserVersion = '1.0';
      newSession.osName = 'System';
      newSession.osVersion = '1.0';
      newSession.deviceType = 'desktop';
      newSession.geoLocation = {};
      newSession.isBot = false;
      newSession.pageViews = 1;
      newSession.duration = 60;
      newSession.startTime = order.createdAt;
      newSession.endTime = order.createdAt;
      newSession.lastActivityTime = order.createdAt;
      newSession.events = [
        {
          eventType: 'order_success',
          timestamp: order.createdAt,
          url: '/checkout/success',
          data: {
            order_id: order.orderNumber,
            payment_method: order.paymentMethod,
            total: Number(order.total),
          },
        },
      ];
      newSession.conversion = {
        occurred: true,
        type: 'order_success',
        value: Number(order.total),
        orderId: order.orderNumber,
        paymentMethod: order.paymentMethod === 'cod' ? 'cod' : 'online',
        paymentType: order.paymentMethod,
        paymentStatus: 'completed',
      };

      await AppDataSource.getRepository(AnalyticsSession).save(newSession);
    }
  }

  // Napraw też sesje które mają add_to_cart_conversion ale mają order_success w eventach
  console.log('🔍 Szukam sesji z błędnym statusem konwersji...');

  const sessionsWithWrongStatus = await AppDataSource.getRepository(
    AnalyticsSession
  )
    .createQueryBuilder('session')
    .where(`session.conversion->>'type' = 'add_to_cart_conversion'`)
    .getMany();

  for (const session of sessionsWithWrongStatus) {
    // Sprawdź czy ta sesja ma event order_success
    const hasOrderSuccess = session.events.some(
      (e) => e.eventType === 'order_success'
    );

    if (hasOrderSuccess) {
      console.log(
        `🔧 Poprawiam status sesji ${session.sessionId} z 'add_to_cart_conversion' na 'order_success'`
      );
      const orderEvent = session.events.find(
        (e) => e.eventType === 'order_success'
      );

      session.conversion = {
        ...session.conversion,
        type: 'order_success',
        value:
          orderEvent?.data?.total ||
          orderEvent?.data?.payment_amount ||
          session.conversion.value,
      };

      await AppDataSource.getRepository(AnalyticsSession).save(session);
    }
  }

  console.log('✨ Naprawa zakończona!');
  process.exit(0);
}

fixAnalyticsSessions().catch(console.error);

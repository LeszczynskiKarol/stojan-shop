// backend/src/services/order.service.ts
import { Between, Repository } from 'typeorm';
import {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { calculateDeliveryDates } from '../utils/deliveryDate';
import { uploadToS3 } from '../utils/s3Client';
import { Order } from '../entities/Order';
import { AppDataSource } from '../config/database';
import { StripeService } from './stripe.service';
import { EmailService } from './email.service';
import { ProductService } from './product.service';
import { ApiError } from '../utils/apiError';
import { ShippingAddress } from '../types/order.types';
import { EventEmitter } from 'events';
import { CartItem } from '../types/cart.types';
import { AllegroService } from './allegro.service';
import { Product } from '../entities/Product';
import { SHIPPING_METHODS } from '../config/shipping.config';

type GroupBy = 'day' | 'week' | 'month';

class OrderEventEmitter extends EventEmitter {}
const orderEvents = new OrderEventEmitter();

export class OrderService {
  private readonly RESERVATION_TIME = 30 * 60 * 1000;
  private emailService: EmailService;
  private repository: Repository<Order>;
  private stripeService: StripeService;
  private allegroService: AllegroService;
  private productService: ProductService;
  private eventEmitter: OrderEventEmitter;
  private s3Client: S3Client;

  constructor() {
    this.repository = AppDataSource.getRepository(Order);
    this.stripeService = new StripeService();
    this.productService = new ProductService();
    this.eventEmitter = orderEvents;
    this.emailService = new EmailService();
    this.allegroService = new AllegroService();
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private async generateOrderNumber(
    createdAt: Date = new Date()
  ): Promise<string> {
    const year = createdAt.getFullYear();
    const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');

    const orders = await this.repository
      .createQueryBuilder('order')
      .where('EXTRACT(YEAR FROM "createdAt") = :year', { year })
      .andWhere('EXTRACT(MONTH FROM "createdAt") = :month', {
        month: parseInt(month),
      })
      .orderBy('order.orderNumber', 'DESC')
      .getMany();

    let maxSequence = 0;
    for (const order of orders) {
      try {
        // Dodaj sprawdzenie czy orderNumber istnieje
        if (order.orderNumber) {
          const sequence = parseInt(order.orderNumber.split('/')[0]);
          if (!isNaN(sequence) && sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      } catch (error) {
        console.error('Błąd parsowania numeru zamówienia:', error);
        // Kontynuuj pętlę zamiast przerywać
        continue;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${nextSequence.toString().padStart(3, '0')}/${month}/${year}`;
  }

  async createOrder(orderData: {
    items: any[];
    shipping: ShippingAddress;
    subtotal: number;
    shippingCost: number;
    total: number;
    totalWeight: number;
    returnUrl?: string;
    paymentMethod: 'prepaid' | 'cod';
    analyticsSessionId: string;
    invoiceData?: {
      companyName?: string;
      nip?: string;
      street?: string;
      postalCode?: string;
      city?: string;
      isDifferentAddress: boolean;
    };
  }) {
    try {
      // Sprawdź, czy wagi produktów są prawidłowe
      const invalidWeights = orderData.items.filter((item) => {
        const weight = Number(item.weight);
        return isNaN(weight) || weight <= 0;
      });

      if (invalidWeights.length > 0) {
        console.error('Nieprawidłowe wagi produktów:', invalidWeights);
        throw new ApiError(400, 'Nieprawidłowe wagi produktów');
      }

      const itemsWithParsedWeights = orderData.items.map((item) => ({
        ...item,
        weight: Number(item.weight),
        totalWeight: Number(item.weight) * item.quantity,
      }));

      const missingFields = orderData.items
        .map((item) => {
          const missing = [];
          if (!item.productId) missing.push('productId');
          if (!item.categorySlug) missing.push('categorySlug');
          if (!item.slug) missing.push('slug');
          return { item, missing };
        })
        .filter((x) => x.missing.length > 0);

      if (missingFields.length > 0) {
        console.warn('Brakujące pola w produktach:', missingFields);
      }

      const itemsWithSlugs = await Promise.all(
        orderData.items.map(async (item) => {
          try {
            const product = await this.productService.getProductById(
              item.productId
            );

            // Sprawdź czy mamy wszystkie potrzebne dane
            if (
              !product ||
              !product.categories ||
              !product.marketplaces?.ownStore
            ) {
              // Zwróć item bez zmian jeśli nie ma danych
              return item;
            }

            return {
              ...item,
              weight: item.weight,
              categorySlug: product.categories[0]?.slug || 'default',
              slug: product.marketplaces?.ownStore?.slug || 'default',
            };
          } catch (error) {
            console.error('Błąd przy pobieraniu produktu:', error);
            // W przypadku błędu zwróć oryginalny item
            return item;
          }
        })
      );
      const orderNumber = await this.generateOrderNumber();

      const totalWeight = Number(orderData.totalWeight);

      if (isNaN(totalWeight)) {
        console.error('Nieprawidłowa waga całkowita:', totalWeight);
        throw new ApiError(400, 'Nieprawidłowa waga całkowita');
      }

      const dates = calculateDeliveryDates(totalWeight);
      const order = this.repository.create({
        ...orderData,
        items: itemsWithParsedWeights,
        status: 'pending',
        expiresAt: new Date(Date.now() + this.RESERVATION_TIME),
        isStockReserved: false,
        orderNumber,
        shippingDate: dates.shippingDate,
        totalWeight: Number(orderData.totalWeight),
      });

      await this.repository.save(order);

      if (orderData.paymentMethod === 'cod') {
        await this.updateOrderStatus(order.id, 'paid');
        await this.reserveStock(order);
      }

      // Tylko dla przedpłaty tworzymy sesję Stripe
      if (orderData.paymentMethod === 'prepaid') {
        const session = await this.stripeService.createCheckoutSession({
          orderId: order.id,
          items: orderData.items,
          shipping: orderData.shipping,
          shippingCost: orderData.shippingCost,
          total: orderData.total,
          returnUrl: orderData.returnUrl,
          analyticsSessionId: orderData.analyticsSessionId,
        });

        await this.repository.save({
          ...order,
          stripeSessionId: session.id,
        });

        return {
          success: true,
          data: {
            order: {
              ...order,
              items: order.items.map((item) => ({
                ...item,
                productId: item.productId,
              })),
            },
            checkoutUrl: session.url,
          },
        };
      }

      // Dla płatności za pobraniem zwracamy tylko dane zamówienia
      return {
        success: true,
        data: {
          order: {
            ...order,
            items: order.items.map((item) => ({
              ...item,
              productId: item.productId,
            })),
          },
        },
      };
    } catch (error) {
      console.error('Błąd tworzenia zamówienia:', error);
      throw new ApiError(500, 'Błąd podczas tworzenia zamówienia');
    }
  }

  private async reserveStock(order: Order) {
    const productService = new ProductService();
    const allegroService = new AllegroService();

    if (order.isStockReserved) return;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        // Pobierz produkt ze sklepu z pełnymi relacjami
        const storeProduct = await AppDataSource.getRepository(Product)
          .createQueryBuilder('product')
          .where('product.id = :id', { id: item.productId })
          .getOne();

        if (!storeProduct) {
          console.warn(`⚠️ Nie znaleziono produktu ${item.productId}`);
          continue;
        }

        const newStock = storeProduct.stock - item.quantity;
        await productService.setStock(item.productId, newStock);

        if (storeProduct.matched_store_product?.store_product_id) {
          const allegroProduct = await AppDataSource.getRepository(Product)
            .createQueryBuilder('product')
            .where('product.id = :id', {
              id: storeProduct.matched_store_product.store_product_id,
            })
            .getOne();

          if (allegroProduct?.marketplaces?.allegro?.productId) {
            await allegroService.updateOfferStockById(
              allegroProduct.marketplaces.allegro.productId,
              newStock
            );
          } else {
            console.warn(
              `⚠️ Produkt Allegro nie ma prawidłowego productId:`,
              allegroProduct
            );
          }
        }
      }

      order.isStockReserved = true;
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(`❌ Błąd:`, error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async releaseStock(order: Order) {
    const productService = new ProductService();

    for (const item of order.items) {
      await productService.updateStock(item.productId, item.quantity);
    }

    order.isStockReserved = false;
  }

  private scheduleOrderCheck(orderId: string) {
    setTimeout(async () => {
      try {
        const order = await this.getOrderById(orderId);

        if (order.status === 'pending') {
          // Jeśli zamówienie nadal jest pending po czasie, anulujemy je
          await this.cancelExpiredOrder(order);
        }
      } catch (error) {
        console.error('Błąd podczas sprawdzania zamówienia:', error);
      }
    }, this.RESERVATION_TIME);
  }

  async cancelExpiredOrder(order: Order) {
    if (order.isStockReserved) {
      await this.releaseStock(order);
    }

    if (order.status !== 'pending') {
      this.emitOrderCancelled(order.id);
    }

    order.status = 'cancelled';
    await this.repository.save(order);
    // Usuwamy wywołanie emailService.sendOrderCancellation(order)
  }

  private emitOrderCancelled(orderId: string) {
    this.eventEmitter.emit('orderCancelled', { orderId });
  }

  public onOrderCancelled(callback: (data: { orderId: string }) => void) {
    this.eventEmitter.on('orderCancelled', callback);
  }

  async getOrderById(id: string) {
    const order = await this.repository.findOne({ where: { id } });
    if (!order) throw new ApiError(404, 'Zamówienie nie znalezione');
    return order;
  }

  async updateOrderStatus(id: string, status: Order['status']) {
    const order = await this.getOrderById(id);

    const previousStatus = order.status;
    order.status = status;
    await this.repository.save(order);

    if (status === 'paid' && previousStatus === 'pending') {
      await this.emailService.sendOrderConfirmation(order);
    } else if (status === 'shipped') {
      await this.emailService.sendOrderStatusUpdate(order);
    }

    return order;
  }

  public removeOrderCancelledListener(
    callback: (data: { orderId: string }) => void
  ) {
    this.eventEmitter.removeListener('orderCancelled', callback);
  }

  public async calculateShippingCost(
    items: CartItem[],
    paymentMethod: 'prepaid' | 'cod'
  ): Promise<number> {
    // Oblicz całkowitą wagę
    let totalWeight = 0;
    for (const item of items) {
      const product = await this.productService.getProductById(item.productId);
      totalWeight += (product.weight || 0) * item.quantity;
    }

    // Znajdź odpowiednią stawkę
    const shippingMethod = SHIPPING_METHODS[0];
    const rate = shippingMethod.rates.find(
      (r) => totalWeight >= r.minWeight && totalWeight <= r.maxWeight
    );

    if (!rate) {
      throw new ApiError(
        400,
        'Nie można obliczyć kosztu wysyłki dla podanej wagi'
      );
    }

    // Sprawdź czy za pobraniem jest dostępne dla tej wagi
    if (paymentMethod === 'cod' && rate.codCost === null) {
      throw new ApiError(
        400,
        'Płatność za pobraniem nie jest dostępna dla tej wagi'
      );
    }

    return paymentMethod === 'cod' ? rate.codCost! : rate.prepaidCost;
  }

  async getAllOrders(
    page: number = 0,
    limit: number = 20,
    filters?: {
      status?: Order['status'] | 'all';
      searchTerm?: string;
      dateFrom?: Date;
      dateTo?: Date;
      hidePending?: boolean;
      hideCancelled?: boolean;
      sortField?: string;
      sortDirection?: 'ASC' | 'DESC';
    }
  ) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('order');

      // Budowanie warunków WHERE
      const conditions: string[] = [];
      const parameters: any = {};

      // Filtr statusu
      if (filters?.status && filters.status !== 'all') {
        conditions.push('order.status = :status');
        parameters.status = filters.status;
      }

      // Ukrywanie pending i cancelled
      const hiddenStatuses: string[] = [];

      if (filters?.hidePending) {
        hiddenStatuses.push('pending');
      }

      if (filters?.hideCancelled) {
        hiddenStatuses.push('cancelled');
      }

      if (hiddenStatuses.length > 0) {
        conditions.push('order.status NOT IN (:...hiddenStatuses)');
        parameters.hiddenStatuses = hiddenStatuses;
      }

      // Filtr daty
      if (filters?.dateFrom && filters?.dateTo) {
        conditions.push('order.createdAt BETWEEN :dateFrom AND :dateTo');
        parameters.dateFrom = filters.dateFrom;
        parameters.dateTo = filters.dateTo;
      }

      // Wyszukiwanie
      if (filters?.searchTerm) {
        const searchCondition = `(
    LOWER("order"."orderNumber") LIKE :search OR 
    LOWER("order"."shipping"->>'firstName') LIKE :search OR 
    LOWER("order"."shipping"->>'lastName') LIKE :search OR
    LOWER("order"."shipping"->>'street') LIKE :search OR
    LOWER("order"."shipping"->>'city') LIKE :search OR
    LOWER("order"."shipping"->>'postalCode') LIKE :search OR
    LOWER("order"."shipping"->>'phone') LIKE :search OR
    LOWER("order"."shipping"->>'email') LIKE :search OR
    LOWER("order"."shipping"->>'companyName') LIKE :search OR
    LOWER("order"."shipping"->>'nip') LIKE :search OR
    LOWER("order"."items"::text) LIKE :searchJson
  )`;
        conditions.push(searchCondition);
        parameters.search = `%${filters.searchTerm.toLowerCase()}%`;
        parameters.searchJson = `%${filters.searchTerm.toLowerCase()}%`;
      }

      // Aplikuj warunki
      if (conditions.length > 0) {
        queryBuilder.where(conditions.join(' AND '), parameters);
      }

      // Sortowanie
      const sortField = filters?.sortField || 'createdAt';
      const sortDirection = filters?.sortDirection || 'DESC';

      switch (sortField) {
        case 'orderNumber':
          queryBuilder.orderBy('order.orderNumber', sortDirection);
          break;
        case 'total':
          queryBuilder.orderBy('order.total', sortDirection);
          break;
        case 'status':
          queryBuilder.orderBy('order.status', sortDirection);
          break;
        case 'createdAt':
        default:
          queryBuilder.orderBy('order.createdAt', sortDirection);
          break;
      }

      // Dodaj drugorzędne sortowanie dla stabilności
      queryBuilder.addOrderBy('order.id', 'ASC');

      // Pobierz całkowitą liczbę przed paginacją
      const total = await queryBuilder.getCount();

      // Zastosuj paginację
      queryBuilder.skip(page * limit).take(limit);

      const orders = await queryBuilder.getMany();

      return {
        orders,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      };
    } catch (error) {
      console.error('Błąd podczas pobierania zamówień:', error);
      throw new ApiError(500, 'Błąd podczas pobierania zamówień');
    }
  }

  async findByStripeSessionId(sessionId: string) {
    const order = await this.repository.findOne({
      where: {
        stripeSessionId: sessionId,
      },
    });
    return order;
  }

  async updateOrder(id: string, updateData: Partial<Order>) {
    const order = await this.getOrderById(id);
    Object.assign(order, updateData);
    return await this.repository.save(order);
  }

  async uploadInvoice(orderId: string, file: Buffer, fileName: string) {
    try {
      const url = await uploadToS3(
        file,
        `stojan/invoices/${fileName}`,
        'application/pdf'
      );

      return url;
    } catch (error) {
      console.error('Błąd podczas uploadowania dokumentu:', error);
      throw new ApiError(500, 'Nie udało się zapisać dokumentu');
    }
  }

  public async reserveStockForOrder(orderId: string): Promise<void> {
    const order = await this.getOrderById(orderId);
    await this.reserveStock(order);
    order.isStockReserved = true;
    await this.repository.save(order);
  }

  async deleteInvoice(orderId: string, fileName: string) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order.invoiceUrls?.length) {
        throw new ApiError(404, 'Brak faktur do usunięcia');
      }

      // Szukamy URL-a faktury po dokładnej nazwie pliku
      const invoiceUrl = order.invoiceUrls.find((url) => {
        return url.split('/').pop() === fileName;
      });

      if (!invoiceUrl) {
        throw new ApiError(404, 'Faktura nie znaleziona');
      }

      // Usuwamy z S3 używając oryginalnej nazwy pliku
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `stojan/invoices/${fileName}`,
        })
      );

      const updatedUrls = order.invoiceUrls.filter((url) => url !== invoiceUrl);
      await this.repository.update(order.id, { invoiceUrls: updatedUrls });

      return {
        success: true,
        message: 'Faktura została pomyślnie usunięta',
      };
    } catch (error) {
      console.error('Błąd podczas usuwania faktury:', error);
      throw error instanceof ApiError
        ? error
        : new ApiError(500, 'Nie udało się usunąć faktury');
    }
  }

  async getOrderStats(
    startDate?: Date,
    endDate?: Date,
    groupBy: GroupBy = 'day'
  ) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('order');

      // Bazowe warunki - tylko zatwierdzone zamówienia
      queryBuilder.where('order.status IN (:...statuses)', {
        statuses: ['paid', 'shipped', 'delivered'],
      });

      // Dodaj warunek dla zakresu dat
      if (startDate && endDate) {
        queryBuilder.andWhere(
          'order.createdAt >= :startDate AND order.createdAt <= :endDate',
          {
            startDate: startDate,
            endDate: endDate,
          }
        );
      }

      // Wybierz odpowiednie formatowanie daty w zależności od grupowania
      let dateFormat: string;
      switch (groupBy) {
        case 'week':
          dateFormat = "DATE_TRUNC('week', order.createdAt)";
          break;
        case 'month':
          dateFormat = "DATE_TRUNC('month', order.createdAt)";
          break;
        default:
          dateFormat = 'DATE(order.createdAt)';
      }

      const stats = await queryBuilder
        .select([
          `${dateFormat} as date`,
          'COALESCE(SUM(order.total), 0) as "totalRevenue"',
          'COUNT(order.id) as "totalOrders"',
          'COALESCE(AVG(order.total), 0) as "averageOrderValue"',
        ])
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      // Formatowanie wyników
      const formattedStats = stats.map((stat) => ({
        date: new Date(stat.date).toISOString().split('T')[0],
        totalRevenue: parseFloat(stat.totalRevenue) || 0,
        totalOrders: parseInt(stat.totalOrders) || 0,
        averageOrderValue: parseFloat(stat.averageOrderValue) || 0,
      }));

      return formattedStats;
    } catch (error) {
      console.error('Error in getOrderStats:', error);
      throw new ApiError(500, 'Error getting order statistics');
    }
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.repository.findOne({
      where: { orderNumber },
    });

    return order;
  }

  async cancelOrder(
    id: string,
    reason: string,
    cancelledBy?: string
  ): Promise<void> {
    const order = await this.getOrderById(id);

    // Jeśli zamówienie ma zarezerwowany stan magazynowy, zwolnij go
    if (order.isStockReserved && order.status !== 'cancelled') {
      await this.releaseStock(order);
    }

    // Zamiast usuwać, aktualizuj status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy || 'admin';

    await this.repository.save(order);
  }

  async cancelMultipleOrders(
    ids: string[],
    reason: string,
    cancelledBy?: string
  ): Promise<void> {
    const orders = await this.repository.findByIds(ids);

    for (const order of orders) {
      if (order.isStockReserved && order.status !== 'cancelled') {
        await this.releaseStock(order);
      }

      order.status = 'cancelled';
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = cancelledBy || 'admin';
    }

    await this.repository.save(orders);
  }
}

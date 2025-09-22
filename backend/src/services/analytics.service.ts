// backend/src/services/analytics.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AnalyticsEvent } from '../entities/AnalyticsEvent';
import { AnalyticsSession, TrafficSource } from '../entities/AnalyticsSession';

export class AnalyticsService {
  private eventRepository: Repository<AnalyticsEvent>;
  private sessionRepository: Repository<AnalyticsSession>;

  constructor() {
    this.eventRepository = AppDataSource.getRepository(AnalyticsEvent);
    this.sessionRepository = AppDataSource.getRepository(AnalyticsSession);
  }

  async trackEvent(eventData: {
    eventType: string;
    data: any;
    userId?: string;
    sessionId: string;
    productId?: string;
    categoryId?: string;
    manufacturerId?: string;
    ipAddress?: string;
  }) {
    if (
      eventData.eventType === 'add_to_cart_conversion' ||
      eventData.eventType === 'order_success' ||
      eventData.eventType === 'order_pending' ||
      eventData.eventType === 'order_cancelled'
    ) {
      await this.sessionRepository
        .createQueryBuilder()
        .update(AnalyticsSession)
        .set({
          conversion: {
            occurred: eventData.eventType !== 'order_cancelled',
            type: eventData.eventType,
            ...eventData.data,
          },
        })
        .where('sessionId = :sessionId', { sessionId: eventData.sessionId })
        .execute();
    }

    const event = this.eventRepository.create({
      ...eventData,
      createdAt: new Date(),
    });

    try {
      const savedEvent = await this.eventRepository.save(event);
      return savedEvent;
    } catch (error) {
      console.error('❌ Błąd zapisu eventu:', error);
      throw error;
    }
  }

  async getProductViewsStats(
    productId: string,
    period: 'day' | 'week' | 'month'
  ) {
    // implementacja statystyk dla produktu
  }

  async getCategoryViewsStats(
    categoryId: string,
    period: 'day' | 'week' | 'month'
  ) {
    // implementacja statystyk dla kategorii
  }

  async getConversionStats(type: 'product' | 'category' | 'manufacturer') {
    // implementacja statystyk konwersji
  }

  async getSessionStats(filters: {
    startDate?: Date;
    endDate?: Date;
    trafficSource?: TrafficSource;
    deviceType?: string;
  }) {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'COUNT(DISTINCT session.id) as totalSessions',
        'AVG(session.duration) as avgDurationSeconds', // zmiana tutaj
        'SUM(session.pageViews) as totalPageViews',
        "COUNT(CASE WHEN session.conversion->'occurred' = 'true' THEN 1 END) as conversions",
      ])
      .where('session.isBot = :isBot', { isBot: false });

    if (filters.startDate) {
      queryBuilder.andWhere('session.startTime >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('session.startTime <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters.trafficSource) {
      queryBuilder.andWhere('session.trafficSource = :source', {
        source: filters.trafficSource,
      });
    }
    if (filters.deviceType) {
      queryBuilder.andWhere('session.deviceType = :deviceType', {
        deviceType: filters.deviceType,
      });
    }

    const result = await queryBuilder.getRawOne();
    return result;
  }

  async getDetailedSessions(page: number = 1, perPage: number = 20) {
    // Najpierw pobieramy unikalne sessionId
    const uniqueSessionIds = await this.sessionRepository
      .createQueryBuilder('session')
      .select('session.sessionId', 'sessionId')
      .where('session.isBot = :isBot', { isBot: false })
      .getRawMany();

    // Jeśli nie ma żadnych sesji, zwracamy pusty wynik
    if (uniqueSessionIds.length === 0) {
      return { sessions: [], total: 0, pages: 0 };
    }

    // Tworzymy query builder
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'session.id',
        'session.sessionId',
        'session.trafficSource',
        'session.deviceType',
        'session.browserName',
        'session.browserVersion',
        'session.osName',
        'session.osVersion',
        'session.geoLocation',
        'session.startTime',
        'session.endTime',
        'session.duration',
        'session.pageViews',
        'session.events',
        'session.conversion',
        'session.ipAddress',
        'session.referringUrl',
      ])
      .where('session.isBot = :isBot', { isBot: false })
      .andWhere('session.sessionId IN (:...sessionIds)', {
        sessionIds: uniqueSessionIds.map((s) => s.sessionId),
      })
      .orderBy('session.startTime', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const sessions = await queryBuilder.getMany();
    const total = uniqueSessionIds.length;

    return { sessions, total, pages: Math.ceil(total / perPage) };
  }

  async getConversionFunnel() {
    const result = await this.sessionRepository.query(`
      SELECT 
        COUNT(DISTINCT "sessionId") as total_sessions,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM analytics_events 
          WHERE analytics_events."sessionId" = analytics_sessions."sessionId" 
          AND "eventType" = 'product_click'
        ) THEN "sessionId" END) as product_views,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM analytics_events 
          WHERE analytics_events."sessionId" = analytics_sessions."sessionId" 
          AND "eventType" = 'add_to_cart_conversion'
        ) THEN "sessionId" END) as add_to_carts,
        COUNT(DISTINCT CASE WHEN conversion->>'type' = 'order_success' 
          THEN "sessionId" END) as purchases,
        COUNT(DISTINCT CASE WHEN conversion->>'type' = 'order_cancelled' 
          THEN "sessionId" END) as cancelled_orders
      FROM analytics_sessions
      WHERE "isBot" = false
    `);

    return result[0];
  }

  async getTrafficSourceBreakdown() {
    return this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'session.trafficSource',
        'COUNT(*) as count',
        'AVG(session.duration) as avgDuration', // zmiana tutaj
      ])
      .where('session.isBot = :isBot', { isBot: false })
      .groupBy('session.trafficSource')
      .getRawMany();
  }

  async getDetailedTrafficStats() {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'session.trafficSource as source',
        'COUNT(*) as total',
        'AVG(session.duration) as avgDuration',
        'SUM(session.pageViews) as totalPageViews',
        `COUNT(CASE WHEN session.conversion->>'type' = 'add_to_cart_conversion' THEN 1 END) as addToCart`,
        `COUNT(CASE WHEN session.conversion->>'type' = 'order_pending' THEN 1 END) as orderStart`,
        `COUNT(CASE WHEN session.conversion->>'type' = 'order_success' THEN 1 END) as orderSuccess`,
      ])
      .where('session.isBot = :isBot', { isBot: false })
      .groupBy('session.trafficSource');

    const results = await queryBuilder.getRawMany();
    const total = results.reduce(
      (sum, source) => sum + parseInt(source.total),
      0
    );

    return results.map((source) => ({
      source: source.source,
      total: parseInt(source.total),
      percentage: ((parseInt(source.total) / total) * 100).toFixed(2),
      avgDuration: Math.floor(parseFloat(source.avgduration) || 0),
      pagesPerSession: (
        parseInt(source.totalpageviews) / parseInt(source.total)
      ).toFixed(2),
      addToCartRate: (
        (parseInt(source.addtocart) / parseInt(source.total)) *
        100
      ).toFixed(2),
      orderStartRate: (
        (parseInt(source.orderstart) / parseInt(source.total)) *
        100
      ).toFixed(2),
      orderSuccessRate: (
        (parseInt(source.ordersuccess) / parseInt(source.total)) *
        100
      ).toFixed(2),
      addToCartCount: parseInt(source.addtocart),
      orderStartCount: parseInt(source.orderstart),
      orderSuccessCount: parseInt(source.ordersuccess),
    }));
  }

  async getOverallStats() {
    const stats = await this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'COUNT(DISTINCT session.id) as totalSessions',
        'AVG(session.duration) as avgDuration',
        'AVG(session.pageViews) as avgPageViews',
        `COUNT(CASE WHEN session.conversion->>'type' = 'add_to_cart_conversion' THEN 1 END) as cartConversions`,
        `COUNT(CASE WHEN session.conversion->>'type' = 'order_pending' THEN 1 END) as startedOrders`,
        `COUNT(CASE WHEN session.conversion->>'type' = 'order_success' THEN 1 END) as successOrders`,
      ])
      .where('session.isBot = :isBot', { isBot: false })
      .getRawOne();

    return {
      totalSessions: parseInt(stats.totalsessions),
      avgDuration: Math.floor(parseFloat(stats.avgduration) || 0),
      avgPageViews: parseFloat(stats.avgpageviews).toFixed(2),
      cartRate: (
        (parseInt(stats.cartconversions) / parseInt(stats.totalsessions)) *
        100
      ).toFixed(2),
      orderStartRate: (
        (parseInt(stats.startedorders) / parseInt(stats.totalsessions)) *
        100
      ).toFixed(2),
      orderSuccessRate: (
        (parseInt(stats.successorders) / parseInt(stats.totalsessions)) *
        100
      ).toFixed(2),
    };
  }
}

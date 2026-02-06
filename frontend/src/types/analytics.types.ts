// frontend/src/types/analytics.types.ts
export interface AnalyticsSession {
  id: string;
  sessionId: string;
  trafficSource:
    | "direct"
    | "referral"
    | "search_engine"
    | "social"
    | "google_ads";
  referringUrl?: string;
  ipAddress: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  geoLocation: {
    country?: string;
    city?: string;
    region?: string;
  };
  startTime: string;
  lastActivityTime: string;
  endTime?: string;
  duration: string;
  pageViews: number;
  isBot: boolean;
  events: Array<{
    eventType: string;
    timestamp: string;
    url: string;
    data: any;
  }>;
  conversion?: {
    occurred: boolean;
    type?:
      | "add_to_cart_conversion"
      | "order_pending"
      | "order_success"
      | "order_cancelled";
    value?: number;
    productId?: string;
    orderId?: string;
    paymentMethod?: string;
    paymentType?: string;
    paymentStatus?: string;
  };
}

export interface AnalyticsData {
  stats: {
    totalSessions: number;
    avgDurationSeconds: number;
    totalPageViews: number;
    conversions: number;
  };
  trafficBreakdown: {
    trafficSource: string;
    count: number;
    avgDuration: number;
  }[];
  funnel: {
    total_sessions: number;
    product_views: number;
    add_to_carts: number;
    purchases: number;
  };
  sessions: AnalyticsSession[];
}

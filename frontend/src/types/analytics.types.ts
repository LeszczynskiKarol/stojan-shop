// frontend/src/types/analytics.types.ts
export interface AnalyticsSession {
  id: string;
  sessionId: string;
  trafficSource: "direct" | "referral" | "search_engine" | "social";
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

// backend/src/services/analytics-session.service.ts
import { DeepPartial, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AnalyticsSession, TrafficSource } from '../entities/AnalyticsSession';
import { detectBot } from '../utils/bot-detector';
import { getGeoLocation } from '../utils/geo-location';
import { parseUserAgent } from '../utils/user-agent-parser';

export class AnalyticsSessionService {
  private repository: Repository<AnalyticsSession>;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minut

  constructor() {
    this.repository = AppDataSource.getRepository(AnalyticsSession);
  }

  async startSession(data: {
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    url: string;
  }) {
    // Pomijaj boty i narzędzia adminów
    if (data.userAgent.includes('Bearer')) {
      return null;
    }

    // Dodaj wykluczenie dla znanego user-agenta admina
    if (
      data.userAgent.includes('Mozilla/5.0') &&
      data.ipAddress === 'TWOJE_IP'
    ) {
      console.log('⏭️ Pomijam sesję admina');
      return null;
    }

    const isBot = detectBot(data.userAgent);
    if (isBot) {
      return null;
    }

    const { browserName, browserVersion, osName, osVersion, deviceType } =
      parseUserAgent(data.userAgent);

    const geoLocation = await getGeoLocation(data.ipAddress);
    const trafficSource = this.determineTrafficSource(data.referrer, data.url);

    const sessionData = {
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referringUrl: data.referrer,
      url: data.url,
      trafficSource,
      browserName,
      browserVersion,
      osName,
      osVersion,
      deviceType,
      geoLocation: {
        country: geoLocation.country || undefined,
        city: geoLocation.city || undefined,
        region: geoLocation.region || undefined,
      },
      isBot: false,
      pageViews: 1,
      events: [
        {
          eventType: 'session_start',
          timestamp: new Date(),
          url: data.url,
          data: {},
        },
      ],
    } as unknown as DeepPartial<AnalyticsSession>;

    try {
      const session = this.repository.create(sessionData);
      const savedSession = await this.repository.save(session);
      return savedSession;
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania sesji:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, eventData: any) {
    const session = await this.repository.findOne({
      where: { sessionId },
    });

    if (!session) return null;

    // Sprawdzamy timeout
    const lastActivity = new Date(session.lastActivityTime);
    if (Date.now() - lastActivity.getTime() > this.SESSION_TIMEOUT) {
      await this.endSession(sessionId);
      return await this.startSession({
        sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        url: eventData.url,
      });
    }

    session.pageViews++;
    session.events.push({
      eventType: eventData.type,
      timestamp: new Date(),
      url: eventData.url,
      data: eventData.data,
    });

    session.lastActivityTime = new Date();
    // Dodaj to:
    session.duration = this.calculateDuration(
      session.startTime,
      session.lastActivityTime
    );

    const updatedSession = await this.repository.save(session);

    return updatedSession;
  }

  private determineTrafficSource(
    referrer?: string,
    url?: string
  ): TrafficSource {
    if (url) {
      try {
        const urlObj = new URL(url);
        // Sprawdzamy różne parametry Google Ads
        const hasGclid = urlObj.searchParams.has('gclid');
        const hasGadSource = urlObj.searchParams.has('gad_source');

        if (hasGclid || hasGadSource) {
          return TrafficSource.GOOGLE_ADS;
        }
      } catch (error) {
        console.error('❌ Błąd parsowania URL:', error);
      }
    }

    if (!referrer) return TrafficSource.DIRECT;

    try {
      const referrerUrl = new URL(referrer);
      const searchEngines = {
        google: ['google.com', 'google.pl'],
        bing: ['bing.com'],
        duckduckgo: ['duckduckgo.com'],
        yahoo: ['yahoo.com'],
      };

      const socialPlatforms = {
        facebook: ['facebook.com', 'fb.com'],
        instagram: ['instagram.com'],
        linkedin: ['linkedin.com'],
        twitter: ['twitter.com', 'x.com'],
      };

      // Sprawdzanie czy to wyszukiwarka
      for (const [engine, domains] of Object.entries(searchEngines)) {
        if (domains.some((domain) => referrerUrl.hostname.includes(domain))) {
          return TrafficSource.SEARCH_ENGINE;
        }
      }

      // Sprawdzanie czy to social media
      for (const [platform, domains] of Object.entries(socialPlatforms)) {
        if (domains.some((domain) => referrerUrl.hostname.includes(domain))) {
          return TrafficSource.SOCIAL;
        }
      }

      return TrafficSource.REFERRAL;
    } catch (error) {
      console.error('❌ Błąd parsowania referrera:', error);
      return TrafficSource.DIRECT;
    }
  }

  async endSession(sessionId: string) {
    const session = await this.repository.findOne({
      where: { sessionId },
    });

    if (!session) return null;

    session.endTime = new Date();
    session.duration = this.calculateDuration(
      session.startTime,
      session.endTime
    );

    return await this.repository.save(session);
  }

  private calculateDuration(start: Date, end: Date): number {
    if (!start || !end) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  async getSession(sessionId: string) {
    return await this.repository.findOne({
      where: { sessionId },
    });
  }
}

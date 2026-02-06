// backend/src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsSessionService } from '../services/analytics-session.service';

export class AnalyticsController {
  private service: AnalyticsService;
  private sessionService: AnalyticsSessionService;

  constructor() {
    this.service = new AnalyticsService();
    this.sessionService = new AnalyticsSessionService();

    this.trackEvent = this.trackEvent.bind(this);
    this.startSession = this.startSession.bind(this);
    this.endSession = this.endSession.bind(this);
  }

  async trackEvent(req: Request, res: Response) {
    try {
      // Sprawdzamy czy jest token w headerze
      const authHeader = req.headers.authorization;
      if (authHeader) {
        res.json({
          success: true,
          data: null,
        });
        return; // Bez zwracania wartości!
      }

      const ipAddress = req.ip || '127.0.0.1';

      // Sprawdź czy istnieje sesja
      const existingSession = await this.sessionService.getSession(
        req.body.sessionId
      );

      // Jeśli nie ma sesji, utwórz nową
      if (!existingSession) {
        try {
          await this.sessionService.startSession({
            sessionId: req.body.sessionId,
            ipAddress: ipAddress,
            userAgent: req.body.data.userAgent,
            referrer: req.body.data.referrer,
            url: req.body.data.url,
          });
        } catch (error) {
          console.error('❌ Błąd podczas tworzenia sesji:', error);
          throw error;
        }
      }

      const event = await this.service.trackEvent({
        ...req.body,
        ipAddress: ipAddress,
        sessionId: req.body.sessionId || req.sessionID,
      });

      // Dodajemy aktualizację sesji
      await this.sessionService.updateSession(req.body.sessionId, {
        type: req.body.eventType,
        url: req.body.data.url,
        data: req.body.data,
      });

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      console.error('❌ Błąd w trackEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas zapisywania zdarzenia',
      });
    }
  }

  async startSession(req: Request, res: Response) {
    try {
      const session = await this.sessionService.startSession({
        ...req.body,
        ipAddress: req.ip || '127.0.0.1', // Dodajemy wartość domyślną
      });
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd podczas rozpoczynania sesji',
      });
    }
  }

  async endSession(req: Request, res: Response) {
    try {
      const session = await this.sessionService.endSession(req.body.sessionId);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd podczas kończenia sesji',
      });
    }
  }
}

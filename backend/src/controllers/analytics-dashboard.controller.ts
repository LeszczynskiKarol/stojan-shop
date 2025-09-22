// backend/src/controllers/analytics-dashboard.controller.ts
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsDashboardController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
    // Bindujemy metody
    this.getDashboardStats = this.getDashboardStats.bind(this);
    this.getSessions = this.getSessions.bind(this);
  }

  public async getDashboardStats(req: Request, res: Response) {
    try {
      const [overallStats, trafficStats, funnel, sessionsData] =
        await Promise.all([
          this.service.getOverallStats(),
          this.service.getDetailedTrafficStats(),
          this.service.getConversionFunnel(),
          this.service.getDetailedSessions(1, 100),
        ]);

      res.json({
        success: true,
        data: {
          overall: overallStats,
          trafficSources: trafficStats,
          funnel,
          sessions: sessionsData.sessions,
        },
      });
    } catch (error) {
      console.error('❌ Błąd w getDashboardStats:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania statystyk',
      });
    }
  }

  public async getSessions(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const data = await this.service.getDetailedSessions(page, perPage);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('❌ Błąd w getSessions:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania sesji',
      });
    }
  }
}

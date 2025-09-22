// backend/src/routes/analytics.routes.ts
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsDashboardController } from '../controllers/analytics-dashboard.controller';

const router = Router();
const controller = new AnalyticsController();
const dashboardController = new AnalyticsDashboardController();

// Wracamy do poprzedniego sposobu
router.post('/track', controller.trackEvent);
router.post('/session/start', controller.startSession);
router.post('/session/end', controller.endSession);

router.get('/dashboard', dashboardController.getDashboardStats);
router.get('/sessions', dashboardController.getSessions);

export default router;

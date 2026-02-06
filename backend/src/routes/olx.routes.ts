// backend/src/routes/olx.routes.ts
import { Router } from 'express';
import { OlxController } from '../controllers/olx.controller';

const router = Router();
const olxController = new OlxController();

// DODAJ MIDDLEWARE DEBUGUJĄCY
router.use((req, res, next) => {
  console.log('🔍 OLX Route:', req.method, req.path);
  console.log('🔍 Headers:', req.headers.authorization);
  next();
});

// BEZ AUTH - usuń całkowicie middleware auth()
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'OLX routes działają!' });
});

router.get('/auth', (req, res, next) => {
  console.log('📍 GET /auth wywołane');
  olxController.getAuthUrl(req, res, next);
});

router.get('/auth/callback', olxController.handleCallback);

router.get('/auth/status', (req, res, next) => {
  console.log('📍 GET /auth/status wywołane');
  olxController.checkAuthStatus(req, res, next);
});

router.get('/adverts', olxController.getUserAdverts);
router.post('/adverts/import', olxController.importAllAdverts);
router.patch('/adverts/:id', olxController.updateAdvert);
router.post('/adverts/:id/extend', olxController.extendAdvert);
router.get('/categories', olxController.getCategories);
router.get('/categories/motors', olxController.findMotorCategories);

export default router;

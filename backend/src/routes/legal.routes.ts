// backend/src/routes/legal.routes.ts
import { Router } from 'express';
import { LegalController } from '../controllers/legal.controller';

const router = Router();
const legalController = new LegalController();

// Podstawowe operacje CRUD
router.get('/by-slug/:slug', legalController.getBySlug);
router.get('/', legalController.getAll);
router.post('/', legalController.create);
router.put('/:id', legalController.update);
router.delete('/:id', legalController.delete);

export default router;

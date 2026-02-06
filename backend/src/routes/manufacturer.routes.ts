// backend/src/routes/manufacturer.routes.ts
import { Router } from 'express';
import { ManufacturerController } from '../controllers/manufacturer.controller';

const router = Router();
const manufacturerController = new ManufacturerController();

router.get('/by-slug/:slug', manufacturerController.getBySlug);
router.get('/:id', manufacturerController.getById);
router.get('/', manufacturerController.getAll);
router.post('/', manufacturerController.create);
router.put('/:id', manufacturerController.update);
router.delete('/:id', manufacturerController.delete);

export default router;

// backend/src/routes/blog.routes.ts
import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';

const router = Router();
const blogController = new BlogController();

// Kolejność ma znaczenie! Bardziej specyficzne routy powinny być PRZED ogólnymi
router.get('/wordpress-data', blogController.fetchWordPressData);
router.post('/import', blogController.importFromWordPress);
router.get('/by-slug/:slug', blogController.getBySlug);
router.get('/', blogController.getAll);
router.post('/', blogController.create);

// NOWA ROUTE - Pobieranie po ID (UUID)
// Musi być PRZED :slug, aby nie była przechwytywana przez getBySlug
router.get('/:id', blogController.getById);

router.put('/:id', blogController.update);
router.delete('/:id', blogController.delete);

export default router;

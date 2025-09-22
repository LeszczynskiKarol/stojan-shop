// backend/src/routes/blog.routes.ts
import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';

const router = Router();
const blogController = new BlogController();

router.get('/by-slug/:slug', blogController.getBySlug);
router.get('/', blogController.getAll);
router.post('/', blogController.create);
router.put('/:id', blogController.update);
router.delete('/:id', blogController.delete);
router.post('/import', blogController.importFromWordPress);
router.get('/wordpress-data', blogController.fetchWordPressData);

export default router;

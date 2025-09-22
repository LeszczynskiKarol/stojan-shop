// backend/src/routes/allegroProducts.routes.ts
import { Router } from 'express';
import { AllegroProductsController } from '../controllers/allegroProducts.controller';

const router = Router();
const allegroProductsController = new AllegroProductsController();

// Te ścieżki są już pod /allegroProducts!
router.post('/import/:productId', allegroProductsController.importProduct);
router.get(
  '/product-allegro-link/:productId',
  allegroProductsController.getProductAllegroLink
);
router.patch(
  '/:productId/status',
  allegroProductsController.updateProductStatus.bind(allegroProductsController)
);
router.patch('/:productId/price', allegroProductsController.updateProductPrice);
router.patch('/:productId/stock', allegroProductsController.updateProductStock);
router.get('/search', allegroProductsController.search);
router.get('/admin/search', allegroProductsController.search);
router.get('/admin', allegroProductsController.getAllAllegroProducts);
router.get('/matches', allegroProductsController.getMatches);

export default router;

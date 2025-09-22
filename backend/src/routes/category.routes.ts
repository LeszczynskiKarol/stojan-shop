// backend/src/routes/category.routes.ts
import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const categoryController = new CategoryController();
const productController = new ProductController();

// Endpointy związane z parametrami kategorii
router.get('/:categoryId/ranges', categoryController.getCategoryRanges);
router.get('/:categoryId/rpm-values', productController.getAvailableRpmValues);
router.get(
  '/:categoryId/manufacturers',
  productController.getManufacturersForCategory
);
router.get(
  '/:categoryId/product-types',
  productController.getProductTypesForCategory
);

// Podstawowe operacje CRUD na kategoriach
router.get('/by-slug/:slug', categoryController.getBySlug);
router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);
router.get('/:id', categoryController.getById);

export default router;

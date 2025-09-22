// backend/src/routes/product.routes.ts
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validateProductInput } from '../middlewares/validation.middleware';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = Router();
const productController = new ProductController();

// Najpierw routy statyczne i specyficzne
router.get('/admin', productController.getProductsForAdmin);
router.post('/check-stock', productController.checkStock);
router.put('/admin/:id', validateProductInput, productController.updateProduct);

router.get('/search', productController.search);
router.get('/search/suggestions', productController.getSearchSuggestions);

// Pozostałe routy specjalne
router.get('/latest', productController.getLatestProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/google-merchant-feed', productController.getGoogleMerchantFeed);
router.get('/ranges', productController.getRanges);
router.get('/manufacturers', productController.getManufacturers);
router.post('/import-woo', productController.importFromWooCommerce);
router.get('/import-woo/preview', productController.previewWooCommerce);
router.get('/reservations/events', productController.handleReservationEvents);
router.get('/by-category/:categoryId', productController.getByCategoryId);
router.get('/by-slug/:slug(*)', productController.getProductBySlug);
router.post('/bulk-price-preview', productController.bulkPricePreview);
router.post('/bulk-price-update', productController.bulkPriceUpdate);

// CRUD operacje
router.get('/', productController.getAllProducts);
router.post('/', validateProductInput, productController.createProduct);
router.get('/:id/similar', productController.getSimilarProducts);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);

// Operacje na kategoriach
router.post(
  '/:productId/categories/:categoryId',
  productController.addToCategory
);
router.delete(
  '/:productId/categories/:categoryId',
  productController.removeFromCategory
);

// Operacje na marketplace i obrazach
router.patch(
  '/:id/marketplace/:marketplace',
  productController.updateMarketplace
);
router.post(
  '/:id/images',
  upload.array('images', 10),
  productController.uploadImages
);

// Rezerwacje
router.post('/:id/reserve', productController.reserveProduct);
router.post('/:id/cancel-reservation', productController.cancelReservation);
router.get(
  '/:productId/validate-reservation/:reservationId',
  productController.validateReservation
);

export default router;

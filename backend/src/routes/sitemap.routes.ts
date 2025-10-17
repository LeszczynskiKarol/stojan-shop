// backend/src/routes/sitemap.routes.ts
import { Router } from 'express';
import { SitemapController } from '../controllers/sitemap.controller';

const router = Router();
const sitemapController = new SitemapController();

// Główny sitemap index (ten czyta Google)
router.get('/sitemap_index.xml', sitemapController.getSitemapIndex);

// Sub-sitemaps
router.get('/sitemap-categories.xml', sitemapController.getCategoriesSitemap);
router.get('/sitemap-products.xml', sitemapController.getProductsSitemap);
router.get('/sitemap-legal.xml', sitemapController.getLegalSitemap);
router.get(
  '/sitemap-manufacturers.xml',
  sitemapController.getManufacturersSitemap
);
router.get('/sitemap-static.xml', sitemapController.getStaticSitemap);

// Legacy endpoints (dla kompatybilności wstecznej)
router.get('/xml', sitemapController.getSitemap);
router.get('/', sitemapController.getSitemap);

export default router;

// backend/src/routes/sitemap.routes.ts
import { Router } from 'express';
import { SitemapController } from '../controllers/sitemap.controller';

const router = Router();
const sitemapController = new SitemapController();

router.get('/xml', sitemapController.getSitemap);
router.get('/', sitemapController.getSitemap);

export default router;

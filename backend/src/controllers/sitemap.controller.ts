// backend/src/controllers/sitemap.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { LegalPage } from '../entities/LegalPage';

export class SitemapController {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);
  private legalRepository = AppDataSource.getRepository(LegalPage);

  getSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const [products, categories, legalPages] = await Promise.all([
        this.productRepository.find({
          select: ['marketplaces', 'updatedAt'],
          relations: ['categories'],
        }),
        this.categoryRepository.find({
          select: ['slug', 'updatedAt'],
        }),
        this.legalRepository.find({
          select: ['slug', 'updated_at'],
        }),
      ]);

      const sitemap = {
        products: products.map((p) => ({
          url: `/${p.categories[0]?.slug}/${p.marketplaces.ownStore?.slug}`,
          lastmod: p.updatedAt.toISOString(),
        })),
        categories: categories.map((c) => ({
          url: `/${c.slug}`,
          lastmod: c.updatedAt.toISOString(),
        })),
        legal: legalPages.map((l) => ({
          url: `/legal/${l.slug}`,
          lastmod: l.updated_at.toISOString(),
        })),
      };

      if (req.path === '/xml') {
        const baseUrl = 'https://www.silniki-elektryczne.com.pl.pl';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Strona główna
        xml += `  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

        // Kategorie
        sitemap.categories.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });

        // Produkty
        sitemap.products.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        });

        // Strony prawne
        sitemap.legal.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
        return;
      }

      res.json({
        success: true,
        data: sitemap,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd serwera',
      });
    }
  };
}

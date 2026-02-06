// backend/src/controllers/sitemap.controller.ts
// WERSJA 2: Produkty ze stock = 0 RÓWNIEŻ w sitemap (jeśli mają własny adres)

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { LegalPage } from '../entities/LegalPage';
import { Manufacturer } from '../entities/Manufacturer';

export class SitemapController {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);
  private legalRepository = AppDataSource.getRepository(LegalPage);
  private manufacturerRepository = AppDataSource.getRepository(Manufacturer);

  private baseUrl = 'https://www.silniki-elektryczne.com.pl';

  // SITEMAP INDEX - główny plik sitemap
  getSitemapIndex = async (req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date().toISOString();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml +=
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      xml += `  <sitemap>
    <loc>${this.baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

      xml += `  <sitemap>
    <loc>${this.baseUrl}/sitemap-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

      xml += `  <sitemap>
    <loc>${this.baseUrl}/sitemap-legal.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

      xml += `  <sitemap>
    <loc>${this.baseUrl}/sitemap-manufacturers.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

      xml += `  <sitemap>
    <loc>${this.baseUrl}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;

      xml += '</sitemapindex>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap index:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // SITEMAP DLA KATEGORII
  getCategoriesSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.slug IS NOT NULL')
        .andWhere("category.slug != ''")
        .select(['category.slug', 'category.updatedAt'])
        .getMany();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      categories.forEach((category) => {
        if (category.slug) {
          xml += `  <url>
    <loc>${this.baseUrl}/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        }
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap kategorii:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // SITEMAP DLA PRODUKTÓW
  // ✅ ZMIENIONE: Zawiera WSZYSTKIE produkty z własnym adresem (również stock = 0)
  getProductsSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      // POBIERAMY WSZYSTKIE PRODUKTY (bez filtra stock)
      // Filtrujemy tylko po tym czy mają kategorię i slug w ownStore
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        // ❌ USUNIĘTE: .where('product.stock > :stock', { stock: 0 })
        // ✅ Zamiast tego: sprawdzamy czy produkt ma dane w marketplaces.ownStore
        .select([
          'product.id',
          'product.marketplaces',
          'product.updatedAt',
          'product.stock', // Dodane dla potencjalnego użycia w przyszłości
          'category.slug',
        ])
        .getMany();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
      xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

      // Filtrujemy w JavaScript: tylko produkty z kategorią i własnym adresem
      const validProducts = products.filter((product) => {
        const categorySlug = product.categories?.[0]?.slug;
        const productSlug = product.marketplaces?.ownStore?.slug;
        const isActive = product.marketplaces?.ownStore?.active !== false;

        // Warunek: musi mieć kategorię, slug i być aktywny w własnym sklepie
        return categorySlug && productSlug && isActive;
      });

      console.log(
        `📊 Sitemap produktów: ${validProducts.length}/${products.length} produktów`
      );

      validProducts.forEach((product) => {
        const categorySlug = product.categories[0].slug;
        const productSlug = product.marketplaces.ownStore!.slug;

        // OPCJONALNIE: Można dodać priorytet w zależności od stock
        const priority = product.stock > 0 ? '0.9' : '0.7';
        const changefreq = product.stock > 0 ? 'daily' : 'weekly';

        xml += `  <url>
    <loc>${this.baseUrl}/${categorySlug}/${productSlug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap produktów:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // SITEMAP DLA STRON PRAWNYCH
  getLegalSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const legalPages = await this.legalRepository.find({
        select: ['slug', 'updated_at'],
      });

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      legalPages.forEach((page) => {
        xml += `  <url>
    <loc>${this.baseUrl}/legal/${page.slug}</loc>
    <lastmod>${page.updated_at.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap stron prawnych:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // SITEMAP DLA PRODUCENTÓW
  getManufacturersSitemap = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const manufacturers = await this.manufacturerRepository
        .createQueryBuilder('manufacturer')
        .where('manufacturer.slug IS NOT NULL')
        .andWhere("manufacturer.slug != ''")
        .select(['manufacturer.slug', 'manufacturer.updatedAt'])
        .getMany();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      manufacturers.forEach((manufacturer) => {
        if (manufacturer.slug) {
          xml += `  <url>
    <loc>${this.baseUrl}/producent/${manufacturer.slug}</loc>
    <lastmod>${manufacturer.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        }
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap producentów:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // SITEMAP DLA STRON STATYCZNYCH
  getStaticSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/o-nas', priority: '0.8', changefreq: 'monthly' },
        { url: '/kontakt', priority: '0.8', changefreq: 'monthly' },
        { url: '/szukaj', priority: '0.6', changefreq: 'daily' },
      ];

      const now = new Date().toISOString();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      staticPages.forEach((page) => {
        xml += `  <url>
    <loc>${this.baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
      });

      xml += '</urlset>';

      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.send(xml);
    } catch (error) {
      console.error('Błąd generowania sitemap stron statycznych:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  // LEGACY - dla kompatybilności wstecznej
  getSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const [products, categories, legalPages] = await Promise.all([
        this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.categories', 'category')
          // ✅ USUNIĘTE: filtr stock > 0
          .select([
            'product.id',
            'product.marketplaces',
            'product.updatedAt',
            'product.stock',
            'category.slug',
          ])
          .getMany(),
        this.categoryRepository
          .createQueryBuilder('category')
          .where('category.slug IS NOT NULL')
          .select(['category.slug', 'category.updatedAt'])
          .getMany(),
        this.legalRepository.find({
          select: ['slug', 'updated_at'],
        }),
      ]);

      const sitemap = {
        products: products
          .filter(
            (p) =>
              p.categories?.[0]?.slug &&
              p.marketplaces?.ownStore?.slug &&
              p.marketplaces?.ownStore?.active !== false
          )
          .map((p) => ({
            url: `/${p.categories[0].slug}/${p.marketplaces.ownStore!.slug}`,
            lastmod: p.updatedAt.toISOString(),
          })),
        categories: categories
          .filter((c) => c.slug)
          .map((c) => ({
            url: `/${c.slug}`,
            lastmod: c.updatedAt.toISOString(),
          })),
        legal: legalPages.map((l) => ({
          url: `/legal/${l.slug}`,
          lastmod: l.updated_at.toISOString(),
        })),
      };

      if (req.path.includes('/xml')) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Strona główna
        xml += `  <url>
    <loc>${this.baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

        // Kategorie
        sitemap.categories.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${this.baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });

        // Produkty
        sitemap.products.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${this.baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        });

        // Strony prawne
        sitemap.legal.forEach(({ url, lastmod }) => {
          xml += `  <url>
    <loc>${this.baseUrl}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
        });

        xml += '</urlset>';

        res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
        res.setHeader('X-Robots-Tag', 'noindex');
        res.send(xml);
        return;
      }

      res.json({
        success: true,
        data: sitemap,
      });
    } catch (error) {
      console.error('Błąd generowania sitemap:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd serwera',
      });
    }
  };
}

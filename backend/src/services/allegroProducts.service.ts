// backend/src/services/allegroProducts.service.ts
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';

interface SearchParams {
  page: number;
  limit: number;
  phrase?: string;
  condition?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortDirection: 'ASC' | 'DESC';
}

export class AllegroProductsService {
  public async search({
    page,
    limit,
    phrase,
    condition,
    status,
    priceMin,
    priceMax,
    sortBy,
    sortDirection,
  }: SearchParams) {
    const queryBuilder = AppDataSource.getRepository(Product)
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.matched_store_product',
        'product.marketplaces',
        'product.manufacturer',
        'product.power',
        'product.rpm',
        'product.condition',
        'product.stock',
        'product.mainImage',
        'product.galleryImages',
        'product.images',
      ])
      .where("product.marketplaces->'allegro' IS NOT NULL")
      .andWhere("product.marketplaces->'allegro'->>'productId' IS NOT NULL");

    if (phrase) {
      queryBuilder.andWhere(
        "(product.name ILIKE :phrase OR product.manufacturer ILIKE :phrase OR product.marketplaces->'allegro'->>'description' ILIKE :phrase)",
        { phrase: `%${phrase}%` }
      );
    }

    if (condition) {
      queryBuilder.andWhere('product.condition = :condition', { condition });
    }

    if (status) {
      const isActive = status === 'active';
      queryBuilder.andWhere(
        "(product.marketplaces->'allegro'->>'active')::boolean = :isActive",
        { isActive }
      );
    }

    if (priceMin) {
      queryBuilder.andWhere(
        "(product.marketplaces->'allegro'->>'price')::numeric >= :priceMin",
        { priceMin }
      );
    }

    if (priceMax) {
      queryBuilder.andWhere(
        "(product.marketplaces->'allegro'->>'price')::numeric <= :priceMax",
        { priceMax }
      );
    }

    // Sortowanie
    if (sortBy) {
      let sortExpression = `product.${sortBy}`;
      if (sortBy === 'price') {
        sortExpression = "(product.marketplaces->'allegro'->>'price')::numeric";
      }
      queryBuilder.orderBy(sortExpression, sortDirection);
    }

    // Paginacja
    const [products, total] = await queryBuilder
      .skip(page * limit)
      .take(limit)
      .getManyAndCount();

    const offers = products.map((product) => {
      return {
        ...product,
        id: product.id,
      };
    });

    return {
      offers,
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      source: 'database',
    };
  }

  private normalizeProductName(nazwa: string): string {
    return (
      nazwa
        .toLowerCase()
        .replace(/[()]/g, ' ')
        .replace(/(\d+)[,\.](\d+)(?=\s*kw)/g, '$1.$2')
        .replace(/\(u\)|\(używany\)|\(nowy\)|\(nieużywany\)/gi, '')
        .replace(/silnik elektryczny/gi, 'silnik elektryczny 3fazowy')
        .replace(/(\d-?fazowy|\dfazowy|jednofazowy|trójfazowy)/gi, '')
        .replace(/kilowat|kw/gi, 'kw')
        .replace(/obr\/min|rpm|obrotów/gi, 'obr')
        .replace(/\s*kw\b/gi, 'kw')
        .replace(/\s*obr\.?\b/gi, 'obr')
        //.replace(/\s+(ms|omt)$/gi, '')
        .replace(/[\s,.]+/g, ' ')
        .trim()
    );
  }

  public async getMatchingProducts() {
    // Debugowanie
    let totalProducts = 0;
    let matches = 0;
    let noMatches = 0;

    const allegroProducts = await AppDataSource.getRepository(Product)
      .createQueryBuilder('product')
      .where("product.marketplaces->'allegro' IS NOT NULL")
      .andWhere("product.marketplaces->'allegro'->>'productId' IS NOT NULL")
      .select(['product.id', 'product.name', 'product.marketplaces'])
      .getMany();

    const ownStoreProducts = await AppDataSource.getRepository(Product)
      .createQueryBuilder('product')
      .where("product.marketplaces->'ownStore'->>'active' = :active", {
        active: 'true',
      })
      .select(['product.id', 'product.name', 'product.marketplaces'])
      .getMany();
    const unmatched = [];

    for (const allegroProduct of allegroProducts) {
      totalProducts++;
      const allegroName = this.normalizeProductName(allegroProduct.name);
      let found = false;

      for (const storeProduct of ownStoreProducts) {
        const storeName = this.normalizeProductName(storeProduct.name);

        if (allegroName === storeName) {
          // Aktualizuj produkt Allegro
          await AppDataSource.getRepository(Product).update(allegroProduct.id, {
            matched_store_product: {
              store_product_id: storeProduct.id,
              store_product_name: storeProduct.name,
              matched_at: new Date(),
            },
          });

          // DODANE: Aktualizuj również produkt sklepowy
          await AppDataSource.getRepository(Product).update(storeProduct.id, {
            matched_store_product: {
              store_product_id: allegroProduct.id,
              store_product_name: allegroProduct.name,
              matched_at: new Date(),
            },
          });

          matches++;
          found = true;
          break;
        }
      }

      if (!found) {
        unmatched.push({
          id: allegroProduct.id,
          name: allegroProduct.name,
          normalizedName: allegroName,
        });
        noMatches++;
      }
    }

    console.log('\n=== PODSUMOWANIE ===');
    console.log(`Przeanalizowano ${totalProducts} produktów`);
    console.log(`Znaleziono ${matches} dopasowań`);
    console.log(`Nie znaleziono dopasowania dla ${noMatches} produktów\n`);

    console.log('\n=== PRODUKTY BEZ DOPASOWANIA ===');
    unmatched.forEach((product) => {
      console.log(`ID: ${product.id}`);
      console.log(`Nazwa oryginalna: ${product.name}`);
      console.log(`Nazwa znormalizowana: ${product.normalizedName}`);
      console.log('---');
    });

    return await AppDataSource.getRepository(Product)
      .createQueryBuilder('product')
      .where('product.matched_store_product IS NOT NULL')
      .getMany();
  }
}

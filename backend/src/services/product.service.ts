// backend/src/services/product.service.ts
import { Repository, MoreThan, IsNull, Not } from 'typeorm';
import { uploadToS3 } from '../utils/s3Client';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Order } from '../entities/Order';
import { ApiError } from '../utils/apiError';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { Manufacturer } from '../entities/Manufacturer';
import { EventEmitter } from 'events';

const categoryNameVariants: { [key: string]: string[] } = {
  'Silniki trójfazowe': ['Trójfazowe', 'Trojfazowe'],
  'Silniki jednofazowe': ['Jednofazowe'],
  'Silniki z hamulcem': ['Z hamulcem'],
  'Silniki dwubiegowe': ['Dwubiegowe'],
  'Wentylatory przemysłowe': ['Wentylatory'],
  Motoreduktory: ['Motoreduktory'],
  Akcesoria: ['Akcesoria'],
  'Silniki elektryczne': ['Silniki elektryczne'],
};

interface PreviewCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  image: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
}

interface PreviewProduct extends Omit<Product, 'categories'> {
  categories?: PreviewCategory[];
}

interface WooCommerceApiResponse {
  success: boolean;
  error?: string;
  data: {
    ID: number;
    post_title: string;
    post_content: string;
    description: string;
    price: string | null;
    stock: string | null;
    power: string | null;
    rpm: string | null;
    image_url?: string;
    gallery_images?: string[];
    slug: string;
    raw_categories: string;
    categories: string;
    category: {
      name: string;
      slug: string;
    };
    condition?: 'nowy' | 'uzywany';
    manufacturer?: string;
    shaftDiameter?: number;
    mechanicalSize?: number;
    weight?: number;
    flangeSize?: number;
  }[];
}

interface WooCommerceResponse {
  success: boolean;
  error?: string;
  data?: WooProduct[];
}

interface WooProduct {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string | null;
  description: string;
  price: string | null;
  sku: string | null;
  stock: string | null;
  thumbnail_id: string | null;
  image_url?: string;
  gallery_images?: string[];
  slug: string;
  categories: string | null;
  power?: string;
  rpm?: string;
}

interface ProductFilters {
  powerMin?: number;
  powerMax?: number;
  search?: string;
  rpmMin?: number;
  rpmMax?: number;
  shaftDiameterMin?: number;
  shaftDiameterMax?: number;
  sleeveDiameterMin?: number;
  sleeveDiameterMax?: number;
  mechanicalSizeMin?: number;
  mechanicalSizeMax?: number;
  manufacturer?: string;
  condition?: 'nowy' | 'uzywany' | 'nieuzywany';
  inStock?: boolean;
  categoryId?: string;
  categorySlug?: string; // DODAJ TO
  sort?: string;
  skipPagination?: boolean;
  productType?: string[];
}

interface PaginationOptions {
  page: number;
  limit: number;
}

class ProductEventEmitter extends EventEmitter {}
const productEvents = new ProductEventEmitter();

export class ProductService {
  private popularProductsCache: {
    products: Product[];
    lastUpdate: Date;
  } | null = null;
  private eventEmitter: ProductEventEmitter;
  private reservationsStore: Map<
    string,
    {
      productId: string;
      quantity: number;
      expiresAt: number;
      isActive: boolean;
    }
  >;

  private repository: Repository<Product>;
  private productRepository: Repository<Product>;
  private categoryRepository: Repository<Category>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.productRepository = this.repository;
    this.eventEmitter = productEvents;
    this.reservationsStore = new Map();
    setInterval(() => {
      for (const [id, reservation] of this.reservationsStore) {
        if (!reservation.isActive || Date.now() > reservation.expiresAt) {
          this.reservationsStore.delete(id);
        }
      }
    }, 60000);
  }

  async updateMarketplace(
    id: string,
    marketplace: 'allegro' | 'olx' | 'ownStore',
    data: any
  ): Promise<Product> {
    const product = await this.getProductById(id);
    if (!product.marketplaces) {
      product.marketplaces = {};
    }
    product.marketplaces[marketplace] = {
      ...product.marketplaces[marketplace],
      ...data,
    };
    return await this.repository.save(product);
  }

  async syncOwnStoreStock() {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Aktualizujemy stan w ownStore na podstawie głównego stanu produktu
      await queryRunner.manager
        .createQueryBuilder()
        .update(Product)
        .set({
          marketplaces: () => `
            jsonb_set(
              marketplaces, 
              '{ownStore,stock}',
              CAST(stock AS text)::jsonb
            )
          `,
        })
        .where("marketplaces->>'ownStore' IS NOT NULL")
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByAllegroOfferId(allegroOfferId: string): Promise<Product | null> {
    console.log(`🔍 Szukam produktu z Allegro o ID: ${allegroOfferId}`);

    const query = this.repository
      .createQueryBuilder('product')
      .where(
        "product.marketplaces->'allegro'->>'productId' = :allegroOfferId",
        { allegroOfferId }
      );

    console.log('🔍 Parametry:', query.getParameters());

    const product = await query.getOne();
    console.log(
      '🔍 Wynik wyszukiwania:',
      product
        ? `Znaleziono produkt ID: ${product.id}`
        : 'Nie znaleziono produktu'
    );

    return product;
  }

  async setStock(productId: string, newStock: number) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .update(Product)
        .set({ stock: newStock })
        .where('id = :productId', { productId })
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProduct(
    id: string,
    updateData: Partial<Product>
  ): Promise<Product> {
    const product = await this.getProductById(id);

    if (updateData.customParameters) {
      updateData.customParameters = updateData.customParameters.filter(
        (param) => param.name && param.value
      );
    }

    if (updateData.marketplaces?.ownStore?.slug) {
      updateData.marketplaces.ownStore.slug = this.generateSlug(
        updateData.marketplaces.ownStore.slug
      );
    }

    Object.assign(product, updateData);

    try {
      const savedProduct = await this.repository.save(product);
      return savedProduct;
    } catch (error) {
      console.error('Błąd podczas zapisu produktu:', error);
      throw new ApiError(500, 'Błąd podczas aktualizacji produktu');
    }
  }

  async updateStock(productId: string, change: number) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Atomowa aktualizacja z warunkiem
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Product)
        .set({
          stock: () => `GREATEST(stock + ${change}, 0)`, // Zapewnia wartość nieujemną
        })
        .where('id = :productId', { productId })
        .execute();

      // 2. Sprawdzenie czy aktualizacja się powiodła
      if (result.affected === 0) {
        throw new ApiError(404, `Produkt nie znaleziony: ${productId}`);
      }

      // 3. Pobranie zaktualizowanego produktu
      const updatedProduct = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
      });

      await queryRunner.commitTransaction();
      return updatedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    if (productData.customParameters) {
      productData.customParameters = productData.customParameters.filter(
        (param) => param.name && param.value
      );
    }

    if (typeof productData.legSpacing === 'string') {
      if (productData.legSpacing === '') {
        productData.legSpacing = undefined;
      } else if (!productData.legSpacing.includes('x')) {
        // Jeśli brakuje formatu "x", dodaj go
        productData.legSpacing = `${productData.legSpacing} x ${productData.legSpacing}`;
      }
      // Pozostaw jako string
    }

    if (typeof productData.hasBreak === 'string') {
      productData.hasBreak = productData.hasBreak === 'on';
    }
    if (typeof productData.hasForeignCooling === 'string') {
      productData.hasForeignCooling = productData.hasForeignCooling === 'on';
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = this.repository.create(productData);

      if (product.marketplaces?.ownStore) {
        product.marketplaces.ownStore.slug = this.generateSlug(product.name);
      }

      if (productData.categories && Array.isArray(productData.categories)) {
        const categoryRepo = AppDataSource.getTreeRepository(Category);

        const categories = await Promise.all(
          productData.categories.map(async (cat) => {
            const category = await categoryRepo.findOne({
              where: { slug: cat.id || cat.slug }, // obsłuż oba przypadki
            });

            if (!category) {
              console.warn(
                `Kategoria ${cat.id || cat.slug} nie została znaleziona`
              );
              return null;
            }
            return category;
          })
        );

        product.categories = categories.filter((cat) => cat !== null);
      }

      const savedProduct = await queryRunner.manager.save(Product, product);
      if (savedProduct.marketplaces?.allegro?.productId) {
        savedProduct.matched_store_product = {
          store_product_id: savedProduct.id,
          store_product_name: savedProduct.name,
          matched_at: new Date(),
        };
        await queryRunner.manager.save(Product, savedProduct);
      }

      await queryRunner.commitTransaction();

      return savedProduct;
    } catch (error) {
      console.error('ProductService.createProduct - błąd:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateSlug(name: string): string {
    const polishChars: { [key: string]: string } = {
      ą: 'a',
      ć: 'c',
      ę: 'e',
      ł: 'l',
      ń: 'n',
      ó: 'o',
      ś: 's',
      ź: 'z',
      ż: 'z',
      Ą: 'A',
      Ć: 'C',
      Ę: 'E',
      Ł: 'L',
      Ń: 'N',
      Ó: 'O',
      Ś: 'S',
      Ź: 'Z',
      Ż: 'Z',
    };

    let slug = name
      .toLowerCase()
      .replace(/,/g, '') // usuwamy przecinki
      .split('')
      .map((char) => polishChars[char] || char)
      .join('');

    slug = slug
      .replace(/\s*\/\s*/g, '-') // zamieniamy ukośnik (z opcjonalnymi spacjami) na myślnik
      .replace(/\s+/g, '-') // spacje na myślniki
      .replace(/[^a-z0-9\-]/g, '-') // inne niedozwolone znaki na myślniki
      .replace(/-+/g, '-') // wiele myślników na jeden
      .replace(/^-+/, '') // usuwanie myślników z początku
      .replace(/-+$/, ''); // usuwanie myślników z końca

    return slug;
  }

  async getProductsByCategory(categoryId: string, filters: any = {}) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      const limit = parseInt(filters.limit) || 20;
      const skip = parseInt(filters.skip) || 0;

      const queryBuilder = this.repository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        .innerJoinAndSelect('product.categories', 'typeCategory')
        .where('category.id = :categoryId', { categoryId })
        .andWhere('product.stock > 0')
        .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'")
        .andWhere("product.marketplaces->'ownStore' IS NOT NULL")
        .andWhere("product.marketplaces->'ownStore'->>'price' IS NOT NULL");

      // I analogicznie w totalQuery
      const totalQuery = this.repository
        .createQueryBuilder('product')
        .leftJoin('product.categories', 'category')
        .innerJoin('product.categories', 'typeCategory')
        .where('category.id = :categoryId', { categoryId })
        .andWhere('product.stock > 0')
        .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'")
        .andWhere("product.marketplaces->'ownStore' IS NOT NULL")
        .andWhere("product.marketplaces->'ownStore'->>'price' IS NOT NULL");

      // Dodajemy filtr dla powiązanych kategorii
      if (category?.productFilters?.specificCategories?.length) {
        queryBuilder
          .andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .select('p.id')
              .from(Product, 'p')
              .leftJoin('p.categories', 'c')
              .where('c.slug IN (:...slugs)')
              .getQuery();
            return `product.id IN ${subQuery}`;
          })
          .setParameter('slugs', category.productFilters.specificCategories);
      }

      // Filtr mocy z kategorii (jeśli istnieje)
      if (category?.productFilters?.powerRange) {
        const powerMin = parseFloat(category.productFilters.powerRange.min);
        const powerMax = parseFloat(category.productFilters.powerRange.max);

        const powerWhere = `
        CASE
          WHEN product.power->>'value' IS NULL OR product.power->>'value' = '' THEN false
          WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
            CASE
              WHEN product.power->>'value' LIKE '%/%' THEN
                COALESCE(
                  CAST(
                    NULLIF(
                      REGEXP_REPLACE(
                        SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '/', 1), 
                        '[^0-9.]', '', 'g'
                      ), 
                      ''
                    ) AS DECIMAL
                  ),
                  0
                ) = :powerMin
              WHEN product.power->>'value' LIKE '%-%' THEN
                COALESCE(
                  CAST(
                    NULLIF(
                      REGEXP_REPLACE(
                        SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1), 
                        '[^0-9.]', '', 'g'
                      ), 
                      ''
                    ) AS DECIMAL
                  ),
                  0
                ) = :powerMin
              ELSE
                COALESCE(
                  CAST(
                    NULLIF(
                      REGEXP_REPLACE(
                        REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), 
                        '[^0-9.]', '', 'g'
                      ), 
                      ''
                    ) AS DECIMAL
                  ),
                  0
                ) = :powerMin
            END
          ELSE false
        END`;

        queryBuilder.andWhere(powerWhere, { powerMin });
        totalQuery.andWhere(powerWhere, { powerMin });
      }

      // Reszta filtrów pozostaje bez zmian
      if (filters.rpmMin !== undefined && filters.rpmMax !== undefined) {
        const rpmWhere = `
        CASE
          WHEN product.rpm->>'value' ~ '[0-9]' THEN
            (
              CASE
                WHEN product.rpm->>'value' LIKE '%/%' THEN
                  (
                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g') AS DECIMAL) BETWEEN :rpmMin AND :rpmMax
                    OR
                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 2), '[^0-9.]', '', 'g') AS DECIMAL) BETWEEN :rpmMin AND :rpmMax
                  )
                WHEN product.rpm->>'value' LIKE '%-%' THEN
                  (
                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g') AS DECIMAL) BETWEEN :rpmMin AND :rpmMax
                    OR
                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 2), '[^0-9.]', '', 'g') AS DECIMAL) BETWEEN :rpmMin AND :rpmMax
                  )
                ELSE
                  CAST(REGEXP_REPLACE(REPLACE(product.rpm->>'value', ',', '.'), '[^0-9.]', '', 'g') AS DECIMAL) BETWEEN :rpmMin AND :rpmMax
              END
            )
          ELSE false
        END`;

        queryBuilder.andWhere(rpmWhere, {
          rpmMin: filters.rpmMin,
          rpmMax: filters.rpmMax,
        });
        totalQuery.andWhere(rpmWhere, {
          rpmMin: filters.rpmMin,
          rpmMax: filters.rpmMax,
        });
      }

      if (filters.productType?.length) {
        const typeCondition = 'typeCategory.slug IN (:...productTypes)';
        const typeParams = { productTypes: filters.productType };

        queryBuilder.andWhere(typeCondition, typeParams);
        totalQuery.andWhere(typeCondition, typeParams);
      }

      if (
        filters.shaftDiameterMin !== undefined &&
        filters.shaftDiameterMax !== undefined
      ) {
        const shaftWhere = `product.shaftDiameter BETWEEN :shaftMin AND :shaftMax`;
        queryBuilder.andWhere(shaftWhere, {
          shaftMin: filters.shaftDiameterMin,
          shaftMax: filters.shaftDiameterMax,
        });
        totalQuery.andWhere(shaftWhere, {
          shaftMin: filters.shaftDiameterMin,
          shaftMax: filters.shaftDiameterMax,
        });
      }

      // Pobierz total przed sortowaniem
      const total = await totalQuery.getCount();

      // Sortowanie
      // Sortowanie
      switch (filters.sort) {
        case 'price_asc':
          queryBuilder
            .addSelect(
              `COALESCE(
          CAST(product.marketplaces->'ownStore'->>'price' AS DECIMAL),
          product.price
        )`,
              'actual_price'
            )
            .orderBy('actual_price', 'ASC', 'NULLS LAST');
          break;
        case 'price_desc':
          queryBuilder
            .addSelect(
              `COALESCE(
          CAST(product.marketplaces->'ownStore'->>'price' AS DECIMAL),
          product.price
        )`,
              'actual_price'
            )
            .orderBy('actual_price', 'DESC', 'NULLS LAST');
          break;
        case 'power_asc':
          queryBuilder.orderBy(
            `CASE
        WHEN product.power->>'value' ~ '[0-9]' THEN
          CASE
            WHEN position('-' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            WHEN position('/' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '/', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            ELSE
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), ' ', ''), '[^0-9.]', '', 'g')) AS DECIMAL)
          END
      END`,
            'ASC',
            'NULLS LAST'
          );
          break;
        case 'power_desc':
          queryBuilder.orderBy(
            `CASE
        WHEN product.power->>'value' ~ '[0-9]' THEN
          CASE
            WHEN position('-' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            WHEN position('/' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '/', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            ELSE
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), ' ', ''), '[^0-9.]', '', 'g')) AS DECIMAL)
          END
      END`,
            'DESC',
            'NULLS LAST'
          );
          break;
        default:
          queryBuilder.orderBy('product.createdAt', 'DESC');
      }

      queryBuilder.addOrderBy('product.id', 'ASC');
      queryBuilder.skip(skip).take(limit);

      const products = await queryBuilder.getMany();

      // Przed zwróceniem produktów, upewniamy się że zachowują oryginalną ścieżkę URL
      const productsWithOriginalPaths = products.map((product) => {
        // Znajdź oryginalną kategorię produktu (tą, w której został pierwszy raz dodany)
        const originalCategory = product.categories.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];

        // Sprawdź, czy to jest kategoria główna (trojfazowe/jednofazowe)
        if (
          originalCategory &&
          ['trojfazowe', 'jednofazowe'].includes(originalCategory.slug)
        ) {
          // Zachowaj oryginalny URL
          if (product.marketplaces?.ownStore) {
            product.marketplaces.ownStore.category_path = originalCategory.slug;
          }
        }

        return product;
      });

      return {
        products: productsWithOriginalPaths,
        total,
        page: Math.floor(skip / limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      throw error;
    }
  }

  async getProductsForAdmin(params: {
    page: number;
    limit: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
  }) {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where("product.marketplaces->'ownStore'->>'active' = :active", {
        active: 'true',
      });

    // Dodajemy sortowanie przed innymi operacjami
    if (params.sortField && params.sortDirection) {
      const direction = params.sortDirection.toUpperCase() as 'ASC' | 'DESC';

      // Znajdź ten fragment w getProductsForAdmin:
      switch (params.sortField) {
        case 'power':
          queryBuilder
            .addSelect(
              `CASE
        WHEN product.power->>'value' ~ '[0-9]' THEN
          CASE
            WHEN position('-' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            WHEN position('/' in product.power->>'value') > 0 THEN
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '/', 1), '[^0-9.]', '', 'g')) AS DECIMAL)
            ELSE
              CAST(TRIM(BOTH FROM REGEXP_REPLACE(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '[^0-9.]', '', 'g')) AS DECIMAL)
          END
      END`,
              'power_value'
            )
            .orderBy('power_value', direction);
          break;
        case 'rpm':
          queryBuilder
            .addSelect(
              `
        CASE
          WHEN product.rpm->>'value' ~ '[0-9]'
          THEN
            CASE
              WHEN position('/' in product.rpm->>'value') > 0
              THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(product.rpm->>'value', '/', 1), '[^0-9]', '', 'g'), '')::decimal
              WHEN position('-' in product.rpm->>'value') > 0
              THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(product.rpm->>'value', '-', 1), '[^0-9]', '', 'g'), '')::decimal
              ELSE NULLIF(REGEXP_REPLACE(product.rpm->>'value', '[^0-9]', '', 'g'), '')::decimal
            END
        END`,
              'rpm_value'
            )
            .orderBy('rpm_value', direction);
          break;
        case 'price':
          queryBuilder
            .addSelect(
              "CAST(product.marketplaces->'ownStore'->>'price' AS DECIMAL)",
              'price_value'
            )
            .orderBy('price_value', direction);
          break;
        default:
          queryBuilder.orderBy(`product.${params.sortField}`, direction);
      }
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    queryBuilder.addOrderBy('product.id', 'ASC');

    if (params.search?.trim()) {
      const searchTerm = `%${params.search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.manufacturer) LIKE :search)',
        { search: searchTerm }
      );
    }

    const [products, total] = await queryBuilder
      .skip(params.page * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      products,
      total,
      page: params.page,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  // Usuwanie produktu
  async deleteProduct(id: string): Promise<void> {
    const product = await this.getProductById(id);

    try {
      await this.repository.remove(product);
    } catch (error) {
      throw new ApiError(500, 'Błąd podczas usuwania produktu');
    }
  }

  // Aktualizacja ceny produktu
  async updatePrice(id: string, price: number): Promise<Product> {
    const product = await this.getProductById(id);

    if (price <= 0) {
      throw new ApiError(400, 'Cena musi być większa od 0');
    }

    product.price = price;

    try {
      await this.repository.save(product);
      return product;
    } catch (error) {
      throw new ApiError(500, 'Błąd podczas aktualizacji ceny');
    }
  }

  // Aktualizacja zdjęć produktu
  async updateImages(id: string, images: string[]): Promise<Product> {
    const product = await this.getProductById(id);

    product.images = images;

    try {
      await this.repository.save(product);
      return product;
    } catch (error) {
      throw new ApiError(500, 'Błąd podczas aktualizacji zdjęć');
    }
  }

  async importFromAllegro(allegroOffer: any) {
    const {
      processedParameters,
      description,
      name,
      primaryImage,
      images,
      stock,
      sellingMode,
      category,
    } = allegroOffer;

    const baseParameters = allegroOffer.parameters || [];
    const productParameters =
      allegroOffer.productSet?.[0]?.product?.parameters || [];
    const allParameters = [...baseParameters, ...productParameters];

    const product = new Product();

    const condition =
      allParameters?.find((p) => p.id === '11323')?.values[0]?.toLowerCase() ===
      'nowy'
        ? 'nowy'
        : 'uzywany';

    // Mapowanie podstawowych informacji
    product.name = name;
    product.manufacturer = processedParameters.model?.split(' ')[0] || '';
    product.price = parseFloat(sellingMode.price.amount);
    product.stock = stock.available;

    // Mapowanie mocy
    product.power = {
      value: processedParameters.power || '0',
      range: '', // można dodać logikę dla zakresu jeśli potrzebna
    };

    // Mapowanie obrotów
    product.rpm = {
      value: processedParameters.rpm || '0',
      range: '',
    };

    // Mapowanie pozostałych parametrów
    product.shaftDiameter = parseFloat(processedParameters.shaftDiameter) || 0;
    product.mechanicalSize = parseInt(
      processedParameters.model?.match(/\d+/)?.[0] || '0'
    );
    product.condition = condition;
    // Mapowanie obrazów
    product.images = [
      primaryImage.url,
      ...(images?.map((img: { url: string }) => img.url) || []),
    ];

    // Mapowanie parametrów marketplace'a
    product.marketplaces = {
      allegro: {
        active: true,
        productId: allegroOffer.id,
        price: parseFloat(sellingMode.price.amount),
        url: `https://allegro.pl/oferta/${allegroOffer.id}`,
        description: description,
        parameters: allParameters,
        category: {
          id: category.id,
        },
        napiecie: processedParameters.voltage || '400',
        waga: processedParameters.weight || '',
        wielkoscMechaniczna: processedParameters.model || '',
        srednicaWalu: processedParameters.shaftDiameter || '',
      },
    };

    // Zapisz produkt
    return await this.productRepository.save(product);
  }

  async searchProducts(query: string) {
    try {
      const searchTerm = query.toLowerCase().trim();

      if (!searchTerm) {
        return {
          products: [],
          total: 0,
          suggestions: { categories: [], manufacturers: [] },
        };
      }

      const powerMatch = searchTerm.match(/(\d+(?:[,.]\d+)?)\s*(?:kw)?/i);

      const queryBuilder = this.repository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category') // WAŻNE: leftJoinAndSelect zamiast leftJoin
        .where('product.stock > 0')
        // WAŻNE: Dodaj warunek, że produkt musi być aktywny w sklepie
        .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'")
        .andWhere("product.marketplaces->'ownStore'->>'price' IS NOT NULL");

      // Jeśli znaleziono moc, szukaj przede wszystkim po mocy
      if (powerMatch) {
        const searchPower = parseFloat(powerMatch[1].replace(',', '.'));

        // POPRAWKA: Ulepszona walidacja i obsługa błędnych wartości
        queryBuilder.andWhere(
          `(
          CASE
            -- Sprawdzamy czy wartość w ogóle istnieje
            WHEN product.power->>'value' IS NULL OR product.power->>'value' = '' THEN false
            
            -- Odrzucamy wartości z więcej niż jedną kropką (np. "3.32.2")
            WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', '.', '')) > 1 THEN false
            
            -- Odrzucamy wartości z więcej niż jednym przecinkiem
            WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', ',', '')) > 1 THEN false
            
            -- Odrzucamy wartości które nie zaczynają się od cyfry
            WHEN product.power->>'value' !~ '^[0-9]' THEN false
            
            -- Sprawdzamy prawidłowy format (cyfry, opcjonalnie jedna kropka/przecinek, opcjonalnie "kW")
            WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
              ABS(
                CAST(
                  CASE
                    -- Obsługa zakresu z myślnikiem
                    WHEN product.power->>'value' LIKE '%-%' THEN
                      REGEXP_REPLACE(
                        SPLIT_PART(
                          REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                          '-',
                          1
                        ),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                    -- Obsługa zakresu z ukośnikiem
                    WHEN product.power->>'value' LIKE '%/%' THEN
                      REGEXP_REPLACE(
                        SPLIT_PART(
                          REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                          '/',
                          1
                        ),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                    -- Pojedyncza wartość
                    ELSE
                      REGEXP_REPLACE(
                        REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                  END AS DECIMAL
                ) - :searchPower
              ) <= :tolerance
            ELSE false
          END
        )`,
          {
            searchPower,
            tolerance: searchPower * 0.1, // 10% tolerancji
          }
        );
      } else {
        // Wyszukiwanie tekstowe - po nazwie, producencie, opisie
        queryBuilder.andWhere(
          `(
          LOWER(product.name) LIKE :search OR
          LOWER(product.manufacturer) LIKE :search OR
          LOWER(product.description) LIKE :search OR
          LOWER(category.name) LIKE :search
        )`,
          { search: `%${searchTerm}%` }
        );
      }

      // Dodaj scoring dla lepszego sortowania wyników
      queryBuilder
        .addSelect(
          `(
          CASE 
            WHEN LOWER(product.name) LIKE :exactSearch THEN 100
            WHEN LOWER(product.name) LIKE :startSearch THEN 90
            WHEN LOWER(product.manufacturer) = :searchExact THEN 80
            WHEN LOWER(product.manufacturer) LIKE :startSearch THEN 70
            WHEN LOWER(product.name) LIKE :search THEN 60
            WHEN LOWER(product.manufacturer) LIKE :search THEN 50
            WHEN LOWER(product.description) LIKE :search THEN 30
            WHEN LOWER(category.name) LIKE :search THEN 20
            ELSE 0
          END
        )`,
          'relevance_score'
        )
        .setParameter('exactSearch', searchTerm)
        .setParameter('searchExact', searchTerm)
        .setParameter('startSearch', `${searchTerm}%`)
        .setParameter('search', `%${searchTerm}%`);

      // Sortuj po relevance, potem po popularności
      queryBuilder
        .orderBy('relevance_score', 'DESC')
        .addOrderBy('product.viewCount', 'DESC')
        .addOrderBy('product.purchaseCount', 'DESC')
        .take(20); // Limit wyników dla szybkości

      const [products, total] = await queryBuilder.getManyAndCount();

      // Dodaj sugestie kategorii na podstawie wyników
      const categories = new Set<string>();
      const manufacturers = new Set<string>();

      products.forEach((product) => {
        product.categories?.forEach((cat) => categories.add(cat.name));
        if (product.manufacturer) manufacturers.add(product.manufacturer);
      });

      return {
        products,
        total,
        suggestions: {
          categories: Array.from(categories).slice(0, 5),
          manufacturers: Array.from(manufacturers).slice(0, 5),
        },
      };
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      return {
        products: [],
        total: 0,
        suggestions: { categories: [], manufacturers: [] },
      };
    }
  }

  // Dodatkowo - skrypt do naprawy istniejących błędnych danych w bazie
  async cleanupInvalidPowerValues() {
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Znajdź produkty z nieprawidłowymi wartościami mocy (np. z podwójnymi kropkami)
        const invalidProducts = await queryRunner.query(`
        SELECT id, power->>'value' as power_value 
        FROM products 
        WHERE power->>'value' ~ '\\.\\.|\\..*\\.' 
           OR power->>'value' ~ '[0-9]+\\.[0-9]+\\.[0-9]+'
      `);

        console.log(
          `Znaleziono ${invalidProducts.length} produktów z nieprawidłowymi wartościami mocy`
        );

        for (const product of invalidProducts) {
          const powerValue = product.power_value;

          // Próbuj naprawić wartość
          let cleanedValue = powerValue;

          // Usuń dodatkowe kropki - zostaw tylko pierwszą
          const parts = powerValue.split('.');
          if (parts.length > 2) {
            // Zostaw pierwszą część i pierwszą część po kropce
            cleanedValue = `${parts[0]}.${parts[1].replace(/[^0-9]/g, '')}`;
          }

          // Jeśli nadal nieprawidłowa, ustaw na "0"
          if (
            !/^[0-9]+([.,][0-9]+)?$/.test(
              cleanedValue.replace(' kW', '').replace(',', '.')
            )
          ) {
            cleanedValue = '0';
          }

          console.log(
            `Naprawiam produkt ${product.id}: "${powerValue}" -> "${cleanedValue}"`
          );

          // Zaktualizuj wartość w bazie
          await queryRunner.query(
            `UPDATE products 
           SET power = jsonb_set(power, '{value}', $1::jsonb) 
           WHERE id = $2`,
            [JSON.stringify(cleanedValue), product.id]
          );
        }

        await queryRunner.commitTransaction();
        console.log('✅ Naprawiono nieprawidłowe wartości mocy');
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Błąd podczas naprawiania wartości mocy:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string, limit: number = 10) {
    try {
      const searchTerm = query.toLowerCase().trim();

      if (searchTerm.length < 2) {
        return [];
      }

      const queryBuilder = this.repository
        .createQueryBuilder('product')
        .select([
          'product.id',
          'product.name',
          'product.manufacturer',
          'product.power',
          'product.mainImage',
          'product.marketplaces',
          'product.viewCount', // DODAJ TE LINIE!
          'product.purchaseCount', // DODAJ TE LINIE!
        ])
        .leftJoin('product.categories', 'category')
        .addSelect(['category.id', 'category.name', 'category.slug'])
        .where('product.stock > 0');

      // Sprawdź czy to wyszukiwanie po mocy
      const powerMatch = searchTerm.match(/^(\d+(?:[,.]\d+)?)\s*(?:kw)?$/i);

      if (powerMatch) {
        const searchPower = parseFloat(powerMatch[1].replace(',', '.'));

        // Wyszukiwanie po mocy z tolerancją
        queryBuilder.andWhere(
          `(
        CASE
          WHEN product.power->>'value' IS NULL OR product.power->>'value' = '' THEN false
          WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', '.', '')) > 1 THEN false
          WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', ',', '')) > 1 THEN false
          WHEN product.power->>'value' !~ '^[0-9]' THEN false
          WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
            ABS(
              CAST(
                CASE
                  WHEN product.power->>'value' LIKE '%-%' THEN
                    REGEXP_REPLACE(
                      SPLIT_PART(
                        REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                        '-',
                        1
                      ),
                      '[^0-9.]',
                      '',
                      'g'
                    )
                  WHEN product.power->>'value' LIKE '%/%' THEN
                    REGEXP_REPLACE(
                      SPLIT_PART(
                        REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                        '/',
                        1
                      ),
                      '[^0-9.]',
                      '',
                      'g'
                    )
                  ELSE
                    REGEXP_REPLACE(
                      REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                      '[^0-9.]',
                      '',
                      'g'
                    )
                END AS DECIMAL
              ) - :searchPower
            ) <= :tolerance
          ELSE false
        END
      )`,
          {
            searchPower,
            tolerance: searchPower * 0.15, // 15% tolerancji dla sugestii
          }
        );

        // NIE DODAWAJ power_difference jako SELECT - to tylko dla WHERE
        // Usuń orderBy dla power_difference
        // queryBuilder.orderBy('power_difference', 'ASC'); // USUŃ TO!
      } else {
        // Wyszukiwanie tekstowe
        queryBuilder.andWhere(
          `(
        LOWER(product.name) LIKE :search OR
        LOWER(product.manufacturer) LIKE :search
      )`,
          {
            search: `%${searchTerm}%`,
          }
        );

        // NIE DODAWAJ relevance jako SELECT - użyj tylko w orderBy
      }

      // Sortowanie - najpierw upewnij się, że kolumny są w SELECT
      queryBuilder
        .orderBy('product.viewCount', 'DESC')
        .addOrderBy('product.purchaseCount', 'DESC')
        .addOrderBy('product.id', 'ASC') // Dodaj stabilne sortowanie
        .take(limit);

      const products = await queryBuilder.getMany();

      return products;
    } catch (error) {
      console.error('Błąd pobierania sugestii:', error);
      return [];
    }
  }

  // Metoda do śledzenia popularnych wyszukiwań
  async trackSearch(query: string) {
    try {
      // Możesz zapisywać popularne wyszukiwania do osobnej tabeli
      // lub cache'a (Redis) dla analizy trendów
    } catch (error) {
      console.error('Błąd śledzenia wyszukiwania:', error);
    }
  }

  async getUniqueManufacturers(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('product')
      .select('DISTINCT product.manufacturer', 'manufacturer')
      .orderBy('manufacturer', 'ASC')
      .getRawMany();

    return result.map((r) => r.manufacturer);
  }

  private capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private findMatchingCategory(categoryName: string): string | undefined {
    if (!categoryName) return undefined;

    // Najpierw sprawdź bezpośrednie dopasowanie
    for (const [fullName, variants] of Object.entries(categoryNameVariants)) {
      if (categoryName === fullName) return fullName;
      if (variants.includes(categoryName)) return fullName;
    }
    return undefined;
  }

  async getParameterRanges() {
    const queryBuilder = this.repository.createQueryBuilder('product');

    const powerResult = await queryBuilder
      .select([
        `MIN(
        CASE 
          WHEN product.power->>'value' ~ '^[0-9]' 
            AND product.power->>'value' NOT LIKE '%.%.%'  -- Odrzuć wartości z wieloma kropkami
            AND product.power->>'value' NOT LIKE '%,%,%'  -- Odrzuć wartości z wieloma przecinkami
          THEN
            CAST(
              CASE
                -- Jeśli jest jedna kropka, użyj normalnie
                WHEN product.power->>'value' ~ '^[0-9]+\\.?[0-9]*\\s*(kW)?$' THEN
                  REGEXP_REPLACE(
                    REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                -- Jeśli jest przecinek jako separator dziesiętny
                WHEN product.power->>'value' ~ '^[0-9]+,?[0-9]*\\s*(kW)?$' THEN
                  REGEXP_REPLACE(
                    REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                ELSE NULL
              END AS DECIMAL
            )
          ELSE NULL
        END
      ) as minPower`,
        `MAX(
        CASE 
          WHEN product.power->>'value' ~ '^[0-9]' 
            AND product.power->>'value' NOT LIKE '%.%.%'  -- Odrzuć wartości z wieloma kropkami
            AND product.power->>'value' NOT LIKE '%,%,%'  -- Odrzuć wartości z wieloma przecinkami
          THEN
            CAST(
              CASE
                -- Jeśli jest jedna kropka, użyj normalnie
                WHEN product.power->>'value' ~ '^[0-9]+\\.?[0-9]*\\s*(kW)?$' THEN
                  REGEXP_REPLACE(
                    REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                -- Jeśli jest przecinek jako separator dziesiętny
                WHEN product.power->>'value' ~ '^[0-9]+,?[0-9]*\\s*(kW)?$' THEN
                  REGEXP_REPLACE(
                    REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                ELSE NULL
              END AS DECIMAL
            )
          ELSE NULL
        END
      ) as maxPower`,
      ])
      .getRawOne();

    // Analogicznie dla RPM
    const rpmResult = await queryBuilder
      .select([
        `MIN(
        CASE 
          WHEN product.rpm->>'value' ~ '^[0-9]'
            AND product.rpm->>'value' NOT LIKE '%.%.%'
            AND product.rpm->>'value' NOT LIKE '%,%,%'
          THEN
            CAST(
              CASE
                WHEN product.rpm->>'value' ~ '^[0-9]+\\.?[0-9]*$' THEN
                  REGEXP_REPLACE(
                    REPLACE(product.rpm->>'value', ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                WHEN product.rpm->>'value' ~ '^[0-9]+,?[0-9]*$' THEN
                  REGEXP_REPLACE(
                    REPLACE(product.rpm->>'value', ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                ELSE NULL
              END AS DECIMAL
            )
          ELSE NULL
        END
      ) as minRpm`,
        `MAX(
        CASE 
          WHEN product.rpm->>'value' ~ '^[0-9]'
            AND product.rpm->>'value' NOT LIKE '%.%.%'
            AND product.rpm->>'value' NOT LIKE '%,%,%'
          THEN
            CAST(
              CASE
                WHEN product.rpm->>'value' ~ '^[0-9]+\\.?[0-9]*$' THEN
                  REGEXP_REPLACE(
                    REPLACE(product.rpm->>'value', ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                WHEN product.rpm->>'value' ~ '^[0-9]+,?[0-9]*$' THEN
                  REGEXP_REPLACE(
                    REPLACE(product.rpm->>'value', ',', '.'),
                    '[^0-9.]',
                    '',
                    'g'
                  )
                ELSE NULL
              END AS DECIMAL
            )
          ELSE NULL
        END
      ) as maxRpm`,
      ])
      .getRawOne();

    const shaftResult = await queryBuilder
      .select([
        'MIN(product.shaftDiameter) as minShaft',
        'MAX(product.shaftDiameter) as maxShaft',
      ])
      .getRawOne();

    const mechanicalSizeResult = await queryBuilder
      .select([
        'MIN(product.mechanicalSize) as minSize',
        'MAX(product.mechanicalSize) as maxSize',
      ])
      .getRawOne();

    return {
      power: [
        powerResult.minPower !== null
          ? Math.floor(parseFloat(powerResult.minPower) * 10) / 10
          : 0.03,
        powerResult.maxPower !== null
          ? Math.ceil(parseFloat(powerResult.maxPower) * 10) / 10
          : 300,
      ],
      rpm: [
        rpmResult.minRpm !== null
          ? Math.floor(parseFloat(rpmResult.minRpm))
          : 0,
        rpmResult.maxRpm !== null
          ? Math.ceil(parseFloat(rpmResult.maxRpm))
          : 3000,
      ],
      shaftDiameter: [
        shaftResult.minShaft !== null
          ? Math.floor(parseFloat(shaftResult.minShaft))
          : 0,
        shaftResult.maxShaft !== null
          ? Math.ceil(parseFloat(shaftResult.maxShaft))
          : 100,
      ],
      mechanicalSize: [
        mechanicalSizeResult.minSize !== null
          ? Math.floor(parseFloat(mechanicalSizeResult.minSize))
          : 0,
        mechanicalSizeResult.maxSize !== null
          ? Math.ceil(parseFloat(mechanicalSizeResult.maxSize))
          : 500,
      ],
    };
  }

  async getSimilarProducts(
    productId: string,
    page: number = 0,
    limit: number = 4
  ) {
    const product = await this.repository.findOne({
      where: { id: productId },
      relations: ['categories'],
    });

    if (!product) {
      throw new ApiError(404, 'Produkt nie został znaleziony');
    }

    const categoryId = product.categories[0]?.id;

    // Parsujemy moc aktulanego produktu - TYLKO RAZ, na początku
    let currentPowerValue = product.power.value;
    if (currentPowerValue.includes('-')) {
      currentPowerValue = currentPowerValue.split('-')[0];
    }
    currentPowerValue = currentPowerValue.replace(' kW', '').replace(',', '.');
    const parsedCurrentPower = parseFloat(currentPowerValue);

    // Pobieramy produkty z pełnymi danymi!
    const products = await this.repository.find({
      where: [
        {
          categories: { id: categoryId },
          manufacturer: product.manufacturer,
          id: Not(productId),
          stock: MoreThan(0),
        },
        {
          categories: { id: categoryId },
          id: Not(productId),
          stock: MoreThan(0),
        },
      ],
      order: {
        purchaseCount: 'DESC',
        viewCount: 'DESC',
      },
    });

    // Teraz sortujemy produkty po mocy w TypeScript
    const sortedProducts = products.sort((a, b) => {
      // Parsujemy moce porównywanych produktów
      const getPower = (p: Product) => {
        let power = p.power.value;
        if (power.includes('-')) power = power.split('-')[0];
        power = power.replace(' kW', '').replace(',', '.');
        return parseFloat(power);
      };

      const powerA = getPower(a);
      const powerB = getPower(b);

      // Liczymy różnicę względem mocy szukanego produktu
      const diffA = Math.abs(powerA - parsedCurrentPower);
      const diffB = Math.abs(powerB - parsedCurrentPower);

      return diffA - diffB;
    });

    // Paginacja
    const paginatedProducts = sortedProducts.slice(
      page * limit,
      (page + 1) * limit
    );

    // Zwiększamy licznik wyświetleń
    await this.repository.increment({ id: productId }, 'viewCount', 1);

    return {
      products: paginatedProducts,
      total: products.length,
      page,
      hasMore: (page + 1) * limit < products.length,
    };
  }

  async getCategoryRanges(categoryId: string) {
    try {
      // Specjalna obsługa dla strony wyszukiwania
      if (categoryId === 'search-results') {
        // Dla strony wyszukiwania zwróć globalne zakresy
        return await this.getParameterRanges();
      }

      // Najpierw sprawdź czy kategoria ma własne filtry
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      // Sprawdź czy są produkty w kategorii
      const hasProducts = await this.hasProductsInCategory(categoryId);

      // Jeśli kategoria ma zdefiniowane własne zakresy mocy, użyj ich
      if (category?.productFilters?.powerRange) {
        const powerMin = parseFloat(category.productFilters.powerRange.min);
        const powerMax = parseFloat(category.productFilters.powerRange.max);

        if (!isNaN(powerMin) && !isNaN(powerMax)) {
          return {
            power: [powerMin, powerMax],
            rpm: await this.getRpmRangeForCategory(categoryId),
            shaftDiameter:
              await this.getShaftDiameterRangeForCategory(categoryId),
          };
        }
      }

      // Jeśli nie ma własnych zakresów lub są nieprawidłowe, pobierz z produktów
      const ranges = await this.fetchAllRangesForCategory(categoryId);

      // Jeśli nie ma produktów lub zakresy są nieprawidłowe, użyj domyślnych
      return {
        power:
          ranges.power[0] === 0 && ranges.power[1] === 0
            ? [0.03, 300]
            : ranges.power,
        rpm:
          ranges.rpm[0] === 0 && ranges.rpm[1] === 0 ? [0, 3000] : ranges.rpm,
        shaftDiameter:
          ranges.shaftDiameter[0] === 0 && ranges.shaftDiameter[1] === 0
            ? [0, 100]
            : ranges.shaftDiameter,
      };
    } catch (error) {
      console.error('Błąd podczas pobierania zakresów:', error);
      // Zwróć domyślne zakresy w przypadku błędu
      return {
        power: [0.03, 300],
        rpm: [0, 3000],
        shaftDiameter: [0, 1000],
      };
    }
  }

  private async getRpmRangeForCategory(
    categoryId: string
  ): Promise<[number, number]> {
    const minRpm = await this.getMinRpmForCategory(categoryId);
    const maxRpm = await this.getMaxRpmForCategory(categoryId);

    return [minRpm || 0, maxRpm || 3000];
  }

  private async getShaftDiameterRangeForCategory(
    categoryId: string
  ): Promise<[number, number]> {
    const minShaft = await this.getMinShaftDiameterForCategory(categoryId);
    const maxShaft = await this.getMaxShaftDiameterForCategory(categoryId);

    return [minShaft || 0, maxShaft || 100];
  }

  private getDefaultRanges() {
    return {
      power: [0.03, 300],
      rpm: [0, 3000],
      shaftDiameter: [0, 100],
    };
  }

  private async hasProductsInCategory(categoryId: string): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .getCount();

    return count > 0;
  }

  private parseRpmValue(value: string): number {
    if (!value) return 0;

    // Najpierw zamieniamy przecinki na kropki
    const normalized = value.replace(',', '.');

    // Bierzemy pierwszą część, może być przed "/" lub "-"
    let firstPart = normalized;
    if (normalized.includes('/')) {
      firstPart = normalized.split('/')[0];
    } else if (normalized.includes('-')) {
      firstPart = normalized.split('-')[0];
    }

    // Zostawiamy tylko cyfry i kropkę
    const cleaned = firstPart.replace(/[^0-9.]/g, '');

    return parseFloat(cleaned) || 0;
  }

  private async fetchAllRangesForCategory(categoryId: string) {
    const results = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .select([
        `MIN(
          CASE
            WHEN product.power->>'value' ~ '^[0-9,.]+(-[0-9,.]+)?\\s*kW?$'
            THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.power->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g'), '')::decimal
            ELSE NULL
          END
        ) as min_power`,
        `MAX(
          CASE
            WHEN product.power->>'value' ~ '^[0-9,.]+(-[0-9,.]+)?\\s*kW?$'
            THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.power->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g'), '')::decimal
            ELSE NULL
          END
        ) as max_power`,
        `MIN(
        CASE
          WHEN product.rpm->>'value' ~ '[0-9]' AND
              REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g') != ''
          THEN
            CASE
              WHEN position('/' in REPLACE(product.rpm->>'value', ',', '.')) > 0
              THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g'), '')::decimal
              WHEN position('-' in REPLACE(product.rpm->>'value', ',', '.')) > 0
              THEN NULLIF(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g'), '')::decimal
              ELSE NULLIF(REGEXP_REPLACE(REPLACE(product.rpm->>'value', ',', '.'), '[^0-9.]', '', 'g'), '')::decimal
            END
          ELSE NULL
        END
      ) as min_rpm`,
        `MAX(
          CASE
            WHEN product.rpm->>'value' ~ '[0-9]'
            THEN
              CASE
                WHEN position('/' in REPLACE(product.rpm->>'value', ',', '.')) > 0
                THEN REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g')::decimal
                WHEN position('-' in REPLACE(product.rpm->>'value', ',', '.')) > 0
                THEN REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g')::decimal
                ELSE REGEXP_REPLACE(REPLACE(product.rpm->>'value', ',', '.'), '[^0-9.]', '', 'g')::decimal
              END
            ELSE NULL
          END
        ) as max_rpm`,
        'MIN(product.shaftDiameter) as min_shaft',
        'MAX(product.shaftDiameter) as max_shaft',
      ])
      .getRawOne();
    const minRpm = await this.getMinRpmForCategory(categoryId);
    const maxRpm = await this.getMaxRpmForCategory(categoryId);

    return {
      power: [
        this.validatePowerValue(
          results.min_power,
          await this.getMinPowerForCategory(categoryId)
        ),
        this.validatePowerValue(
          results.max_power,
          await this.getMaxPowerForCategory(categoryId)
        ),
      ],
      rpm: [minRpm, maxRpm],
      shaftDiameter: [
        this.validateShaftValue(
          results.min_shaft,
          await this.getMinShaftDiameterForCategory(categoryId)
        ),
        this.validateShaftValue(
          results.max_shaft,
          await this.getMaxShaftDiameterForCategory(categoryId)
        ),
      ],
    };
  }

  private async getMinPowerForCategory(categoryId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere("product.power->>'value' IS NOT NULL")
      .andWhere("product.power->>'value' ~ '^[0-9,.]+(-[0-9,.]+)?\\s*kW?$'")
      .orderBy(
        `REPLACE(REPLACE(SPLIT_PART(REPLACE(product.power->>'value', ',', '.'), '-', 1), ' kW', ''), ' ', '')::decimal`,
        'ASC'
      )
      .limit(1)
      .getOne();

    return result
      ? parseFloat(
          result.power.value.replace(',', '.').replace(' kW', '').split('-')[0]
        )
      : 0.03;
  }

  private async getMaxPowerForCategory(categoryId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere("product.power->>'value' IS NOT NULL")
      .andWhere("product.power->>'value' ~ '^[0-9,.]+(-[0-9,.]+)?\\s*kW?$'")
      .orderBy(
        `CASE
          WHEN position('-' in product.power->>'value') > 0
          THEN REPLACE(REPLACE(SPLIT_PART(REPLACE(product.power->>'value', ',', '.'), '-', 2), ' kW', ''), ' ', '')::decimal
          ELSE REPLACE(REPLACE(SPLIT_PART(REPLACE(product.power->>'value', ',', '.'), '-', 1), ' kW', ''), ' ', '')::decimal
        END`,
        'DESC'
      )
      .limit(1)
      .getOne();

    return result
      ? result.power.value.includes('-')
        ? parseFloat(
            result.power.value
              .split('-')[1]
              .replace(',', '.')
              .replace(' kW', '')
          )
        : parseFloat(result.power.value.replace(',', '.').replace(' kW', ''))
      : 300;
  }

  private async getMinRpmForCategory(categoryId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere("product.rpm->>'value' IS NOT NULL")
      .andWhere(
        "REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g') != ''"
      )
      .orderBy(
        `REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g')::decimal`,
        'ASC'
      )
      .limit(1)
      .getOne();

    if (!result) return 0;
    const rpmValue = result.rpm.value;
    const normalized = rpmValue.replace(',', '.');

    let firstPart = normalized;
    if (normalized.includes('/')) {
      firstPart = normalized.split('/')[0];
    } else if (normalized.includes('-')) {
      firstPart = normalized.split('-')[0];
    }

    const cleanValue = firstPart.replace(/[^0-9.]/g, '');
    return parseFloat(cleanValue) || 0;
  }

  private async getMaxRpmForCategory(categoryId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere("product.rpm->>'value' IS NOT NULL")
      .andWhere(
        "REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g') != ''"
      )
      .orderBy(
        `CASE
          WHEN position('/' in REPLACE(product.rpm->>'value', ',', '.')) > 0
          THEN REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g')::decimal
          WHEN position('-' in REPLACE(product.rpm->>'value', ',', '.')) > 0
          THEN REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g')::decimal
          ELSE REGEXP_REPLACE(REPLACE(product.rpm->>'value', ',', '.'), '[^0-9.]', '', 'g')::decimal
        END`,
        'DESC'
      )
      .limit(1)
      .getOne();

    if (!result) {
      return 2900;
    }

    const rpmValue = result.rpm.value;
    const normalized = rpmValue.replace(',', '.');

    let firstPart = normalized;
    if (normalized.includes('/')) {
      firstPart = normalized.split('/')[0];
    } else if (normalized.includes('-')) {
      firstPart = normalized.split('-')[0];
    }

    const cleanValue = firstPart.replace(/[^0-9.]/g, '');
    const maxRpm = parseFloat(cleanValue);

    return maxRpm || 2900;
  }

  private async getMinShaftDiameterForCategory(
    categoryId: string
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere('product.shaftDiameter IS NOT NULL')
      .orderBy('product.shaftDiameter', 'ASC')
      .limit(1)
      .getOne();

    return result?.shaftDiameter ?? 0;
  }

  private async getMaxShaftDiameterForCategory(
    categoryId: string
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .andWhere('product.shaftDiameter IS NOT NULL')
      .orderBy('product.shaftDiameter', 'DESC')
      .limit(1)
      .getOne();

    return result?.shaftDiameter ?? 100;
  }

  private validatePowerValue(value: any, fallback: number): number {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue !== null
      ? parsedValue // Teraz bierze dokładną wartość
      : fallback;
  }

  private validateRpmValue(value: any, fallback: number): number {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue !== null
      ? Math.round(parsedValue)
      : fallback;
  }

  private validateShaftValue(value: any, fallback: number): number {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue !== null
      ? Math.round(parsedValue)
      : fallback;
  }

  private async ensureManufacturerExists(
    manufacturerName: string
  ): Promise<string | null> {
    if (!manufacturerName) return null;

    try {
      // Pobierz repozytorium producentów
      const manufacturerRepo = AppDataSource.getRepository(Manufacturer);

      // Szukaj istniejącego producenta
      const existingManufacturer = await manufacturerRepo.findOne({
        where: { name: manufacturerName },
      });

      if (existingManufacturer) {
        return existingManufacturer.id;
      }

      // Jeśli nie istnieje, stwórz nowego
      const newManufacturer = manufacturerRepo.create({
        name: manufacturerName,
        slug: `marka-producent/${slugify(manufacturerName, { lower: true, locale: 'pl' })}`,
        seo: {
          title: `${manufacturerName} - Silniki Elektryczne`,
          description: `Napędy producenta ${manufacturerName} w naszym sklepie.`,
        },
      });

      const savedManufacturer = await manufacturerRepo.save(newManufacturer);
      return savedManufacturer.id;
    } catch (error) {
      console.error('Błąd podczas tworzenia/sprawdzania producenta:', error);
      return null;
    }
  }

  async addImages(id: string, imageUrls: string[]): Promise<Product> {
    const product = await this.getProductById(id);

    product.images = [...product.images, ...imageUrls];

    try {
      await this.repository.save(product);
      return product;
    } catch (error) {
      throw new ApiError(500, 'Błąd podczas dodawania zdjęć do produktu');
    }
  }

  async getAvailableRpmValues(categoryId: string): Promise<number[]> {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .select('product.rpm', 'rpm')
      .getRawMany();

    const rpmValues = result
      .map((item: { rpm: any }) => {
        try {
          // Jeśli rpm jest obiektem JSON
          if (typeof item.rpm === 'object') {
            return parseFloat(item.rpm.value);
          }

          // Jeśli rpm jest stringiem JSON
          if (typeof item.rpm === 'string' && item.rpm.includes('{')) {
            const parsed = JSON.parse(item.rpm);
            return parseFloat(parsed.value);
          }

          // Jeśli rpm jest zwykłym stringiem z liczbą
          if (typeof item.rpm === 'string') {
            // Usuń wszystkie znaki oprócz cyfr, kropki i przecinka
            const cleanedValue = item.rpm
              .replace(/[^\d.,]/g, '')
              .replace(',', '.');
            return parseFloat(cleanedValue);
          }

          // Jeśli rpm jest liczbą
          if (typeof item.rpm === 'number') {
            return item.rpm;
          }

          return NaN;
        } catch (error) {
          console.error('Błąd parsowania RPM:', error, 'Wartość:', item.rpm);
          return NaN;
        }
      })
      .filter((rpm: number) => !isNaN(rpm) && rpm > 0)
      .sort((a: number, b: number) => a - b);

    // Usuń duplikaty
    return [...new Set(rpmValues)];
  }

  async updateMainImage(
    productId: string,
    mainImage: string
  ): Promise<Product> {
    const product = await this.getProductById(productId);
    product.mainImage = mainImage;
    return await this.repository.save(product);
  }

  async updateGalleryImages(
    productId: string,
    galleryImages: string[]
  ): Promise<Product> {
    if (galleryImages.length > 3) {
      throw new ApiError(400, 'Maksymalna liczba zdjęć w galerii to 3');
    }
    const product = await this.getProductById(productId);
    product.galleryImages = galleryImages;
    return await this.repository.save(product);
  }

  async getProductTypesForCategory(categoryId: string) {
    const result = await this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'productCategory')
      .leftJoin('product.categories', 'typeCategory')
      .where('productCategory.id = :categoryId', { categoryId })
      .andWhere('typeCategory.slug IN (:...mainTypes)', {
        mainTypes: [
          'trojfazowe',
          'jednofazowe',
          'wentylatory-przemyslowe',
          'motoreduktory',
          'z-hamulcem',
          'dwubiegowe',
          'pierscieniowe',
        ],
      })
      .andWhere('product.stock > 0')
      .select([
        'typeCategory.slug as type',
        'typeCategory.name as name',
        'COUNT(DISTINCT product.id) as count',
      ])
      .groupBy('typeCategory.slug')
      .addGroupBy('typeCategory.name')
      .getRawMany();

    return result.map((item) => ({
      value: item.type,
      label: item.name,
      count: parseInt(item.count),
    }));
  }

  async getManufacturersForCategory(categoryId: string) {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('product.stock > 0')
      .select([
        'product.manufacturer as name',
        'COUNT(DISTINCT product.id) as count',
      ])
      .groupBy('product.manufacturer')
      .orderBy('product.manufacturer', 'ASC');

    const manufacturers = await queryBuilder.getRawMany();

    return manufacturers.map((m) => ({
      name: m.name,
      count: parseInt(m.count),
    }));
  }

  public async cancelReservation(
    productId: string,
    reservationId: string,
    quantity: number
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Najpierw sprawdzamy czy rezerwacja istnieje
      const reservation = this.reservationsStore.get(reservationId);
      if (!reservation) {
        await queryRunner.rollbackTransaction();
        return { success: true, data: { stock: 0 } };
      }

      // Używamy istniejącej metody do usunięcia rezerwacji
      await this.deleteReservation(reservationId);

      // Aktualizujemy stan produktu
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new ApiError(404, 'Produkt nie został znaleziony');
      }

      const newStock = product.stock + quantity;
      await queryRunner.query('UPDATE products SET stock = $1 WHERE id = $2', [
        newStock,
        productId,
      ]);

      await queryRunner.commitTransaction();

      return { success: true, data: { stock: newStock } };
    } catch (error) {
      console.error('Błąd podczas anulowania rezerwacji:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async setReservation(
    id: string,
    data: {
      productId: string;
      quantity: number;
      expiresAt: number;
      isActive: boolean;
    }
  ): Promise<void> {
    this.reservationsStore.set(id, data);
  }

  public async getReservation(id: string) {
    const reservation = this.reservationsStore.get(id);
    if (!reservation) return null;

    // Sprawdź czy rezerwacja jest nadal aktualna
    if (Date.now() > reservation.expiresAt || !reservation.isActive) {
      this.reservationsStore.delete(id);
      return null;
    }

    return reservation;
  }

  private async deleteReservation(id: string): Promise<void> {
    this.reservationsStore.delete(id);
  }

  async reserveTemporary(productId: string, quantity: number) {
    const RESERVATION_TIME = 30 * 60 * 1000;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product || product.stock < quantity) {
        throw new Error('Niewystarczająca ilość produktu');
      }

      const reservationId = uuidv4();
      const expiresAt = Date.now() + RESERVATION_TIME * 1000;

      // Teraz możemy użyć setReservation, bo mamy jego implementację
      await this.setReservation(reservationId, {
        productId,
        quantity,
        expiresAt,
        isActive: true,
      });

      product.stock -= quantity;
      await queryRunner.manager.save(Product, product);
      await queryRunner.commitTransaction();

      setTimeout(async () => {
        const reservation = await this.getReservation(reservationId);
        if (reservation && reservation.isActive) {
          await this.cancelReservation(productId, reservationId, quantity);
          this.eventEmitter.emit('reservationExpired', {
            productId,
            reservationId,
          });
        }
      }, RESERVATION_TIME * 1000);

      return {
        success: true,
        data: {
          reservationId,
          expiresAt,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  public onReservationExpired(
    callback: (data: { productId: string; reservationId: string }) => void
  ) {
    this.eventEmitter.on('reservationExpired', callback);
  }

  public removeReservationExpiredListener(
    callback: (data: { productId: string; reservationId: string }) => void
  ) {
    this.eventEmitter.removeListener('reservationExpired', callback);
  }

  async importFromWooCommerce(productIds: number[]): Promise<Product[]> {
    try {
      const allCategories = await this.categoryRepository.find();
      const manufacturerRepo = AppDataSource.getRepository(Manufacturer);

      // Znajdź domyślną kategorię "silniki-elektryczne"
      const defaultCategory = allCategories.find(
        (cat) => cat.slug === 'silniki-elektryczne'
      );

      if (!defaultCategory) {
        throw new Error(
          'Nie znaleziono domyślnej kategorii silniki-elektryczne'
        );
      }

      const response = await fetch(
        'https://www.silniki-elektryczne.com.pl/wp-content/scripts/export-products.php'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as WooCommerceApiResponse;
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Błąd pobierania produktów');
      }

      const importedProducts: Product[] = [];
      const selectedProducts = result.data.filter((wooProduct) =>
        productIds.includes(wooProduct.ID)
      );

      for (const wooProduct of selectedProducts) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          let matchingCategory: Category | undefined;

          if (wooProduct.category) {
            const mappedCategoryName = this.findMatchingCategory(
              wooProduct.category.name
            );

            if (mappedCategoryName) {
              matchingCategory = allCategories.find((cat) => {
                const normalized = cat.name.toLowerCase().trim();
                const searching = mappedCategoryName.toLowerCase().trim();
                return normalized === searching;
              });

              if (!matchingCategory) {
                console.log(
                  'Nie znaleziono dopasowania dla:',
                  mappedCategoryName
                );
                console.log(
                  'Dostępne kategorie:',
                  allCategories.map((c) => c.name)
                );
              } else {
                console.log('Znaleziono kategorię:', matchingCategory.name);
              }
            } else {
              console.log(
                'Brak mapowania dla kategorii:',
                wooProduct.category.name
              );
            }
          }

          let mainImageUrl: string | null = null;
          let galleryImageUrls: string[] = [];

          // Handle main image
          if (wooProduct.image_url) {
            try {
              const imageResponse = await fetch(wooProduct.image_url);
              if (!imageResponse.ok)
                throw new Error(
                  `Failed to fetch image: ${imageResponse.statusText}`
                );

              const imageBuffer = Buffer.from(
                await imageResponse.arrayBuffer()
              );
              const fileName = `products/${uuidv4()}${path.extname(wooProduct.image_url)}`;

              const uploadResult = await uploadToS3(
                imageBuffer,
                fileName,
                imageResponse.headers.get('content-type') || 'image/jpeg'
              );

              mainImageUrl = uploadResult;
            } catch (imageError) {
              console.error(
                'Błąd podczas pobierania głównego zdjęcia:',
                imageError
              );
            }
          }

          // Handle gallery images if they exist in WooCommerce response
          if (
            wooProduct.gallery_images &&
            Array.isArray(wooProduct.gallery_images)
          ) {
            for (const galleryUrl of wooProduct.gallery_images) {
              try {
                const imageResponse = await fetch(galleryUrl);
                if (!imageResponse.ok) continue;

                const imageBuffer = Buffer.from(
                  await imageResponse.arrayBuffer()
                );
                const fileName = `products/${uuidv4()}${path.extname(galleryUrl)}`;

                const uploadResult = await uploadToS3(
                  imageBuffer,
                  fileName,
                  imageResponse.headers.get('content-type') || 'image/jpeg'
                );

                galleryImageUrls.push(uploadResult);
              } catch (imageError) {
                console.error(
                  'Błąd podczas pobierania zdjęcia z galerii:',
                  imageError
                );
                continue;
              }
            }
          }

          // Jeśli nie znaleziono kategorii, użyj domyślnej
          const categoryToUse = matchingCategory || defaultCategory;

          const powerValue = wooProduct.power || '0';

          const rpmValue = wooProduct.rpm
            ? wooProduct.rpm.replace(' obr./min', '')
            : '0';

          let manufacturerId = null;
          if (wooProduct.manufacturer) {
            const existingManufacturer = await manufacturerRepo.findOne({
              where: { name: wooProduct.manufacturer },
            });

            if (existingManufacturer) {
              manufacturerId = existingManufacturer.id;
            }
          }

          let newImageUrls: string[] = [];
          if (wooProduct.image_url) {
            try {
              const imageResponse = await fetch(wooProduct.image_url);
              if (!imageResponse.ok)
                throw new Error(
                  `Failed to fetch image: ${imageResponse.statusText}`
                );

              const imageBuffer = Buffer.from(
                await imageResponse.arrayBuffer()
              );
              const fileName = `products/${uuidv4()}${path.extname(wooProduct.image_url)}`;

              const uploadResult = await uploadToS3(
                imageBuffer,
                fileName,
                imageResponse.headers.get('content-type') || 'image/jpeg'
              );

              newImageUrls = [uploadResult];
            } catch (imageError) {
              console.error('Błąd podczas pobierania zdjęcia:', imageError);
              // Kontynuuj import produktu nawet jeśli zdjęcie się nie pobierze
            }
          }

          const product = await queryRunner.manager.create(Product, {
            name: wooProduct.post_title,
            mainImage: mainImageUrl || '',
            galleryImages: galleryImageUrls,
            description: wooProduct.post_content,
            price: parseFloat(wooProduct.price || '0'),
            stock: parseInt(wooProduct.stock || '0'),
            marketplaces: {
              ownStore: {
                active: true,
                price: parseFloat(wooProduct.price || '0'),
                slug: wooProduct.slug,
                category_path: matchingCategory
                  ? `${matchingCategory.slug}/`
                  : undefined,
                seo: {
                  title:
                    this.capitalizeFirstLetter(wooProduct.post_title) +
                    ' - zamów teraz!',
                  description: '',
                  keywords: [],
                },
              },
            },

            condition: wooProduct.condition || 'nowy',
            manufacturer:
              wooProduct.manufacturer || wooProduct.post_title.split(' ')[0],
            manufacturerRelation: manufacturerId
              ? ({ id: manufacturerId } as Manufacturer)
              : undefined,
            power: {
              value: powerValue,
              range: '',
            },

            rpm: {
              value: rpmValue,
              range: '',
            },
            shaftDiameter: wooProduct.shaftDiameter || 0,
            mechanicalSize: wooProduct.mechanicalSize || 0,
            weight: wooProduct.weight || 0,
            flangeSize: wooProduct.flangeSize || 0,
            images: newImageUrls,
          });

          const savedProduct = await queryRunner.manager.save(Product, product);

          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('product_categories')
            .values({
              product_id: savedProduct.id,
              category_id: categoryToUse.id,
            })
            .execute();

          await queryRunner.commitTransaction();

          importedProducts.push(savedProduct);
        } catch (error) {
          console.error('Błąd podczas importu produktu:', error);
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }

      return importedProducts;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  async previewWooCommerce(): Promise<
    { wooProduct: WooProduct; mappedProduct: Partial<PreviewProduct> }[]
  > {
    try {
      const response = await fetch(
        'https://www.silniki-elektryczne.com.pl/wp-content/scripts/export-products.php'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as WooCommerceResponse;
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Błąd pobierania produktów');
      }

      const products = result.data;

      return products.map((wooProduct: WooProduct) => {
        const powerValue = wooProduct.power || '0';
        const rpmValue = wooProduct.rpm
          ? wooProduct.rpm.replace(' obr./min', '')
          : '0';
        const shaftMatch = wooProduct.post_content.match(
          /średnica wału:\s*(\d+)mm/
        );
        const sizeMatch = wooProduct.post_content.match(
          /wielkość mechaniczna:\s*(\d+)/
        );

        // Modyfikujemy tworzenie kategorii
        const categories: PreviewCategory[] = wooProduct.categories
          ? wooProduct.categories.split(',').map((name) => ({
              id: '',
              name: name.trim(),
              slug: this.generateSlug(name.trim()),
              description: '',
              order: 0,
              image: '',
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
              products: [],
            }))
          : [
              {
                id: '', // ID zostanie przypisane podczas importu
                name: 'Silniki Elektryczne',
                slug: 'silniki-elektryczne',
                description: '',
                order: 0,
                image: '',
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                products: [],
              },
            ];

        return {
          wooProduct,
          mappedProduct: {
            name: wooProduct.post_title,
            description: wooProduct.post_content,
            price: parseFloat(wooProduct.price || '0'),
            stock: parseInt(wooProduct.stock || '0', 10),
            marketplaces: {
              ownStore: {
                active: true,
                price: parseFloat(wooProduct.price || '0'),
                slug: this.generateSlug(wooProduct.post_title),
              },
            },
            condition: 'nowy',
            manufacturer: wooProduct.post_title.split(' ')[0],
            power: {
              value: powerValue,
              range: '',
            },
            rpm: {
              value: rpmValue,
              range: '',
            },
            shaftDiameter: shaftMatch ? parseFloat(shaftMatch[1]) : 0,
            mechanicalSize: sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
            images: wooProduct.image_url ? [wooProduct.image_url] : [],
            categories,
          },
        };
      });
    } catch (error) {
      console.error('Błąd podczas pobierania produktów:', error);
      throw error;
    }
  }

  async removeImage(id: string, imageIndex: number): Promise<void> {
    const product = await this.getProductById(id);
    product.images.splice(imageIndex, 1);
    await this.repository.save(product);
  }

  async decreaseStock(productId: string, quantity: number) {
    const product = await this.repository.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Produkt nie znaleziony');
    }

    if (product.stock < quantity) {
      throw new Error('Niewystarczająca ilość produktu');
    }

    product.stock -= quantity;
    await this.repository.save(product);

    // Jeśli stan spadł poniżej pewnego progu, możemy wysłać powiadomienie
    if (product.stock <= 5) {
      // TODO: Implementacja powiadomień o niskim stanie
    }

    return product;
  }

  async getProducts(
    filters: ProductFilters = {},
    pagination?: PaginationOptions
  ) {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where("product.marketplaces->'ownStore'->>'active' = 'true'")
      .andWhere("product.marketplaces->'ownStore' IS NOT NULL")
      .andWhere("product.marketplaces->'ownStore'->>'price' IS NOT NULL");

    // Wyszukiwanie po mocy lub tekście
    // Znajdź w getProducts() fragment parsowania mocy (około linii 2260-2300)
    if (filters.powerMin !== undefined && filters.powerMax !== undefined) {
      queryBuilder.andWhere(
        `(product.power->>'value' = '' OR 
     product.power->>'value' IS NULL OR
     product.power->>'value' !~ '^[0-9]' OR
     CASE
       WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
         CASE
           WHEN position('-' in product.power->>'value') > 0 THEN
             CAST(
               NULLIF(
                 REGEXP_REPLACE(
                   SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1), 
                   '[^0-9.]', '', 'g'
                 ), 
                 ''
               ) AS DECIMAL
             )
           WHEN position('/' in product.power->>'value') > 0 THEN
             CAST(
               NULLIF(
                 REGEXP_REPLACE(
                   SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '/', 1), 
                   '[^0-9.]', '', 'g'
                 ), 
                 ''
               ) AS DECIMAL
             )
           ELSE
             CAST(
               NULLIF(
                 REGEXP_REPLACE(
                   REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), 
                   '[^0-9.]', '', 'g'
                 ), 
                 ''
               ) AS DECIMAL
             )
         END
       ELSE NULL
     END BETWEEN :powerMin AND :powerMax)`,
        {
          powerMin: filters.powerMin,
          powerMax: filters.powerMax,
        }
      );
    }

    // RPM - analogiczna logika jak dla power
    if (filters.rpmMin !== undefined && filters.rpmMax !== undefined) {
      queryBuilder.andWhere(
        `(product.rpm->>'value' = '' OR CASE
      WHEN product.rpm->>'value' ~ '[0-9]' THEN
        CASE
          WHEN position('-' in product.rpm->>'value') > 0 THEN

            CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '-', 1), '[^0-9.]', '', 'g') AS DECIMAL)

          WHEN position('/' in product.rpm->>'value') > 0 THEN

            CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(product.rpm->>'value', ',', '.'), '/', 1), '[^0-9.]', '', 'g') AS DECIMAL)

          ELSE
            CAST(REGEXP_REPLACE(REPLACE(product.rpm->>'value', ',', '.'), '[^0-9.]', '', 'g') AS DECIMAL)
        END
      END BETWEEN :rpmMin AND :rpmMax)`,
        {
          rpmMin: filters.rpmMin,
          rpmMax: filters.rpmMax,
        }
      );
    }

    // Średnica wału
    if (
      filters.shaftDiameterMin !== undefined &&
      filters.shaftDiameterMax !== undefined
    ) {
      queryBuilder.andWhere(
        'product.shaftDiameter BETWEEN :shaftDiameterMin AND :shaftDiameterMax',
        {
          shaftDiameterMin: filters.shaftDiameterMin,
          shaftDiameterMax: filters.shaftDiameterMax,
        }
      );
    }

    // Średnica tulei
    if (
      filters.sleeveDiameterMin !== undefined &&
      filters.sleeveDiameterMax !== undefined
    ) {
      queryBuilder.andWhere(
        'product.sleeveDiameter BETWEEN :sleeveDiameterMin AND :sleeveDiameterMax',
        {
          sleeveDiameterMin: filters.sleeveDiameterMin,
          sleeveDiameterMax: filters.sleeveDiameterMax,
        }
      );
    }

    // Wielkość mechaniczna
    if (
      filters.mechanicalSizeMin !== undefined &&
      filters.mechanicalSizeMax !== undefined
    ) {
      queryBuilder.andWhere(
        'product.mechanicalSize BETWEEN :mechanicalSizeMin AND :mechanicalSizeMax',
        {
          mechanicalSizeMin: filters.mechanicalSizeMin,
          mechanicalSizeMax: filters.mechanicalSizeMax,
        }
      );
    }

    // Stan
    if (filters.condition) {
      queryBuilder.andWhere('product.condition = :condition', {
        condition: filters.condition,
      });
    }

    // Kategoria
    if (filters.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    // Producent
    if (filters.manufacturer) {
      queryBuilder.andWhere(
        'LOWER(product.manufacturer) LIKE LOWER(:manufacturer)',
        {
          manufacturer: `%${filters.manufacturer}%`,
        }
      );
    }

    // Dostępność w magazynie
    if (filters.inStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Sortowanie
    // Dla sortowania po mocy
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          queryBuilder.orderBy('product.price', 'ASC');
          break;
        case 'price_desc':
          queryBuilder.orderBy('product.price', 'DESC');
          break;
        case 'power_asc':
        case 'power_desc':
          // Dodajemy bardziej złożone przetwarzanie wartości mocy
          queryBuilder
            .addSelect(
              `CASE
          WHEN product.power->>'value' ~ '^[0-9,.]+\\s*kW?$' THEN
            REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.')::decimal
          WHEN product.power->>'value' ~ '^[0-9,.]+(-[0-9,.]+)?\\s*kW?$' THEN
            REPLACE(REPLACE(SPLIT_PART(product.power->>'value', '-', 1), ' kW', ''), ',', '.')::decimal
          WHEN product.power->>'value' ~ '^[0-9,.]+/[0-9,.]+\\s*kW?$' THEN
            REPLACE(REPLACE(SPLIT_PART(product.power->>'value', '/', 1), ' kW', ''), ',', '.')::decimal
          ELSE 0
        END`,
              'power_value'
            )
            .orderBy(
              'power_value',
              filters.sort === 'power_asc' ? 'ASC' : 'DESC'
            );
          break;
        default:
          queryBuilder.orderBy('product.createdAt', 'DESC');
      }
    }

    // Paginacja
    if (!filters.skipPagination && pagination) {
      const page = pagination.page || 0;
      const limit = pagination.limit || 20;
      queryBuilder.skip(page * limit).take(limit);
    }

    const [products, total] = await queryBuilder.getManyAndCount();

    const mappedProducts = products.map((product) => {
      // Upewnij się, że produkt ma wszystkie wymagane pola
      return {
        ...product,
        // Pobierz cenę z ownStore
        price: product.marketplaces?.ownStore?.price || product.price || 0,
        // Użyj mainImage lub pierwszego zdjęcia z tablicy images
        mainImage:
          product.mainImage ||
          (product.images && product.images.length > 0
            ? product.images[0]
            : ''),
        // Upewnij się, że slug istnieje
        slug: product.marketplaces?.ownStore?.slug || '',
        // Dodaj kategorię jeśli jej brakuje
        categories: product.categories || [],
      };
    });

    const productsWithImages = mappedProducts.filter(
      (p) => p.mainImage && p.mainImage !== ''
    );

    return {
      products,
      total,
      page: pagination?.page || 0,
      totalPages: pagination ? Math.ceil(total / pagination.limit) : 1,
    };
  }

  async getProductBySlug(
    categorySlug: string,
    productSlug: string
  ): Promise<Product> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where("product.marketplaces->'ownStore'->>'slug' = :productSlug", {
        productSlug,
      })
      .andWhere('category.slug = :categorySlug', { categorySlug });

    const product = await queryBuilder.getOne();

    if (!product) {
      throw new ApiError(404, 'Produkt nie został znaleziony');
    }

    return product;
  }

  // Pobieranie pojedynczego produktu po ID
  async getProductById(id: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
    });

    if (!product) {
      throw new ApiError(404, 'Produkt nie został znaleziony');
    }

    return product;
  }

  async addToCategory(productId: string, categoryId: string): Promise<Product> {
    const product = await this.getProductById(productId);
    const categoryRepo = AppDataSource.getTreeRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new ApiError(404, 'Kategoria nie została znaleziona');
    }

    if (!product.categories) {
      product.categories = [];
    }

    product.categories.push(category);
    return await this.repository.save(product);
  }

  async removeFromCategory(
    productId: string,
    categoryId: string
  ): Promise<Product> {
    const product = await this.getProductById(productId);

    if (!product.categories) {
      return product;
    }

    product.categories = product.categories.filter(
      (cat) => cat.id !== categoryId
    );
    return await this.repository.save(product);
  }

  private sanitizeProductData(productData: Partial<Product>): Partial<Product> {
    return {
      ...productData,
      name: productData.name?.trim(),
      price:
        typeof productData.price === 'string'
          ? parseFloat(productData.price)
          : productData.price,
      stock:
        typeof productData.stock === 'string'
          ? parseInt(productData.stock, 10)
          : productData.stock,
    };
  }

  async getPopularProducts(limit: number = 8): Promise<Product[]> {
    try {
      const orderRepository = AppDataSource.getRepository(Order);
      const productRepository = AppDataSource.getRepository(Product);

      const completedOrders = await orderRepository
        .createQueryBuilder('order')
        .where('order.status IN (:...statuses)', {
          statuses: ['paid', 'shipped', 'delivered'],
        })
        .getMany();

      // Jeśli nie ma zamówień, zwróć puste
      if (!completedOrders.length) {
        return [];
      }

      const productSalesMap = new Map<string, number>();

      completedOrders.forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            if (item.productId) {
              const currentCount = productSalesMap.get(item.productId) || 0;
              productSalesMap.set(
                item.productId,
                currentCount + (item.quantity || 1)
              );
            }
          });
        }
      });

      const sortedProductIds = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId]) => productId);

      if (!sortedProductIds.length) {
        return [];
      }

      const popularProducts = await productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'categories')
        .where('product.id IN (:...ids)', { ids: sortedProductIds })
        .getMany();

      // Sortujemy produkty zgodnie z kolejnością sprzedaży
      const sortedProducts = sortedProductIds
        .map((id) => popularProducts.find((product) => product.id === id))
        .filter((product): product is Product => product !== undefined);

      this.popularProductsCache = {
        products: sortedProducts,
        lastUpdate: new Date(),
      };

      return sortedProducts;
    } catch (error) {
      console.error('Error in getPopularProducts:', error);
      throw error;
    }
  }

  async getLatestProducts(limit: number = 8): Promise<Product[]> {
    try {
      const productRepository = AppDataSource.getRepository(Product);

      // Pobieramy produkty które mają mainImage
      const products = await productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'categories')
        .select([
          'product.id',
          'product.name',
          'product.mainImage', // używamy mainImage zamiast images
          'product.power',
          'product.rpm',
          'product.marketplaces',
          'product.stock',
          'product.createdAt',
          'categories.id',
          'categories.name',
          'categories.slug',
        ])
        .where('product.stock > 0')
        .andWhere('product.marketplaces IS NOT NULL')
        .andWhere("product.marketplaces->>'ownStore' IS NOT NULL")
        .andWhere("(product.marketplaces->>'ownStore')::jsonb->>'price' > '0'")
        .andWhere('product.mainImage IS NOT NULL') // dodajemy warunek na mainImage
        .orderBy('product.createdAt', 'DESC')
        .take(limit)
        .getMany();

      return products;
    } catch (error) {
      console.error('💥 Error in getLatestProducts:', error);
      throw error;
    }
  }

  async searchProductsWithFilters(
    query: string,
    filters: {
      powerMin?: number;
      powerMax?: number;
      rpmMin?: number;
      rpmMax?: number;
      shaftDiameterMin?: number;
      shaftDiameterMax?: number;
      manufacturer?: string;
      condition?: string;
      categorySlug?: string; // DODAJ TO
    },
    page: number = 0,
    limit: number = 20,
    sort: string = 'relevance'
  ) {
    try {
      const searchTerm = query.toLowerCase().trim();

      // Sprawdź czy to wyszukiwanie po mocy
      const powerMatch = searchTerm.match(/(\d+(?:[,.]\d+)?)\s*(?:kw)?/i);

      const queryBuilder = this.repository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        .where('product.stock > 0')
        .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'")
        .andWhere("product.marketplaces->'ownStore' IS NOT NULL")
        .andWhere("product.marketplaces->'ownStore'->>'price' IS NOT NULL");

      // Jeśli znaleziono moc w zapytaniu, szukaj przede wszystkim po mocy
      if (powerMatch) {
        const searchPower = parseFloat(powerMatch[1].replace(',', '.'));

        queryBuilder.andWhere(
          `(
          CASE
            WHEN product.power->>'value' IS NULL OR product.power->>'value' = '' THEN false
            WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', '.', '')) > 1 THEN false
            WHEN LENGTH(product.power->>'value') - LENGTH(REPLACE(product.power->>'value', ',', '')) > 1 THEN false
            WHEN product.power->>'value' !~ '^[0-9]' THEN false
            WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
              ABS(
                CAST(
                  CASE
                    WHEN product.power->>'value' LIKE '%-%' THEN
                      REGEXP_REPLACE(
                        SPLIT_PART(
                          REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                          '-',
                          1
                        ),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                    WHEN product.power->>'value' LIKE '%/%' THEN
                      REGEXP_REPLACE(
                        SPLIT_PART(
                          REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                          '/',
                          1
                        ),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                    ELSE
                      REGEXP_REPLACE(
                        REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                        '[^0-9.]',
                        '',
                        'g'
                      )
                  END AS DECIMAL
                ) - :searchPower
              ) <= :tolerance
            ELSE false
          END
        )`,
          {
            searchPower,
            tolerance: searchPower * 0.1, // 10% tolerancji
          }
        );
      } else {
        // Wyszukiwanie tekstowe
        queryBuilder.andWhere(
          `(
          LOWER(product.name) LIKE :search OR
          LOWER(product.manufacturer) LIKE :search OR
          LOWER(product.description) LIKE :search OR
          LOWER(category.name) LIKE :search
        )`,
          { search: `%${searchTerm}%` }
        );
      }

      // NOWE: Filtr kategorii
      if (filters.categorySlug) {
        queryBuilder.andWhere('category.slug = :categorySlug', {
          categorySlug: filters.categorySlug,
        });
      }

      // Dodaj filtry
      if (filters.powerMin !== undefined && filters.powerMax !== undefined) {
        queryBuilder.andWhere(
          `(
          CASE
            WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
              CAST(
                REGEXP_REPLACE(
                  SPLIT_PART(
                    REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                    '-',
                    1
                  ),
                  '[^0-9.]',
                  '',
                  'g'
                ) AS DECIMAL
              ) BETWEEN :powerMin AND :powerMax
            ELSE false
          END
        )`,
          { powerMin: filters.powerMin, powerMax: filters.powerMax }
        );
      }

      if (filters.rpmMin !== undefined && filters.rpmMax !== undefined) {
        queryBuilder.andWhere(
          `(
          CASE
            WHEN product.rpm->>'value' ~ '[0-9]' THEN
              CAST(
                REGEXP_REPLACE(
                  SPLIT_PART(
                    REPLACE(product.rpm->>'value', ',', '.'),
                    '/',
                    1
                  ),
                  '[^0-9.]',
                  '',
                  'g'
                ) AS DECIMAL
              ) BETWEEN :rpmMin AND :rpmMax
            ELSE false
          END
        )`,
          { rpmMin: filters.rpmMin, rpmMax: filters.rpmMax }
        );
      }

      if (
        filters.shaftDiameterMin !== undefined &&
        filters.shaftDiameterMax !== undefined
      ) {
        queryBuilder.andWhere(
          'product.shaftDiameter BETWEEN :shaftMin AND :shaftMax',
          {
            shaftMin: filters.shaftDiameterMin,
            shaftMax: filters.shaftDiameterMax,
          }
        );
      }

      if (filters.manufacturer) {
        queryBuilder.andWhere(
          'LOWER(product.manufacturer) = LOWER(:manufacturer)',
          {
            manufacturer: filters.manufacturer,
          }
        );
      }

      if (filters.condition) {
        queryBuilder.andWhere('product.condition = :condition', {
          condition: filters.condition,
        });
      }

      // Dodaj scoring dla lepszego sortowania wyników
      queryBuilder
        .addSelect(
          `(
          CASE
            WHEN LOWER(product.name) = :exactSearch THEN 100
            WHEN LOWER(product.name) LIKE :exactSearch THEN 95
            WHEN LOWER(product.name) LIKE :startSearch THEN 90
            WHEN LOWER(product.manufacturer) = :searchExact THEN 80
            WHEN LOWER(product.manufacturer) LIKE :startSearch THEN 70
            WHEN LOWER(product.name) LIKE :search THEN 60
            WHEN LOWER(product.manufacturer) LIKE :search THEN 50
            WHEN LOWER(product.description) LIKE :search THEN 30
            WHEN LOWER(category.name) LIKE :search THEN 20
            ELSE 0
          END
        )`,
          'relevance_score'
        )
        .setParameter('exactSearch', searchTerm)
        .setParameter('searchExact', searchTerm)
        .setParameter('startSearch', `${searchTerm}%`)
        .setParameter('search', `%${searchTerm}%`);

      // Sortowanie
      switch (sort) {
        case 'price_asc':
          queryBuilder
            .addSelect(
              `COALESCE(
          CAST(product.marketplaces->'ownStore'->>'price' AS DECIMAL),
          product.price
        )`,
              'actual_price'
            )
            .orderBy('actual_price', 'ASC', 'NULLS LAST');
          break;

        case 'price_desc':
          queryBuilder
            .addSelect(
              `COALESCE(
          CAST(product.marketplaces->'ownStore'->>'price' AS DECIMAL),
          product.price
        )`,
              'actual_price'
            )
            .orderBy('actual_price', 'DESC', 'NULLS LAST');
          break;

        case 'power_asc':
          queryBuilder
            .addSelect(
              `CASE
          WHEN product.power->>'value' ~ '^[0-9]' THEN
            CAST(
              REGEXP_REPLACE(
                REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                '[^0-9.]',
                '',
                'g'
              ) AS DECIMAL
            )
          ELSE 999999
        END`,
              'power_sort_value' // ✅ DODAJ ALIAS!
            )
            .orderBy('power_sort_value', 'ASC');
          break;

        case 'power_desc':
          queryBuilder
            .addSelect(
              `CASE
          WHEN product.power->>'value' ~ '^[0-9]' THEN
            CAST(
              REGEXP_REPLACE(
                REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'),
                '[^0-9.]',
                '',
                'g'
              ) AS DECIMAL
            )
          ELSE 0
        END`,
              'power_sort_value' // ✅ DODAJ ALIAS!
            )
            .orderBy('power_sort_value', 'DESC');
          break;

        case 'newest':
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;

        case 'relevance':
        default:
          queryBuilder
            .orderBy('relevance_score', 'DESC')
            .addOrderBy('product.viewCount', 'DESC')
            .addOrderBy('product.purchaseCount', 'DESC');
          break;
      }

      // Dodaj stabilne sortowanie po ID
      queryBuilder.addOrderBy('product.id', 'ASC');

      // Pobierz całkowitą liczbę wyników
      const totalQuery = queryBuilder.clone();
      const total = await totalQuery.getCount();

      // Zastosuj paginację
      queryBuilder.skip(page * limit).take(limit);

      const products = await queryBuilder.getMany();

      // Zbierz sugestie kategorii i producentów - ULEPSZONE
      const categoriesMap = new Map<
        string,
        { name: string; slug: string; count: number }
      >();
      const manufacturers = new Set<string>();

      // Pobierz wszystkie produkty dla sugestii (bez paginacji)
      const allProductsForSuggestions = await totalQuery.getMany();

      allProductsForSuggestions.forEach((product) => {
        product.categories?.forEach((cat) => {
          const existing = categoriesMap.get(cat.slug) || {
            name: cat.name,
            slug: cat.slug,
            count: 0,
          };
          categoriesMap.set(cat.slug, {
            ...existing,
            count: existing.count + 1,
          });
        });
        if (product.manufacturer) manufacturers.add(product.manufacturer);
      });

      return {
        products,
        total,
        suggestions: {
          categories: Array.from(categoriesMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10), // Zwróć top 10 kategorii
          manufacturers: Array.from(manufacturers).sort().slice(0, 10),
        },
      };
    } catch (error) {
      console.error('Błąd wyszukiwania z filtrami:', error);
      return {
        products: [],
        total: 0,
        suggestions: { categories: [], manufacturers: [] },
      };
    }
  }

  async bulkUpdatePrices(
    filters: {
      categoryId?: string;
      powerMin?: number;
      powerMax?: number;
      condition?: 'nowy' | 'uzywany' | 'nieuzywany';
    },
    priceChange: {
      type: 'percentage' | 'fixed';
      percentage?: number;
      amount?: number;
    }
  ): Promise<{ updatedCount: number; products: Product[] }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buduj zapytanie z filtrami
      let queryBuilder = this.repository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        .where("product.marketplaces->'ownStore' IS NOT NULL")
        .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'");

      // Filtr kategorii
      if (filters.categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', {
          categoryId: filters.categoryId,
        });
      }

      // Filtr mocy
      if (filters.powerMin !== undefined || filters.powerMax !== undefined) {
        const powerCondition = `
        CASE
          WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
            CAST(
              REGEXP_REPLACE(
                SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1),
                '[^0-9.]', '', 'g'
              ) AS DECIMAL
            )
          ELSE NULL
        END
      `;

        if (filters.powerMin !== undefined && filters.powerMax !== undefined) {
          queryBuilder.andWhere(
            `${powerCondition} BETWEEN :powerMin AND :powerMax`,
            {
              powerMin: filters.powerMin,
              powerMax: filters.powerMax,
            }
          );
        } else if (filters.powerMin !== undefined) {
          queryBuilder.andWhere(`${powerCondition} >= :powerMin`, {
            powerMin: filters.powerMin,
          });
        } else if (filters.powerMax !== undefined) {
          queryBuilder.andWhere(`${powerCondition} <= :powerMax`, {
            powerMax: filters.powerMax,
          });
        }
      }

      // Filtr stanu
      if (filters.condition) {
        queryBuilder.andWhere('product.condition = :condition', {
          condition: filters.condition,
        });
      }

      // Pobierz produkty do aktualizacji
      const products = await queryBuilder.getMany();

      // Aktualizuj ceny
      for (const product of products) {
        const currentPrice =
          product.marketplaces?.ownStore?.price || product.price;
        let newPrice: number;

        if (
          priceChange.type === 'percentage' &&
          priceChange.percentage !== undefined
        ) {
          // Zmiana procentowa
          newPrice = currentPrice * (1 + priceChange.percentage / 100);
        } else if (
          priceChange.type === 'fixed' &&
          priceChange.amount !== undefined
        ) {
          // Zmiana o stałą kwotę
          newPrice = currentPrice + priceChange.amount;
        } else {
          continue;
        }

        // Zaokrąglij do 2 miejsc po przecinku
        newPrice = this.roundToMarketingPrice(newPrice);

        // Upewnij się, że cena nie jest ujemna
        if (newPrice < 0) newPrice = 0;

        // Aktualizuj cenę w marketplace.ownStore
        await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({
            marketplaces: () => `
            jsonb_set(
              marketplaces,
              '{ownStore,price}',
              '${newPrice}'::jsonb
            )
          `,
            price: newPrice,
          })
          .where('id = :id', { id: product.id })
          .execute();
      }

      await queryRunner.commitTransaction();

      return {
        updatedCount: products.length,
        products,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async getProductsForPriceUpdate(filters: {
    categoryId?: string;
    powerMin?: number;
    powerMax?: number;
    condition?: 'nowy' | 'uzywany' | 'nieuzywany';
  }): Promise<Product[]> {
    let queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where("product.marketplaces->'ownStore' IS NOT NULL")
      .andWhere("product.marketplaces->'ownStore'->>'active' = 'true'");

    // Filtr kategorii
    if (filters.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    // Filtr mocy
    if (filters.powerMin !== undefined || filters.powerMax !== undefined) {
      const powerCondition = `
      CASE
        WHEN product.power->>'value' ~ '^[0-9]+([.,][0-9]+)?(-[0-9]+([.,][0-9]+)?)?\\s*(kW)?$' THEN
          CAST(
            REGEXP_REPLACE(
              SPLIT_PART(REPLACE(REPLACE(product.power->>'value', ' kW', ''), ',', '.'), '-', 1),
              '[^0-9.]', '', 'g'
            ) AS DECIMAL
          )
        ELSE NULL
      END
    `;

      if (filters.powerMin !== undefined && filters.powerMax !== undefined) {
        queryBuilder.andWhere(
          `${powerCondition} BETWEEN :powerMin AND :powerMax`,
          {
            powerMin: filters.powerMin,
            powerMax: filters.powerMax,
          }
        );
      } else if (filters.powerMin !== undefined) {
        queryBuilder.andWhere(`${powerCondition} >= :powerMin`, {
          powerMin: filters.powerMin,
        });
      } else if (filters.powerMax !== undefined) {
        queryBuilder.andWhere(`${powerCondition} <= :powerMax`, {
          powerMax: filters.powerMax,
        });
      }
    }

    // Filtr stanu
    if (filters.condition) {
      queryBuilder.andWhere('product.condition = :condition', {
        condition: filters.condition,
      });
    }

    return await queryBuilder.getMany();
  }

  private roundToMarketingPrice(price: number): number {
    // Zaokrąglij do pełnych złotych
    const rounded = Math.round(price);

    // Pobierz ostatnią cyfrę
    const lastDigit = rounded % 10;

    // Zaokrąglij do najbliższej końcówki 5 lub 9
    let adjustedPrice: number;

    if (lastDigit <= 2) {
      // 0,1,2 -> końcówka 5 w dół (np. 101 -> 95, 102 -> 95)
      adjustedPrice = Math.floor(rounded / 10) * 10 - 5;
      if (adjustedPrice < 0) adjustedPrice = 5;
    } else if (lastDigit <= 5) {
      // 3,4,5 -> końcówka 5
      adjustedPrice = Math.floor(rounded / 10) * 10 + 5;
    } else if (lastDigit <= 8) {
      // 6,7,8 -> końcówka 9
      adjustedPrice = Math.floor(rounded / 10) * 10 + 9;
    } else {
      // 9 -> zostaw 9
      adjustedPrice = rounded;
    }

    return adjustedPrice;
  }
}

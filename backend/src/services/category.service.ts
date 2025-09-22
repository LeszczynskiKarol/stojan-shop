// backend/src/services/category.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { ApiError } from '../utils/apiError';
import { Product } from '../entities/Product';

export class CategoryService {
  private repository: Repository<Category>; // zmiana z TreeRepository na Repository

  constructor() {
    this.repository = AppDataSource.getRepository(Category); // zmiana z getTreeRepository na getRepository
  }

  async getAll() {
    try {
      const categories = await this.repository.find(); // zmiana z findTrees() na find()
      return categories || [];
    } catch (error) {
      console.error('Błąd podczas pobierania kategorii:', error);
      throw new ApiError(500, 'Błąd podczas pobierania kategorii');
    }
  }

  async getById(id: string) {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) throw new ApiError(404, 'Kategoria nie została znaleziona');
    return category;
  }

  async create(data: Partial<Category>) {
    try {
      const category = this.repository.create({
        ...data,
        productFilters: data.productFilters,
      });

      const savedCategory = await this.repository.save(category);

      if (
        data.productFilters?.powerRange ||
        data.productFilters?.specificCategories?.length
      ) {
        const queryBuilder = AppDataSource.getRepository(Product)
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.categories', 'categories');

        if (data.productFilters?.powerRange) {
          const powerMin = parseFloat(data.productFilters.powerRange.min);
          const powerMax = parseFloat(data.productFilters.powerRange.max);

          queryBuilder.andWhere(
            `
                    CASE
                        WHEN product.power->>'value' ~ '[0-9]' THEN
                            CASE
                                WHEN position('-' in product.power->>'value') > 0 THEN
                                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(product.power->>'value', 'kW', ''), ',', '.'), '-', 1), '[^0-9.]', '', 'g') AS DECIMAL)
                                WHEN position('/' in product.power->>'value') > 0 THEN
                                    CAST(REGEXP_REPLACE(SPLIT_PART(REPLACE(REPLACE(product.power->>'value', 'kW', ''), ',', '.'), '/', 1), '[^0-9.]', '', 'g') AS DECIMAL)
                                ELSE
                                    CAST(REGEXP_REPLACE(REPLACE(REPLACE(product.power->>'value', 'kW', ''), ',', '.'), '[^0-9.]', '', 'g') AS DECIMAL)
                            END BETWEEN :powerMin AND :powerMax
                    END`,
            { powerMin, powerMax }
          );
        }

        if (data.productFilters?.specificCategories?.length) {
          queryBuilder.andWhere('categories.slug IN (:...slugs)', {
            slugs: data.productFilters.specificCategories,
          });
        }

        const products = await queryBuilder.getMany();

        if (products.length > 0) {
          await AppDataSource.createQueryBuilder()
            .insert()
            .into('product_categories')
            .values(
              products.map((product) => ({
                product_id: product.id,
                category_id: savedCategory.id,
              }))
            )
            .execute();
        }
      }

      return savedCategory;
    } catch (error) {
      console.error('11. BŁĄD podczas tworzenia kategorii:', error);
      throw new ApiError(500, 'Błąd podczas tworzenia kategorii');
    }
  }

  async update(id: string, data: Partial<Category>) {
    const category = await this.getById(id);

    Object.assign(category, data);

    return await this.repository.save(category);
  }

  async delete(id: string) {
    try {
      const category = await this.getById(id);

      // Najpierw usuwamy powiązania z produktami
      await AppDataSource.createQueryBuilder()
        .delete()
        .from('product_categories')
        .where('category_id = :id', { id })
        .execute();

      // Potem usuwamy kategorię
      await this.repository.remove(category);

      return { success: true };
    } catch (error) {
      console.error('Błąd podczas usuwania kategorii:', error);
      throw new ApiError(500, 'Błąd podczas usuwania kategorii');
    }
  }

  async getBySlug(slug: string) {
    if (!slug) {
      throw new ApiError(404, 'Nie podano sluga kategorii');
    }
    const category = await this.repository.findOne({
      where: { slug },
    });

    return category;
  }

  async findBySlug(slug: string) {
    return await this.repository.findOne({ where: { slug } });
  }
}

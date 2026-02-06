// backend/src/controllers/category.controller.ts
import { Request, Response, RequestHandler } from 'express';
import { AppDataSource } from '../config/database';
import { Repository } from 'typeorm';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export class CategoryController {
  private categoryService: CategoryService;
  private productService: ProductService;
  private repository: Repository<Category>;

  constructor() {
    this.categoryService = new CategoryService();
    this.productService = new ProductService(); // zainicjalizuj w konstruktorze
    this.repository = AppDataSource.getRepository(Category);
  }

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const slug = req.params.categorySlug || req.params.slug;

      if (!slug || slug === 'favicon.ico') {
        res.status(204).end();
        return;
      }

      const category = await this.categoryService.getBySlug(slug);

      // Check if category is null
      if (!category) {
        res.status(404).json(ApiResponse.error('Category not found'));
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { products, total } =
        await this.productService.getProductsByCategory(category.id, {
          page,
          limit,
          sort: req.query.sort,
          powerMin: req.query.powerMin,
          powerMax: req.query.powerMax,
          rpmMin: req.query.rpmMin,
          rpmMax: req.query.rpmMax,
          shaftDiameterMin: req.query.shaftDiameterMin,
          shaftDiameterMax: req.query.shaftDiameterMax,
        });

      res.json(
        ApiResponse.success({
          ...category,
          products,
          totalProducts: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        })
      );
    } catch (error) {
      console.error('CategoryController błąd:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(ApiResponse.error(error.message));
      } else {
        res
          .status(500)
          .json(ApiResponse.error('Błąd podczas pobierania kategorii'));
      }
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = await this.categoryService.getById(req.params.id);
      res.json(ApiResponse.success(category));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(ApiResponse.error(error.message));
      } else {
        res
          .status(500)
          .json(ApiResponse.error('Błąd podczas pobierania kategorii'));
      }
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryService.getAll();
      res.json(ApiResponse.success(categories));
    } catch (error) {
      console.error('Błąd podczas pobierania kategorii:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania kategorii'));
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, description, metadata, productFilters } = req.body;

      if (!name || !slug) {
        res.status(400).json(ApiResponse.error('Nazwa i URL są wymagane'));
        return;
      }

      const existingCategory = await this.categoryService.findBySlug(slug);

      if (existingCategory) {
        res
          .status(400)
          .json(ApiResponse.error('Kategoria o takim URL już istnieje'));
        return;
      }

      const category = await this.categoryService.create({
        name,
        slug,
        description,
        productFilters,
        metadata: {
          title: metadata?.title || name,
          description: metadata?.description || '',
          keywords: metadata?.keywords || [],
        },
      });

      res
        .status(201)
        .json(ApiResponse.success(category, 'Kategoria została utworzona'));
    } catch (error) {
      console.error('8. BŁĄD:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas tworzenia kategorii'));
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = await this.categoryService.update(
        req.params.id,
        req.body
      );
      res.json(
        ApiResponse.success(category, 'Kategoria została zaktualizowana')
      );
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas aktualizacji kategorii'));
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.categoryService.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Kategoria została usunięta'));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas usuwania kategorii'));
    }
  };

  public getCategoryRanges = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;

      // Specjalna obsługa dla search-results
      if (categoryId === 'search-results') {
        const ranges = await this.productService.getParameterRanges();
        res.json(ApiResponse.success(ranges));
        return;
      }

      const ranges = await this.productService.getCategoryRanges(categoryId);
      res.json(ApiResponse.success(ranges));
    } catch (error) {
      console.error('Błąd podczas pobierania zakresów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania zakresów'));
    }
  };

  public getAvailableRpmValues: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;

      // Specjalna obsługa dla strony wyszukiwania
      if (categoryId === 'search-results') {
        // Dla wyszukiwania zwróć pustą tablicę - wartości RPM będą pobrane z globalnych zakresów
        res.json(ApiResponse.success([]));
        return;
      }

      const queryBuilder = this.repository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.products', 'product')
        .where('category.id = :categoryId', { categoryId })
        .andWhere('product.stock > 0');

      const category = await queryBuilder.getOne();

      if (!category) {
        res.status(404).json(ApiResponse.error('Kategoria nie znaleziona'));
        return;
      }

      // Bezpieczne typowanie dla produktów
      const products = category.products || [];
      const uniqueRpmValues = Array.from(
        new Set(
          products
            .map((product: Product) => {
              const rpmValue = Number(product.rpm.value);
              return isNaN(rpmValue) ? null : rpmValue;
            })
            .filter((value): value is number => value !== null)
        )
      ).sort((a: number, b: number) => a - b);

      res.json(ApiResponse.success(uniqueRpmValues));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania dostępnych obrotów'));
    }
  };
}

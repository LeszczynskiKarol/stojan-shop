// backend/src/controllers/product.controller.ts
import { ProductService } from '../services/product.service';
import { GoogleMerchantService } from '../services/google-merchant.service';
import { AllegroService } from '../services/allegro.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { AppDataSource } from '../config/database';
import { UploadService } from '../services/upload.service';
import { Product } from '../entities/Product';
import { RequestHandler, Request, Response } from 'express';

const productService = new ProductService();

interface ProductFilters {
  powerMin?: number;
  powerMax?: number;
  rpmMin?: number;
  rpmMax?: number;
  shaftDiameterMin?: number;
  shaftDiameterMax?: number;
  sleeveDiameterMin?: number;
  sleeveDiameterMax?: number;
  mechanicalSizeMin?: number;
  mechanicalSizeMax?: number;
  manufacturer?: string;
  condition?: 'nowy' | 'uzywany';
  inStock: boolean;
  categoryId?: string;
  sort?: string;
  search?: string;
  productType?: string[];
}

export class ProductController {
  private productService: ProductService;
  private googleMerchantService: GoogleMerchantService;

  constructor() {
    this.productService = new ProductService();
    this.googleMerchantService = new GoogleMerchantService();

    // Bindowanie wszystkich metod
    this.getAllProducts = this.getAllProducts.bind(this);
    this.getProductBySlug = this.getProductBySlug.bind(this);
    this.getManufacturers = this.getManufacturers.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.getProductsForAdmin = this.getProductsForAdmin.bind(this);
    this.importFromWooCommerce = this.importFromWooCommerce.bind(this);
    this.previewWooCommerce = this.previewWooCommerce.bind(this);
    this.getRanges = this.getRanges.bind(this);
    this.getGoogleMerchantFeed = this.getGoogleMerchantFeed.bind(this);
    this.getSimilarProducts = this.getSimilarProducts.bind(this);
    this.search = this.search.bind(this);
    this.getSearchSuggestions = this.getSearchSuggestions.bind(this);
    this.getByCategoryId = this.getByCategoryId.bind(this);
    this.getManufacturersForCategory =
      this.getManufacturersForCategory.bind(this);
    this.getProductTypesForCategory =
      this.getProductTypesForCategory.bind(this);
    this.getPopularProducts = this.getPopularProducts.bind(this);
    this.getLatestProducts = this.getLatestProducts.bind(this);
    this.checkStock = this.checkStock.bind(this);
    this.reserveProduct = this.reserveProduct.bind(this);
    this.cancelReservation = this.cancelReservation.bind(this);
    this.validateReservation = this.validateReservation.bind(this);
    this.handleReservationEvents = this.handleReservationEvents.bind(this);
    this.updateMarketplace = this.updateMarketplace.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
    this.addToCategory = this.addToCategory.bind(this);
    this.removeFromCategory = this.removeFromCategory.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.getAvailableRpmValues = this.getAvailableRpmValues.bind(this);
    this.getProductsWithRpmValues = this.getProductsWithRpmValues.bind(this);
    this.bulkPriceUpdate = this.bulkPriceUpdate.bind(this);
    this.bulkPricePreview = this.bulkPricePreview.bind(this);
    this.getUnlinkedCount = this.getUnlinkedCount.bind(this);
  }

  async createProduct(req: Request, res: Response) {
    const product = await productService.createProduct(req.body);
    res
      .status(201)
      .json(ApiResponse.success(product, 'Produkt został utworzony'));
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body
      );
      res.json(ApiResponse.success(product, 'Produkt został zaktualizowany'));
    } catch (error) {
      console.error('Błąd podczas aktualizacji produktu:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas aktualizacji produktu'));
    }
  }

  public reserveProduct: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const result = await this.productService.reserveTemporary(id, quantity);

      res.json(
        ApiResponse.success({
          reservationId: result.data.reservationId,
          message: 'Produkt został zarezerwowany',
        })
      );
    } catch (error) {
      next(error);
    }
  };

  private parseProductType(value: any): string[] {
    if (!value) return [];

    if (typeof value === 'string') {
      // Jak przychodzi jako string, to albo jest pojedynczy typ albo CSV
      return value.includes(',') ? value.split(',') : [value];
    }

    if (Array.isArray(value)) {
      return value.map(String);
    }

    // Jak nic z powyższych to próbujemy zrobić string i dać jako jeden element
    return [String(value)];
  }

  public handleReservationEvents: RequestHandler = async (req, res) => {
    let heartbeat: NodeJS.Timeout | undefined;

    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Wysyłamy inicjalny event
      res.write('event: connected\ndata: {}\n\n');

      // Dodajemy heartbeat co 30 sekund
      heartbeat = setInterval(() => {
        res.write('event: ping\ndata: {}\n\n');
      }, 30000);

      const handleReservationExpired = (data: {
        productId: string;
        reservationId: string;
      }) => {
        res.write(
          `event: reservation\ndata: ${JSON.stringify({
            type: 'reservationExpired',
            ...data,
          })}\n\n`
        );
      };

      this.productService.onReservationExpired(handleReservationExpired);

      req.on('close', () => {
        if (heartbeat) {
          clearInterval(heartbeat);
        }
        this.productService.removeReservationExpiredListener(
          handleReservationExpired
        );
        res.end();
      });
    } catch (error) {
      console.error('SSE Error:', error);
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      res.status(500).end();
    }
  };

  public cancelReservation: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Sprawdzamy czy body jest stringiem (z sendBeacon)
      let reservationId, quantity;
      if (typeof req.body === 'string') {
        const parsedBody = JSON.parse(req.body);
        reservationId = parsedBody.reservationId;
        quantity = parsedBody.quantity;
      } else {
        // Standardowa obsługa dla zwykłych requestów
        reservationId = req.body.reservationId;
        quantity = req.body.quantity;
      }

      if (!reservationId) {
        console.log('Brak reservationId w:', req.body);
        throw new ApiError(400, 'Brak ID rezerwacji');
      }

      const parsedQuantity = parseInt(quantity?.toString() || '0');
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        console.log('Nieprawidłowa ilość:', quantity, typeof quantity);
        throw new ApiError(400, 'Nieprawidłowa ilość produktu');
      }

      // Najpierw sprawdźmy czy produkt istnieje
      const product = await this.productService.getProductById(id);
      if (!product) {
        throw new ApiError(404, 'Produkt nie został znaleziony');
      }

      const result = await this.productService.cancelReservation(
        id,
        reservationId,
        parsedQuantity
      );

      if (!result || !result.data) {
        throw new ApiError(500, 'Błąd podczas anulowania rezerwacji');
      }

      res.json(
        ApiResponse.success({
          message: 'Rezerwacja została anulowana',
          stock: result.data.stock,
        })
      );
    } catch (error) {
      console.error('Błąd w cancelReservation:', error);
      next(error);
    }
  };

  public validateReservation: RequestHandler = async (req, res) => {
    try {
      const { productId, reservationId } = req.params;
      const reservation =
        await this.productService.getReservation(reservationId);

      res.json({
        valid:
          !!reservation &&
          reservation.productId === productId &&
          reservation.isActive,
      });
    } catch (error) {
      res.status(500).json({ valid: false });
    }
  };

  public getProductBySlug: RequestHandler = async (
    req,
    res,
    next
  ): Promise<void> => {
    try {
      const { categorySlug, productSlug } = req.params;

      if (productSlug === '.well-known/traffic-advice') {
        res.status(404).json({
          success: false,
          message: 'Not found',
        });
        return;
      }

      const product = await this.productService.getProductBySlug(
        categorySlug,
        productSlug
      );

      res.json(ApiResponse.success(product));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      console.error('Błąd w getProductBySlug:', error);
      next(error);
    }
  };

  public getManufacturers: RequestHandler = async (req, res) => {
    try {
      const manufacturers = await this.productService.getUniqueManufacturers();
      res.json(ApiResponse.success(manufacturers));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania producentów'));
    }
  };

  async getAllProducts(req: Request, res: Response) {
    try {
      const filters: ProductFilters = {
        powerMin: req.query.powerMin
          ? parseFloat(req.query.powerMin as string)
          : undefined,
        powerMax: req.query.powerMax
          ? parseFloat(req.query.powerMax as string)
          : undefined,
        rpmMin: req.query.rpmMin
          ? parseFloat(req.query.rpmMin as string)
          : undefined,
        rpmMax: req.query.rpmMax
          ? parseFloat(req.query.rpmMax as string)
          : undefined,
        shaftDiameterMin: req.query.shaftDiameterMin
          ? parseFloat(req.query.shaftDiameterMin as string)
          : undefined,
        shaftDiameterMax: req.query.shaftDiameterMax
          ? parseFloat(req.query.shaftDiameterMax as string)
          : undefined,
        sleeveDiameterMin: req.query.sleeveDiameterMin
          ? parseFloat(req.query.sleeveDiameterMin as string)
          : undefined,
        sleeveDiameterMax: req.query.sleeveDiameterMax
          ? parseFloat(req.query.sleeveDiameterMax as string)
          : undefined,
        mechanicalSizeMin: req.query.mechanicalSizeMin
          ? parseFloat(req.query.mechanicalSizeMin as string)
          : undefined,
        mechanicalSizeMax: req.query.mechanicalSizeMax
          ? parseFloat(req.query.mechanicalSizeMax as string)
          : undefined,
        manufacturer: req.query.manufacturer as string,
        condition: req.query.condition as 'nowy' | 'uzywany' | undefined,
        inStock: req.query.inStock === 'true',
        categoryId: req.query.categoryId as string,
        sort: req.query.sort as string,
        search: req.query.search as string,
        productType: this.parseProductType(req.query.productType),
      };

      const pagination = {
        page: Math.max(0, parseInt(req.query.page as string) || 0),
        limit: parseInt(req.query.limit as string) || 12,
      };

      const result = await this.productService.getProducts(filters, pagination);

      res.json(ApiResponse.success(result));
    } catch (error) {
      console.error('Błąd podczas pobierania produktów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania produktów'));
    }
  }

  public getProductById: RequestHandler = async (req, res, next) => {
    try {
      const id = req.params.id;
      const isAllegroId = /^\d+$/.test(id);

      if (isAllegroId) {
        const allegroService = new AllegroService();
        const allegroProduct = await allegroService.getOfferById(id);
        res.json(ApiResponse.success(allegroProduct));
      } else {
        const product = await this.productService.getProductById(id);
        res.json(ApiResponse.success(product));
      }
    } catch (error) {
      console.error('Błąd podczas pobierania produktu:', error);
      next(error);
    }
  };

  async addToCategory(req: Request, res: Response) {
    try {
      const { productId, categoryId } = req.params;
      const product = await productService.addToCategory(productId, categoryId);
      res.json(
        ApiResponse.success(product, 'Produkt został dodany do kategorii')
      );
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas dodawania do kategorii'));
    }
  }

  async removeFromCategory(req: Request, res: Response) {
    try {
      const { productId, categoryId } = req.params;
      const product = await productService.removeFromCategory(
        productId,
        categoryId
      );
      res.json(
        ApiResponse.success(product, 'Produkt został usunięty z kategorii')
      );
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas usuwania z kategorii'));
    }
  }

  async deleteProduct(req: Request, res: Response) {
    await productService.deleteProduct(req.params.id);
    res.json(ApiResponse.success(null, 'Produkt został usunięty'));
  }

  public updateMarketplace: RequestHandler = async (req, res, next) => {
    try {
      const { id, marketplace } = req.params;

      if (!['allegro', 'olx', 'ownStore'].includes(marketplace)) {
        res
          .status(400)
          .json(ApiResponse.error('Nieprawidłowy typ marketplace'));
        return;
      }

      const product = await productService.updateMarketplace(
        id,
        marketplace as 'allegro' | 'olx' | 'ownStore',
        req.body
      );

      res.json(
        ApiResponse.success(product, 'Marketplace został zaktualizowany')
      );
    } catch (error) {
      next(error);
    }
  };

  public uploadImages: RequestHandler = async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { id } = req.params;

      if (!files || files.length === 0) {
        res.status(400).json(ApiResponse.error('Nie przesłano żadnych plików'));
        return;
      }

      // Pobierz nazwę produktu
      const product = await this.productService.getProductById(id);

      const uploadService = new UploadService();
      const uploadPromises = files.map((file) =>
        uploadService.uploadImage(file, product.name)
      );
      const imageUrls = await Promise.all(uploadPromises);

      const updatedProduct = await this.productService.addImages(id, imageUrls);
      res.json(ApiResponse.success(updatedProduct));
    } catch (error) {
      next(error);
    }
  };

  async deleteImage(req: Request, res: Response) {
    const { id, imageIndex } = req.params;

    try {
      const uploadService = new UploadService();
      const product = await productService.getProductById(id);
      const imageUrl = product.images[parseInt(imageIndex)];

      await uploadService.deleteImage(imageUrl);
      await productService.removeImage(id, parseInt(imageIndex));

      res.json(ApiResponse.success(null, 'Zdjęcie zostało usunięte'));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Błąd podczas usuwania zdjęcia'));
    }
  }

  public getProductsForAdmin: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const page = Math.max(0, parseInt(req.query.page as string) || 0);
      const limit = parseInt(req.query.limit as string) || 20;
      const sortField = req.query.sortField as string;
      const sortDirection = req.query.sortDirection as 'asc' | 'desc';
      const search = req.query.search as string;
      const unlinkedOnly = req.query.unlinked === 'true'; // Zmień nazwę z 'unlinked' na 'unlinkedOnly'

      const result = await this.productService.getProductsForAdmin({
        page,
        limit,
        sortField,
        sortDirection,
        search,
        unlinkedOnly, // Zmień z 'unlinked' na 'unlinkedOnly'
      });

      res.json(
        ApiResponse.success({
          products: result.products,
          total: result.total,
          page,
          totalPages: Math.ceil(result.total / limit),
        })
      );
    } catch (error) {
      console.error('Błąd podczas pobierania produktów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania produktów'));
    }
  };

  private calculateSearchRelevance(
    product: Product,
    searchTerm: string
  ): number {
    const searchLower = searchTerm.toLowerCase();
    let score = 0;

    if (product.name.toLowerCase().includes(searchLower)) score += 3;
    if (product.manufacturer.toLowerCase().includes(searchLower)) score += 2;
    if (product.description?.toLowerCase().includes(searchLower)) score += 1;

    return score;
  }

  public importFromWooCommerce = async (req: Request, res: Response) => {
    try {
      const { productIds } = req.body;

      if (
        !productIds ||
        !Array.isArray(productIds) ||
        productIds.length === 0
      ) {
        throw new Error('Nie wybrano produktów do importu');
      }

      const products =
        await this.productService.importFromWooCommerce(productIds);
      res.json(ApiResponse.success(products));
    } catch (error) {
      console.error('Import error:', error);
      res
        .status(500)
        .json(
          ApiResponse.error(
            error instanceof Error ? error.message : 'Import failed'
          )
        );
    }
  };

  public previewWooCommerce = async (req: Request, res: Response) => {
    try {
      const products = await this.productService.previewWooCommerce();

      res.json(ApiResponse.success(products));
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json(ApiResponse.error('Preview failed'));
    }
  };

  public getRanges: RequestHandler = async (req, res) => {
    try {
      const ranges = await this.productService.getParameterRanges();
      res.json(ApiResponse.success(ranges));
    } catch (error) {
      console.error('Błąd podczas pobierania zakresów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania zakresów parametrów'));
    }
  };

  public getSimilarProducts: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 4;

      const similarProducts = await this.productService.getSimilarProducts(
        id,
        page,
        limit
      );
      res.json(ApiResponse.success(similarProducts));
    } catch (error) {
      console.error('Błąd podczas pobierania podobnych produktów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania podobnych produktów'));
    }
  };

  getByCategoryId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const filters = {
        limit: parseInt(req.query.limit as string) || 20,
        skip: parseInt(req.query.skip as string) || 0,
        powerMin: req.query.powerMin,
        powerMax: req.query.powerMax,
        rpmMin: req.query.rpmMin,
        rpmMax: req.query.rpmMax,
        shaftDiameterMin: req.query.shaftDiameterMin,
        shaftDiameterMax: req.query.shaftDiameterMax,
        manufacturer: req.query.manufacturer,
        sort: req.query.sort,
        productType: this.parseProductType(req.query.productType),
      };

      const result = await this.productService.getProductsByCategory(
        categoryId,
        filters
      );

      // Tu naprawiamy - zmieniamy strukturę odpowiedzi
      const response = {
        products: result.products,
        total: result.total, // Zachowujemy oryginalną wartość total!
        page: Math.floor(filters.skip / filters.limit),
        totalPages: Math.ceil(result.total / filters.limit),
      };

      res.json(ApiResponse.success(response));
    } catch (error) {
      console.error('Błąd podczas pobierania produktów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania produktów'));
    }
  };

  public getAvailableRpmValues: RequestHandler = async (req, res) => {
    try {
      const { categoryId } = req.params;

      // Specjalna obsługa dla strony wyszukiwania
      if (categoryId === 'search-results') {
        // Dla wyszukiwania zwróć puste wartości - będą pobrane z globalnych zakresów
        res.json(ApiResponse.success([]));
        return;
      }

      const values =
        await this.productService.getAvailableRpmValues(categoryId);
      res.json(ApiResponse.success(values));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania dostępnych obrotów'));
    }
  };

  public getProductsWithRpmValues: RequestHandler = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { products } = await this.productService.getProductsByCategory(
        categoryId,
        {}
      );

      const uniqueRpmValues = [
        ...new Set(
          products.map((product: Product) => parseInt(product.rpm.value))
        ),
      ]
        .filter((rpm: number) => !isNaN(rpm))
        .sort((a: number, b: number) => a - b);

      res.json(ApiResponse.success(uniqueRpmValues));
    } catch (error) {
      console.error('Błąd:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania wartości obrotów'));
    }
  };

  public checkStock: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { productId, requestedQuantity } = req.body;

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          await queryRunner.rollbackTransaction();
          res.status(404).json({
            success: false,
            error: 'Produkt nie został znaleziony',
          });
          return;
        }

        const isAvailable = product.stock >= requestedQuantity;

        await queryRunner.commitTransaction();

        res.json({
          success: true,
          data: {
            isAvailable,
            currentStock: product.stock,
          },
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania stanu:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas sprawdzania dostępności produktu',
      });
    }
  };

  public getProductTypesForCategory: RequestHandler = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const types =
        await this.productService.getProductTypesForCategory(categoryId);
      res.json(ApiResponse.success(types));
    } catch (error) {
      console.error('Błąd podczas pobierania typów produktów:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania typów produktów'));
    }
  };
  public getManufacturersForCategory: RequestHandler = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const manufacturers =
        await this.productService.getManufacturersForCategory(categoryId);
      res.json(ApiResponse.success(manufacturers));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania producentów'));
    }
  };

  public getGoogleMerchantFeed: RequestHandler = async (req, res) => {
    try {
      const feed = await this.googleMerchantService.generateFeed();

      res.header('Content-Type', 'application/xml');
      res.header(
        'Content-Disposition',
        'attachment; filename=google-merchant-feed.xml'
      );
      res.header('Cache-Control', 'public, max-age=3600');
      res.header('Last-Modified', new Date().toUTCString());

      res.send(feed); // używamy send zamiast json
    } catch (error) {
      console.error('Błąd podczas generowania feeda:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Błąd podczas generowania feeda Google Merchant')
        );
    }
  };

  public search: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const { q, page = '0', limit = '20', sort = 'relevance' } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json(ApiResponse.error('Brak frazy wyszukiwania'));
        return;
      }

      // ZAWSZE używaj searchProductsWithFilters bo filtry mogą być w URL
      const filters = {
        powerMin: req.query.powerMin
          ? parseFloat(req.query.powerMin as string)
          : undefined,
        powerMax: req.query.powerMax
          ? parseFloat(req.query.powerMax as string)
          : undefined,
        rpmMin: req.query.rpmMin
          ? parseFloat(req.query.rpmMin as string)
          : undefined,
        rpmMax: req.query.rpmMax
          ? parseFloat(req.query.rpmMax as string)
          : undefined,
        shaftDiameterMin: req.query.shaftDiameterMin
          ? parseFloat(req.query.shaftDiameterMin as string)
          : undefined,
        shaftDiameterMax: req.query.shaftDiameterMax
          ? parseFloat(req.query.shaftDiameterMax as string)
          : undefined,
        manufacturer: (req.query.manufacturer as string) || undefined,
        condition:
          (req.query.condition as 'nowy' | 'uzywany' | 'nieuzywany') ||
          undefined,
        categorySlug: (req.query.category as string) || undefined, // przekaż kategorię
      };

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const filteredResult =
        await this.productService.searchProductsWithFilters(
          q,
          filters,
          pageNum,
          limitNum,
          sort as string
        );

      res.json(
        ApiResponse.success({
          products: filteredResult.products,
          total: filteredResult.total,
          page: pageNum,
          totalPages: Math.ceil(filteredResult.total / limitNum),
          query: q,
          suggestions: filteredResult.suggestions,
          appliedFilters: filters,
        })
      );

      // Śledź wyszukiwanie
      await this.productService.trackSearch(q);
    } catch (error) {
      console.error('Błąd podczas wyszukiwania:', error);
      next(error);
    }
  };

  public getAllegroOffers: RequestHandler = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const allegroService = new AllegroService();
      const offers = await allegroService.getAllOffers(page, limit);

      res.json(
        ApiResponse.success({
          data: {
            offers: offers.offers,
            total: offers.totalCount,
            totalPages: offers.totalPages,
          },
        })
      );
    } catch (error) {
      console.error('Kontroler - błąd podczas pobierania ofert:', error);
      next(error);
    }
  };

  public getPopularProducts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;

      const products = await this.productService.getPopularProducts(limit);

      res.json({
        success: true,
        data: {
          products,
        },
      });
    } catch (error) {
      console.error('💥 Detailed error in getPopularProducts:', {
        message: error,
        stack: error,
        name: error,
      });
      res.status(500).json({
        success: false,
        error: 'Nie udało się pobrać popularnych produktów',
      });
    }
  };

  public getLatestProducts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;

      const products = await this.productService.getLatestProducts(limit);

      res.json({
        success: true,
        data: {
          products,
        },
      });
    } catch (error) {
      console.error('💥 Error in getLatestProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Nie udało się pobrać najnowszych produktów',
      });
    }
  };

  public getSearchSuggestions: RequestHandler = async (
    req,
    res,
    next
  ): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.length < 2) {
        res.json(ApiResponse.success({ suggestions: [] }));
        return;
      }

      const suggestions = await this.productService.getSearchSuggestions(q, 10);

      // Formatuj sugestie dla frontendu
      const formattedSuggestions = suggestions.map((product) => ({
        id: product.id,
        name: product.name,
        manufacturer: product.manufacturer,
        power: product.power?.value,
        price: product.marketplaces?.ownStore?.price,
        image: product.mainImage,
        category: product.categories?.[0],
        slug: product.marketplaces?.ownStore?.slug,
      }));

      res.json(
        ApiResponse.success({
          suggestions: formattedSuggestions,
          total: formattedSuggestions.length,
        })
      );
    } catch (error) {
      console.error('Błąd podczas pobierania sugestii:', error);
      next(error);
    }
  };

  public bulkPricePreview: RequestHandler = async (req, res, next) => {
    try {
      const { filters } = req.body;

      const products =
        await this.productService.getProductsForPriceUpdate(filters);

      res.json(
        ApiResponse.success({
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            power: p.power,
            condition: p.condition,
            price: p.price,
            marketplaces: p.marketplaces,
          })),
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // Popraw metodę bulkPriceUpdate - zmień walidację:
  public bulkPriceUpdate: RequestHandler = async (req, res, next) => {
    try {
      const { filters, priceChange } = req.body;

      // Poprawiona walidacja
      if (!priceChange || (!priceChange.percentage && !priceChange.amount)) {
        res
          .status(400)
          .json(ApiResponse.error('Nieprawidłowa wartość zmiany ceny'));
        return;
      }

      const result = await this.productService.bulkUpdatePrices(
        filters,
        priceChange
      );

      res.json(
        ApiResponse.success(
          {
            updatedCount: result.updatedCount,
            products: result.products,
          },
          `Zaktualizowano ceny ${result.updatedCount} produktów`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getUnlinkedCount: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      const productRepository = AppDataSource.getRepository(Product);

      const count = await productRepository
        .createQueryBuilder('product')
        .where('product.matched_store_product IS NULL')
        .andWhere("product.marketplaces->'allegro'->>'productId' IS NULL")
        .getCount();

      console.log(`📊 Znaleziono ${count} niepowiązanych produktów`);
      res.json({ success: true, count });
    } catch (error) {
      console.error('❌ Błąd liczenia niepowiązanych produktów:', error);
      // Poprawione typowanie error
      const errorMessage =
        error instanceof Error ? error.message : 'Nieznany błąd';
      res.status(500).json({ success: false, count: 0, error: errorMessage });
    }
  };
}

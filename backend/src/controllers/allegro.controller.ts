// backend/src/controllers/allegro.controller.ts
import { RequestHandler } from 'express';
import { AllegroService } from '../services/allegro.service';
import { ApiResponse } from '../utils/apiResponse';
import { allegroConfig } from '../config/allegro.config';
import { ProductService } from '../services/product.service';
import { Repository } from 'typeorm';
import { Product } from '../entities/Product';
import { AppDataSource } from '../config/database';

export class AllegroController {
  private allegroService: AllegroService;
  private productService: ProductService;
  private productRepository: Repository<Product>;

  constructor() {
    this.allegroService = new AllegroService();
    this.productService = new ProductService();
    this.productRepository = AppDataSource.getRepository(Product);
  }

  public getAuthUrl: RequestHandler = async (_req, res) => {
    const redirectUri = process.env.ALLEGRO_REDIRECT_URI;
    if (!redirectUri) {
      throw new Error(
        'Brak wymaganej zmiennej środowiskowej ALLEGRO_REDIRECT_URI'
      );
    }

    const authUrl =
      `${allegroConfig.authUrl}/authorize` +
      `?response_type=code` +
      `&client_id=${allegroConfig.clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.json({ url: authUrl });
  };

  public handleCallback: RequestHandler = async (req, res): Promise<void> => {
    // Pobieramy kod TYLKO z query params
    const code = req.query.code as string;

    if (!code) {
      console.error('Brak kodu w żądaniu');
      res.status(400).json(ApiResponse.error('Brak wymaganego parametru code'));
      return;
    }

    try {
      await this.allegroService.handleAuthCode(code);

      res.json(ApiResponse.success(null, 'Autoryzacja zakończona sukcesem'));
    } catch (error) {
      console.error('Błąd autoryzacji:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas autoryzacji z Allegro'));
    }
  };

  public createOffer: RequestHandler = async (req, res): Promise<void> => {
    try {
      // Sprawdź, czy mamy productId w parametrach (wariant 1) czy dane oferty w body (wariant 2)
      const { productId } = req.params;

      if (productId) {
        // WARIANT 1: Tworzymy ofertę na podstawie istniejącego produktu
        console.log('Tworzenie oferty dla produktu:', productId);
        try {
          const product = await this.productService.getProductById(productId);
          console.log('Znaleziony produkt:', product);
          const offer = await this.allegroService.createOffer(product);
          console.log('Utworzona oferta:', offer);

          // Aktualizujemy produkt z informacją o Allegro
          if (product.id) {
            product.marketplaces = {
              ...product.marketplaces,
              allegro: {
                ...product.marketplaces?.allegro,
                active: true,
                productId: offer.id,
                url: `https://allegro.pl/oferta/${offer.id}`,
              },
            };

            // Dodajemy powiązanie do samego siebie - key change!
            product.matched_store_product = {
              store_product_id: product.id,
              store_product_name: product.name,
              matched_at: new Date(),
            };

            await this.productRepository.save(product);
          }

          res.json(
            ApiResponse.success(offer, 'Oferta została utworzona na Allegro')
          );
        } catch (error: any) {
          res
            .status(500)
            .json(
              ApiResponse.error(
                `Błąd podczas tworzenia oferty z produktu: ${error.message}`
              )
            );
        }
      } else {
        // WARIANT 2: Tworzymy ofertę bezpośrednio z danych w body żądania
        console.log('Tworzenie oferty z danych z formularza');

        const offerData = req.body;
        console.log('Dane oferty:', offerData);

        // Podstawowa walidacja
        if (!offerData.name) {
          res.status(400).json(ApiResponse.error('Brak nazwy oferty'));
          return;
        }

        // Popraw/uzupełnij dane oferty
        if (offerData.images) {
          offerData.images = offerData.images.filter(
            (img: any) => img && img !== ''
          );

          if (offerData.images.length === 0) {
            res.status(400).json(ApiResponse.error('Brak zdjęć w ofercie'));
            return;
          }
        }

        // Upewnij się, że stock jest większy od 0
        if (!offerData.stock || offerData.stock.available <= 0) {
          offerData.stock = {
            available: 1,
            unit: 'UNIT',
          };
        }

        try {
          // Wywołaj metodę z serwisu, która tworzy ofertę na Allegro bezpośrednio z danych
          const offer = await this.allegroService.createOffer(offerData);
          console.log('Utworzona oferta:', offer);
          res.json(
            ApiResponse.success(offer, 'Oferta została utworzona na Allegro')
          );
        } catch (error: any) {
          console.error('Szczegóły błędu:', error);

          // Wyciągnij bardziej szczegółowe informacje o błędzie z API Allegro
          let errorMessage = 'Błąd podczas tworzenia oferty na Allegro';
          if (error.response?.data?.errors) {
            const errorDetails = error.response.data.errors
              .map(
                (err: any) =>
                  err.userMessage || err.message || JSON.stringify(err)
              )
              .join(', ');
            errorMessage += ': ' + errorDetails;
          } else if (error.message) {
            errorMessage += ': ' + error.message;
          }

          res.status(400).json(ApiResponse.error(errorMessage));
        }
      }
    } catch (error: any) {
      console.error('Ogólny błąd kontrolera:', error);
      res
        .status(500)
        .json(
          ApiResponse.error(`Błąd podczas tworzenia oferty: ${error.message}`)
        );
    }
  };

  public getAuthStatus: RequestHandler = async (_req, res): Promise<void> => {
    try {
      const isAuthenticated = await this.allegroService.checkAuthStatus();
      let token = null;

      if (isAuthenticated) {
        token = await this.allegroService.getValidToken();
      }

      res.json(
        ApiResponse.success({
          isAuthenticated,
          token,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Backend - błąd sprawdzania statusu:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Błąd podczas sprawdzania statusu autoryzacji')
        );
    }
  };

  public getAllOffers: RequestHandler = async (req, res): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const phrase = req.query.phrase as string;
      const condition = req.query.condition as string;
      const status = req.query.status as string;
      const priceMin = req.query.priceMin
        ? parseFloat(req.query.priceMin as string)
        : undefined;
      const priceMax = req.query.priceMax
        ? parseFloat(req.query.priceMax as string)
        : undefined;
      const sortBy = req.query.sortBy as string;
      const sortDirection =
        (req.query.sortDirection as string)?.toUpperCase() || 'ASC';

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro' IS NOT NULL")
        .andWhere("product.marketplaces->'allegro'->>'productId' IS NOT NULL");

      if (phrase) {
        queryBuilder.andWhere(
          '(product.name ILIKE :phrase OR product.manufacturer ILIKE :phrase)',
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

      // Dodaj sortowanie
      if (sortBy) {
        let sortExpression = `product.${sortBy}`;
        if (sortBy === 'price') {
          sortExpression =
            "(product.marketplaces->'allegro'->>'price')::numeric";
        }
        queryBuilder.orderBy(sortExpression, sortDirection as 'ASC' | 'DESC');
      }

      // Wykonaj zapytanie z paginacją
      const [products, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          offers: products,
          totalCount: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          source: 'database',
        },
      });
    } catch (error) {
      console.error('Błąd:', error);
      res.status(500).json({ success: false, error });
    }
  };

  public importAllOffers: RequestHandler = async (req, res): Promise<void> => {
    try {
      console.log('=== START IMPORTU WSZYSTKICH OFERT ===');

      // Dodajemy czyszczenie danych Allegro przed importem
      console.log('Czyszczenie istniejących danych Allegro...');
      await this.allegroService.clearAllAllegroData();
      console.log('Dane Allegro wyczyszczone pomyślnie.');

      const totalPages = Math.ceil(1000 / 20);
      let importedCount = 0;

      for (let page = 0; page < totalPages; page++) {
        console.log(`Pobieranie strony ${page + 1}/${totalPages}`);
        const pageOffers = await this.allegroService.getAllOffers(page, 20);

        if (!pageOffers.offers || pageOffers.offers.length === 0) {
          console.log('Brak ofert na stronie');
          continue;
        }

        console.log(`Znaleziono ${pageOffers.offers.length} ofert na stronie`);

        // Importuj produkty do bazy
        const importedProducts = await this.allegroService.batchImportProducts(
          pageOffers.offers
        );

        if (importedProducts) {
          importedCount += importedProducts.length;
          console.log(
            `Zaimportowano ${importedProducts.length} produktów z tej strony`
          );
        }
      }

      console.log(`=== ZAKOŃCZONO IMPORT ===`);
      console.log(`Łącznie zaimportowano ${importedCount} produktów`);

      res.json({
        success: true,
        message: `Zaimportowano ${importedCount} produktów z Allegro`,
        totalImported: importedCount,
      });
    } catch (error) {
      console.error('Błąd podczas importu:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nieznany błąd podczas importu',
      });
    }
  };

  public importToOwnStore: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { offerId } = req.params;

      // Pobierz ofertę z Allegro
      const offer = await this.allegroService.getOfferById(offerId);

      // Importuj do własnego sklepu
      const product = await this.productService.importFromAllegro(offer);

      res.json(ApiResponse.success(product));
    } catch (error) {
      console.error('Błąd importu:', error);
      res.status(500).json(ApiResponse.error('Błąd importu produktu'));
    }
  };

  public getOfferById: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        console.error('Brak ID oferty w zapytaniu');
      }

      const offer = await this.allegroService.getOfferById(id);

      res.json(ApiResponse.success(offer));
    } catch (error) {
      console.error('Błąd w kontrolerze getOfferById:', error);
      res.status(500).json(ApiResponse.error('Błąd podczas pobierania oferty'));
    }
  };

  public synchronizeSleeveDiameters: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      await this.allegroService.synchronizeSleeveDiameters();

      res.json({
        success: true,
        message: 'Pomyślnie zsynchronizowano średnice tulei',
      });
    } catch (error) {
      console.error('Błąd synchronizacji średnic tulei:', error);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas synchronizacji',
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  };

  public searchProducts: RequestHandler = async (req, res): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const phrase = req.query.phrase as string;
      const condition = req.query.condition as string;
      const status = req.query.status as string;
      const priceMin = req.query.priceMin
        ? parseFloat(req.query.priceMin as string)
        : undefined;
      const priceMax = req.query.priceMax
        ? parseFloat(req.query.priceMax as string)
        : undefined;

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro' IS NOT NULL");

      if (phrase) {
        queryBuilder.andWhere(
          '(product.name ILIKE :phrase OR product.manufacturer ILIKE :phrase)',
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

      const [products, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          offers: products,
          totalCount: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Błąd:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  };

  public updateOfferPrice: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPrice } = req.body;

      if (!id) {
        res.status(400).json(ApiResponse.error('Brak ID oferty'));
        return;
      }

      if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
        res.status(400).json(ApiResponse.error('Nieprawidłowa cena'));
        return;
      }

      // Aktualizacja ceny w Allegro
      await this.allegroService.updateOfferPriceById(id, parseFloat(newPrice));

      // Aktualizacja ceny w bazie danych
      const product = await this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro'->>'productId' = :productId", {
          productId: id,
        })
        .getOne();

      if (product) {
        // Upewnij się, że product.marketplaces.allegro istnieje
        if (!product.marketplaces) {
          product.marketplaces = {};
        }

        // Upewnij się, że active ma wartość boolowską
        const isActive = product.marketplaces.allegro?.active === true;

        // Aktualizacja ceny w bazie danych
        product.marketplaces.allegro = {
          active: isActive || false, // Domyślnie false jeśli undefined
          ...product.marketplaces.allegro,
          price: parseFloat(newPrice),
        };
        await this.productRepository.save(product);
      }

      res.json(
        ApiResponse.success(
          { price: parseFloat(newPrice) },
          'Cena zaktualizowana pomyślnie'
        )
      );
    } catch (error) {
      console.error('Błąd aktualizacji ceny:', error);
      res.status(500).json(ApiResponse.error('Błąd podczas aktualizacji ceny'));
    }
  };

  public updateOfferStock: RequestHandler = async (req, res) => {
    try {
      const { offerId } = req.params;
      const { newStock } = req.body;

      console.log('=== BACKEND: updateAllegroOfferStock ===');
      console.log('allegroOfferId:', offerId);
      console.log('newStock:', newStock);

      if (!offerId) {
        console.log('❌ Brak ID oferty Allegro');
        res.status(400).json(ApiResponse.error('Brak ID oferty Allegro'));
        return;
      }

      if (isNaN(parseInt(newStock)) || parseInt(newStock) < 0) {
        console.log('❌ Nieprawidłowy stan magazynowy:', newStock);
        res
          .status(400)
          .json(ApiResponse.error('Nieprawidłowy stan magazynowy'));
        return;
      }

      // Aktualizacja stanu na Allegro
      console.log('🔄 Aktualizacja stanu w Allegro dla oferty:', offerId);
      await this.allegroService.updateOfferStockById(
        offerId,
        parseInt(newStock)
      );
      console.log('✅ Stan zaktualizowany w Allegro');

      // Opcjonalnie: znajdź produkt powiązany z tą ofertą i zaktualizuj jego stan lokalnie
      const product = await this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro'->>'productId' = :allegroId", {
          allegroId: offerId,
        })
        .getOne();

      if (product) {
        product.stock = parseInt(newStock);
        product.marketplaces.allegro = {
          ...product.marketplaces.allegro,
          active: product.marketplaces.allegro?.active === true,
          stock: parseInt(newStock),
        };
        await this.productRepository.save(product);
        console.log('✅ Stan zaktualizowany również w bazie danych');
      }

      res.json(
        ApiResponse.success(
          { stock: parseInt(newStock) },
          'Stan magazynowy oferty Allegro zaktualizowany pomyślnie'
        )
      );
    } catch (error) {
      console.error(
        '❌ Błąd aktualizacji stanu magazynowego oferty Allegro:',
        error
      );
      res
        .status(500)
        .json(
          ApiResponse.error(
            'Błąd podczas aktualizacji stanu magazynowego oferty Allegro'
          )
        );
    }
  };

  public synchronizeStartTypes: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      await this.allegroService.synchronizeStartTypes();

      res.json({
        success: true,
        message: 'Pomyślnie zsynchronizowano typy rozruchu',
      });
    } catch (error) {
      console.error('Błąd synchronizacji typów rozruchu:', error);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas synchronizacji',
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  };

  public updateOfferName: RequestHandler = async (req, res) => {
    try {
      const { offerId } = req.params;
      const { newName } = req.body;

      console.log('=== BACKEND: updateOfferName ===');
      console.log('allegroOfferId:', offerId);
      console.log('newName:', newName);

      if (!offerId) {
        console.log('❌ Brak ID oferty Allegro');
        res.status(400).json(ApiResponse.error('Brak ID oferty Allegro'));
        return;
      }

      if (!newName) {
        console.log('❌ Brak parametru newName');
        res.status(400).json(ApiResponse.error('Brak nowej nazwy produktu'));
        return;
      }

      // Aktualizacja nazwy w Allegro
      console.log('🔄 Aktualizacja nazwy w Allegro dla oferty:', offerId);
      await this.allegroService.updateOfferNameById(offerId, newName);
      console.log('✅ Nazwa zaktualizowana w Allegro');

      // Opcjonalnie: znajdź produkt powiązany z tą ofertą i zaktualizuj jego nazwę lokalnie
      const product = await this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro'->>'productId' = :allegroId", {
          allegroId: offerId,
        })
        .getOne();

      if (product) {
        product.name = newName;
        await this.productRepository.save(product);
        console.log('✅ Nazwa zaktualizowana również w bazie danych');
      }

      res.json(
        ApiResponse.success(
          { name: newName },
          'Nazwa oferty Allegro zaktualizowana pomyślnie'
        )
      );
    } catch (error) {
      console.error('❌ Błąd aktualizacji nazwy oferty Allegro:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Błąd podczas aktualizacji nazwy oferty Allegro')
        );
    }
  };

  public linkProductToAllegro: RequestHandler = async (
    req,
    res
  ): Promise<void> => {
    try {
      const { productId } = req.params;
      const { allegroOfferId } = req.body;

      console.log(
        `🔗 Próba powiązania produktu ${productId} z ofertą Allegro ${allegroOfferId}`
      );

      // Walidacja ID oferty Allegro
      if (!/^\d{11}$/.test(allegroOfferId)) {
        res.status(400).json({
          success: false,
          error: 'ID oferty Allegro musi składać się z 11 cyfr',
        });
        return;
      }

      // Sprawdź czy oferta nie jest już powiązana z innym produktem
      const existingLink = await this.productRepository
        .createQueryBuilder('product')
        .where(
          "product.marketplaces->'allegro'->>'productId' = :allegroOfferId",
          { allegroOfferId }
        )
        .andWhere('product.id != :productId', { productId })
        .getOne();

      if (existingLink) {
        res.status(400).json({
          success: false,
          error: `Oferta Allegro ${allegroOfferId} jest już powiązana z produktem: ${existingLink.name}`,
        });
        return;
      }

      // Znajdź produkt do powiązania
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Produkt nie został znaleziony',
        });
        return;
      }

      // Pobierz szczegóły oferty z Allegro - z lepszą obsługą błędów
      let allegroOffer;
      try {
        allegroOffer = await this.allegroService.getOfferById(allegroOfferId);
      } catch (error: any) {
        console.error('❌ Błąd pobierania oferty z Allegro:', error);

        // Sprawdź rodzaj błędu
        if (
          error.message.includes('404') ||
          error.message.includes('does not exist')
        ) {
          res.status(404).json({
            success: false,
            error: `Oferta Allegro ${allegroOfferId} nie istnieje. Sprawdź ID oferty.`,
          });
        } else if (
          error.message.includes('400') ||
          error.message.includes('invalid')
        ) {
          res.status(400).json({
            success: false,
            error: `ID oferty ${allegroOfferId} jest nieprawidłowe. Użyj poprawnego formatu ID.`,
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Błąd podczas pobierania szczegółów oferty z Allegro',
          });
        }
        return;
      }

      // Utwórz powiązanie
      product.marketplaces = {
        ...product.marketplaces,
        allegro: {
          active: true,
          productId: allegroOfferId,
          url: `https://allegro.pl/oferta/${allegroOfferId}`,
          price: parseFloat(allegroOffer.sellingMode?.price?.amount || '0'),
          stock: allegroOffer.stock?.available,
          parameters: allegroOffer.parameters,
          lastSyncAt: new Date(),
        },
      };

      // Dodaj matched_store_product
      product.matched_store_product = {
        store_product_id: product.id,
        store_product_name: product.name,
        matched_at: new Date(),
      };

      await this.productRepository.save(product);

      console.log(
        `✅ Produkt ${product.name} powiązany z ofertą Allegro ${allegroOfferId}`
      );

      res.json({
        success: true,
        message: 'Produkt został powiązany z ofertą Allegro',
        data: {
          productId: product.id,
          allegroOfferId,
          allegroUrl: product.marketplaces.allegro?.url,
        },
      });
    } catch (error) {
      console.error('❌ Błąd powiązywania:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas powiązywania produktu',
      });
    }
  };

  public getUnlinkedAllegroOffers: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      console.log('📋 Pobieranie niepowiązanych ofert Allegro...');

      // Pobierz wszystkie oferty z Allegro
      const allOffers = await this.allegroService.getAllOffers(0, 1000);

      // Pobierz wszystkie powiązane ID ofert
      const linkedProducts = await this.productRepository.find({
        select: ['marketplaces'],
      });

      const linkedOfferIds = linkedProducts
        .map((p) => p.marketplaces?.allegro?.productId)
        .filter(Boolean);

      // Filtruj tylko niepowiązane oferty
      const unlinkedOffers = allOffers.offers.filter(
        (offer) => !linkedOfferIds.includes(offer.id)
      );

      console.log(
        `📊 Znaleziono ${unlinkedOffers.length} niepowiązanych ofert`
      );

      res.json({
        success: true,
        data: unlinkedOffers.map((offer) => ({
          id: offer.id,
          name: offer.name,
          price: offer.sellingMode?.price?.amount,
          stock: offer.stock?.available,
          image: offer.primaryImage?.url || offer.images?.[0],
        })),
      });
    } catch (error) {
      console.error('❌ Błąd pobierania niepowiązanych ofert:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd pobierania ofert',
      });
    }
  };

  public getCategoryParameters: RequestHandler = async (req, res) => {
    try {
      const categoryId = req.params.categoryId || '121456'; // silniki
      const token = await this.allegroService.getValidToken();

      const response = await fetch(
        `https://api.allegro.pl/sale/categories/${categoryId}/parameters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.allegro.public.v1+json',
          },
        }
      );
    } catch (error) {
      res.status(500).json({ error });
    }
  };
}

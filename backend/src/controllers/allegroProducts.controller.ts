// backend/src/controllers/allegroProducts.controller.ts

import { RequestHandler } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AllegroService } from '../services/allegro.service';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { Repository } from 'typeorm';
import { Product } from '../entities/Product';
import { AllegroProductsService } from '../services/allegroProducts.service';

export class AllegroProductsController {
  private allegroProductsService: AllegroProductsService;
  private productRepository: Repository<Product>;
  private allegroService: AllegroService;

  constructor() {
    this.allegroProductsService = new AllegroProductsService();
    this.productRepository = AppDataSource.getRepository(Product);
    this.allegroService = new AllegroService();
  }

  public search: RequestHandler = async (req, res) => {
    try {
      const {
        page = '0',
        limit = '20',
        phrase,
        condition,
        status,
        priceMin,
        priceMax,
        sortBy,
        sortDirection = 'ASC',
      } = req.query;

      const result = await this.allegroProductsService.search({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        phrase: phrase as string,
        condition: condition as string,
        status: status as string,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        sortBy: sortBy as string,
        sortDirection: sortDirection as 'ASC' | 'DESC',
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      console.error('Błąd podczas wyszukiwania:', error);
      res.status(500).json(ApiResponse.error('Błąd podczas wyszukiwania'));
    }
  };

  public getAllAllegroProducts: RequestHandler = async (req, res) => {
    try {
      // Pobierz wszystkie produkty z powiązaniem Allegro
      const allegroProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'categories')
        .where("product.marketplaces->'allegro' IS NOT NULL")
        .andWhere("product.marketplaces->'allegro'->>'productId' IS NOT NULL")
        .getMany();

      // Zbierz wszystkie ID produktów ze sklepu
      const storeProductIds = new Set<string>();

      allegroProducts.forEach((product) => {
        // Sprawdź matched_store_product
        if (product.matched_store_product?.store_product_id) {
          storeProductIds.add(product.matched_store_product.store_product_id);
        }
        // Sprawdź też sam produkt jeśli ma marketplace ownStore
        if (product.marketplaces?.ownStore?.active) {
          storeProductIds.add(product.id);
        }
      });

      // Pobierz wszystkie produkty ze sklepu
      let matchedProducts: Product[] = [];
      if (storeProductIds.size > 0) {
        matchedProducts = await this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.categories', 'categories')
          .where('product.id IN (:...ids)', {
            ids: Array.from(storeProductIds),
          })
          .andWhere("product.marketplaces->'ownStore'->>'active' = :active", {
            active: 'true',
          })
          .select([
            'product.id',
            'product.name',
            'product.mainImage',
            'product.galleryImages',
            'product.images',
            'product.marketplaces',
            'product.stock',
            'product.power',
            'product.rpm',
            'product.condition',
            'product.manufacturer',
            'product.shaftDiameter',
            'product.mechanicalSize',
            'product.weight',
            'categories.id',
            'categories.name',
            'categories.slug',
          ])
          .getMany();
      }

      // Stwórz mapę produktów
      const matchedProductsMap = matchedProducts.reduce(
        (acc, product) => {
          if (product.id) {
            acc[product.id] = product;
          }
          return acc;
        },
        {} as Record<string, Product>
      );

      res.json({
        success: true,
        data: {
          offers: allegroProducts,
          matchedProducts: matchedProductsMap,
        },
      });
    } catch (error) {
      console.error('Error in getAllAllegroProducts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  public getMatches: RequestHandler = async (req, res) => {
    try {
      const matches = await this.allegroProductsService.getMatchingProducts();

      res.json(ApiResponse.success({ matches }));
    } catch (error) {
      console.error('[BACKEND] Błąd w getMatches:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas wyszukiwania dopasowań'));
    }
  };

  public importProduct: RequestHandler = async (req, res) => {
    try {
      const { productId } = req.params;
      const { categoryId, customSlug, customPrice, customWeight } = req.body;

      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['categories'],
      });

      if (!product) {
        res.status(404).json(ApiResponse.error('Produkt nie znaleziony'));
        return;
      }

      if (product.matched_store_product) {
        res
          .status(400)
          .json(ApiResponse.error('Produkt już istnieje w sklepie'));
        return;
      }

      const category = await AppDataSource.getRepository(Category).findOne({
        where: { id: categoryId },
      });

      if (!category) {
        res.status(404).json(ApiResponse.error('Kategoria nie znaleziona'));
        return;
      }

      // Tworzymy nowy produkt w sklepie
      const newProductData: Partial<Product> = {
        name: product.name,
        manufacturer: product.manufacturer,
        price: parseFloat(
          product.marketplaces.allegro?.price?.toString() || '0'
        ),
        power: {
          value: product.power.value,
          range: product.power.range || '',
        },
        rpm: {
          value: product.rpm.value,
          range: product.rpm.range || '',
        },
        condition: product.condition,
        shaftDiameter: parseFloat(product.shaftDiameter.toString()),
        sleeveDiameter: product.sleeveDiameter
          ? parseFloat(product.sleeveDiameter.toString())
          : undefined,
        flangeSize: product.flangeSize
          ? parseFloat(product.flangeSize.toString())
          : undefined,
        mechanicalSize: parseInt(product.mechanicalSize.toString()),
        images: product.images || [],
        stock: product.stock,
        description: product.description || undefined,
        startType: product.startType,
        weight: customWeight,
        categories: [category],
        marketplaces: {
          ownStore: {
            active: true,
            price: customPrice,
            slug: customSlug,
          },
        },

        mainImage: product.mainImage || undefined,
        galleryImages: product.galleryImages || [],
        attributes: product.attributes || undefined,
        dataSheets: product.dataSheets || undefined,
        technicalDetails: product.technicalDetails || undefined,
        customParameters: product.customParameters || undefined,
        viewCount: 0,
        purchaseCount: 0,
      };

      const newProduct = this.productRepository.create(newProductData);

      await this.productRepository.save(newProduct);

      // Aktualizujemy oryginalny produkt z Allegro
      product.matched_store_product = {
        store_product_id: newProduct.id,
        store_product_name: newProduct.name,
        matched_at: new Date(),
      };

      await this.productRepository.save(product);

      res.json(
        ApiResponse.success({
          message: 'Produkt zaimportowany',
          product: newProduct,
        })
      );
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas importowania produktu'));
    }
  };

  public updateProductPrice: RequestHandler = async (req, res) => {
    try {
      const { productId } = req.params;
      const { newPrice } = req.body;

      if (!productId) {
        res.status(400).json(ApiResponse.error('Brak ID produktu'));
        return;
      }

      if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
        res.status(400).json(ApiResponse.error('Nieprawidłowa cena'));
        return;
      }

      // Pobranie produktu z bazy danych
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        res.status(404).json(ApiResponse.error('Produkt nie znaleziony'));
        return;
      }

      if (!product.marketplaces?.allegro?.productId) {
        res
          .status(400)
          .json(ApiResponse.error('Produkt nie ma powiązania z Allegro'));
        return;
      }

      // Aktualizacja ceny w Allegro
      const allegroService = new AllegroService();
      await allegroService.updateOfferPriceById(
        product.marketplaces.allegro.productId,
        parseFloat(newPrice)
      );

      // Aktualizacja ceny w bazie danych
      product.marketplaces.allegro = {
        ...product.marketplaces.allegro,
        price: parseFloat(newPrice),
      };
      await this.productRepository.save(product);

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

  public updateProductStock: RequestHandler = async (req, res) => {
    try {
      const { productId } = req.params;
      const { newStock } = req.body;

      console.log('=== BACKEND: updateProductStock ===');
      console.log('productId:', productId);
      console.log('newStock:', newStock);

      if (!productId) {
        console.log('❌ Brak ID produktu');
        res.status(400).json(ApiResponse.error('Brak ID produktu'));
        return;
      }

      if (isNaN(parseInt(newStock)) || parseInt(newStock) < 0) {
        console.log('❌ Nieprawidłowy stan magazynowy:', newStock);
        res
          .status(400)
          .json(ApiResponse.error('Nieprawidłowy stan magazynowy'));
        return;
      }

      // Pobranie produktu z bazy danych
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        console.log('❌ Produkt nie znaleziony dla ID:', productId);
        res.status(404).json(ApiResponse.error('Produkt nie znaleziony'));
        return;
      }

      console.log('Znaleziony produkt:', {
        id: product.id,
        name: product.name,
        allegroProductId: product.marketplaces?.allegro?.productId,
        matched_store_product: product.matched_store_product,
      });

      // Sprawdź bezpośrednie powiązanie z Allegro
      let allegroProductId = product.marketplaces?.allegro?.productId;
      let matchedProduct = null;

      // Jeśli nie ma bezpośredniego powiązania, sprawdź przez matched_store_product
      if (
        !allegroProductId &&
        product.matched_store_product?.store_product_id
      ) {
        console.log(
          '🔍 Szukam powiązania przez matched_store_product:',
          product.matched_store_product.store_product_id
        );

        matchedProduct = await this.productRepository.findOne({
          where: { id: product.matched_store_product.store_product_id },
        });

        if (matchedProduct?.marketplaces?.allegro?.productId) {
          allegroProductId = matchedProduct.marketplaces.allegro.productId;
          console.log(
            '✅ Znaleziono powiązanie przez matched_store_product:',
            allegroProductId
          );
        }
      }

      if (!allegroProductId) {
        console.log('❌ Produkt nie ma powiązania z Allegro:', {
          directAllegroId: product.marketplaces?.allegro?.productId,
          matchedProductId: matchedProduct?.id,
          matchedAllegroId: matchedProduct?.marketplaces?.allegro?.productId,
        });
        res
          .status(400)
          .json(ApiResponse.error('Produkt nie ma powiązania z Allegro'));
        return;
      }

      // Aktualizacja stanu w Allegro
      console.log(
        '🔄 Aktualizacja stanu w Allegro dla oferty:',
        allegroProductId
      );
      const allegroService = new AllegroService();
      await allegroService.updateOfferStockById(
        allegroProductId,
        parseInt(newStock)
      );
      console.log('✅ Stan zaktualizowany w Allegro');

      // Aktualizacja stanu w bazie danych
      product.stock = parseInt(newStock);
      if (product.marketplaces?.allegro) {
        product.marketplaces.allegro = {
          ...product.marketplaces.allegro,
          stock: parseInt(newStock),
        };
      }
      await this.productRepository.save(product);
      console.log('✅ Stan zaktualizowany w bazie danych');

      // Jeśli znaleźliśmy produkt przez matched_store_product, zaktualizuj również jego stan
      if (matchedProduct) {
        matchedProduct.stock = parseInt(newStock);
        if (matchedProduct.marketplaces?.allegro) {
          matchedProduct.marketplaces.allegro = {
            ...matchedProduct.marketplaces.allegro,
            stock: parseInt(newStock),
          };
        }
        await this.productRepository.save(matchedProduct);
        console.log('✅ Stan zaktualizowany również w powiązanym produkcie');
      }

      res.json(
        ApiResponse.success(
          { stock: parseInt(newStock) },
          'Stan magazynowy zaktualizowany pomyślnie'
        )
      );
    } catch (error) {
      console.error('❌ Błąd aktualizacji stanu magazynowego:', error);
      res
        .status(500)
        .json(
          ApiResponse.error('Błąd podczas aktualizacji stanu magazynowego')
        );
    }
  };

  public getProductAllegroLink: RequestHandler = async (req, res) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        res.status(400).json(ApiResponse.error('Brak ID produktu'));
        return; // zwracamy void, nie Response
      }

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        res.status(404).json(ApiResponse.error('Produkt nie znaleziony'));
        return;
      }

      // Sprawdź bezpośrednie powiązanie
      if (product.marketplaces?.allegro?.url) {
        res.json(
          ApiResponse.success({ allegroUrl: product.marketplaces.allegro.url })
        );
        return;
      }

      // Jeśli nie ma bezpośredniego linku, sprawdź przez matched_store_product
      if (product.matched_store_product?.store_product_id) {
        const matchedProduct = await this.productRepository.findOne({
          where: { id: product.matched_store_product.store_product_id },
        });

        if (matchedProduct?.marketplaces?.allegro?.url) {
          res.json(
            ApiResponse.success({
              allegroUrl: matchedProduct.marketplaces.allegro.url,
            })
          );
          return;
        }

        if (matchedProduct?.marketplaces?.allegro?.productId) {
          const allegroUrl = `https://allegro.pl/oferta/${matchedProduct.marketplaces.allegro.productId}`;
          res.json(ApiResponse.success({ allegroUrl }));
          return;
        }
      }

      // Jeśli nie znaleziono URL
      res.json(ApiResponse.success({ allegroUrl: null }));
    } catch (error) {
      console.error('Błąd pobierania linku Allegro:', error);
      res.status(500).json(ApiResponse.error('Błąd pobierania linku Allegro'));
    }
  };

  public updateProductStatus: RequestHandler = async (req, res) => {
    try {
      const { productId } = req.params; // To jest ID z Allegro, a nie UUID z bazy
      const { active } = req.body;

      console.log('=== BACKEND: updateProductStatus ===');
      console.log('allegroProductId:', productId);
      console.log('active:', active);

      if (!productId) {
        console.log('❌ Brak ID produktu Allegro');
        res.status(400).json(ApiResponse.error('Brak ID produktu Allegro'));
        return;
      }

      if (active === undefined) {
        console.log('❌ Brak parametru active');
        res.status(400).json(ApiResponse.error('Brak parametru active'));
        return;
      }

      // Szukamy produktu po ID Allegro, a nie po głównym ID produktu
      const product = await this.productRepository
        .createQueryBuilder('product')
        .where("product.marketplaces->'allegro'->>'productId' = :allegroId", {
          allegroId: productId,
        })
        .getOne();

      // Aktualizacja statusu w API Allegro
      console.log('🔄 Aktualizacja statusu w Allegro dla oferty:', productId);
      try {
        const accessToken = await this.allegroService.getValidToken();
        const command = active ? 'ACTIVATE' : 'END';

        const url = `https://api.allegro.pl/sale/offer-publication-commands/${productId}`;

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/vnd.allegro.public.v1+json',
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.allegro.public.v1+json',
          },
          body: JSON.stringify({
            publicationStatus: command,
          }),
        });

        // Obsługa odpowiedzi z API Allegro
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ Odpowiedź API Allegro: ${response.status}`,
            errorText
          );
          res
            .status(500)
            .json(ApiResponse.error(`Błąd API Allegro: ${response.status}`));
          return;
        }

        console.log('✅ Status zaktualizowany w Allegro');

        // Aktualizujemy lokalną bazę danych tylko jeśli znaleźliśmy produkt
        if (product) {
          // Aktualizujemy produkt lokalnie
          if (!product.marketplaces) product.marketplaces = {};
          if (!product.marketplaces.allegro)
            product.marketplaces.allegro = { active: false };

          product.marketplaces.allegro.active = active;
          await this.productRepository.save(product);
          console.log('✅ Status zaktualizowany również w bazie danych');
        } else {
          console.log(
            'ℹ️ Nie znaleziono produktu w bazie danych do aktualizacji'
          );
        }

        res.json(
          ApiResponse.success(
            {
              active,
              productId,
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                  }
                : null,
            },
            'Status produktu Allegro zaktualizowany pomyślnie'
          )
        );
      } catch (error) {
        console.error('❌ Błąd aktualizacji statusu oferty w Allegro:', error);
        res
          .status(500)
          .json(
            ApiResponse.error('Błąd podczas aktualizacji statusu w Allegro')
          );
      }
    } catch (error) {
      console.error('❌ Błąd w obsłudze updateProductStatus:', error);
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas aktualizacji statusu produktu'));
    }
  };
}

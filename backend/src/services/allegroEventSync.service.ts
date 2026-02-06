// backend/src/services/allegroEventSync.service.ts
import { AllegroService } from './allegro.service';
import { EmailService } from './email.service';
import { ProductService } from './product.service';
import { Repository } from 'typeorm';
import { Product } from '../entities/Product';
import { AppDataSource } from '../config/database';

interface AllegroEvent {
  id: string;
  type: string;
  occurredAt: string;
  offer: {
    id: string;
    publication: null;
    external: {
      id: string;
    };
  };
}

interface AllegroEventsResponse {
  offerEvents: AllegroEvent[];
}

export class AllegroEventSyncService {
  private allegroService: AllegroService;
  private productService: ProductService;
  private emailService: EmailService;
  private lastEventId: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private productRepository: Repository<Product>;

  constructor() {
    this.allegroService = new AllegroService();
    this.emailService = new EmailService();
    this.productService = new ProductService();
    this.productRepository = AppDataSource.getRepository(Product);
    console.log('🚀 AllegroEventSyncService zainicjalizowany');
  }

  public startSync(interval: number = 300000) {
    if (this.intervalId) {
      console.log('⚠️ Synchronizacja już uruchomiona, pomijam...');
      return;
    }

    console.log(`🔄 Uruchamiam synchronizację z interwałem ${interval}ms`);
    this.intervalId = setInterval(async () => {
      await this.syncEvents();
    }, interval);
  }

  public async syncEvents() {
    try {
      console.log('🔄 Rozpoczynam synchronizację zdarzeń...');
      console.log(
        '🔄 Ostatnie ID zdarzenia:',
        this.lastEventId || 'BRAK (pierwsza synchronizacja)'
      );

      const events = (await this.allegroService.getOfferEvents({
        from: this.lastEventId, // Może być null przy pierwszym uruchomieniu
        limit: 1000,
        type: ['OFFER_STOCK_CHANGED', 'OFFER_ENDED', 'OFFER_ARCHIVED'],
      })) as AllegroEventsResponse;

      console.log(`📦 Otrzymano ${events.offerEvents.length} zdarzeń`);

      if (events.offerEvents.length > 0) {
        console.log(
          '📦 Pierwsze zdarzenie:',
          JSON.stringify(events.offerEvents[0], null, 2)
        );

        for (const event of events.offerEvents) {
          console.log(
            `🔄 Przetwarzam zdarzenie: ${event.id}, Typ: ${event.type}`
          );

          // Przetwarzaj tylko zdarzenia OFFER_STOCK_CHANGED
          if (event.type === 'OFFER_STOCK_CHANGED') {
            await this.handleStockChangeEvent(event);
          } else {
            console.log(`⏭️ Pomijam zdarzenie typu: ${event.type}`);
          }

          // Zawsze aktualizuj lastEventId
          this.lastEventId = event.id;
          console.log(`✅ Zaktualizowano lastEventId: ${this.lastEventId}`);
        }

        console.log(`✅ Przetworzono ${events.offerEvents.length} zdarzeń`);
      } else {
        console.log(`ℹ️ Brak nowych zdarzeń do przetworzenia`);
      }
    } catch (error) {
      console.error('❌ Błąd synchronizacji:', error);
      // Nie przerywaj działania serwisu - kontynuuj działanie
    }
  }

  public getLastEventId(): string | null {
    return this.lastEventId;
  }

  public isRunning(): boolean {
    return this.intervalId !== null;
  }

  public async handleStockChangeEvent(event: AllegroEvent) {
    console.log(
      '📦 ===== ROZPOCZYNAM PRZETWARZANIE ZDARZENIA ZMIANY STANU ====='
    );
    console.log('📦 Szczegóły zdarzenia:', JSON.stringify(event, null, 2));

    const offerId = event.offer.id;
    console.log(`🔍 ID oferty: ${offerId}`);

    if (!offerId) {
      console.error('❌ Brak ID oferty w zdarzeniu');
      await this.emailService.sendSyncError({
        offerId: 'UNKNOWN',
        stage: 'Odczyt ID oferty',
        error: 'Brak ID oferty w zdarzeniu',
      });
      return;
    }

    try {
      // Pobierz szczegóły oferty z Allegro
      console.log(`📦 Pobieranie szczegółów oferty ${offerId}...`);
      const offerDetails = await this.allegroService.getOfferById(offerId);

      // Dodajemy szczegółowe debugowanie struktury odpowiedzi
      console.log(`📦 Struktura offerDetails: ${typeof offerDetails}`);
      console.log(
        `📦 Stock w ofercie: ${JSON.stringify(offerDetails?.stock, null, 2)}`
      );
      console.log(
        `📦 Typ pola available: ${typeof offerDetails?.stock?.available}`
      );
      console.log(`📦 Wartość available: ${offerDetails?.stock?.available}`);

      // UWAGA: Zmieniamy warunek, by obsługiwał wartość 0 prawidłowo!
      if (
        offerDetails?.stock === undefined ||
        offerDetails?.stock === null ||
        offerDetails.stock.available === undefined ||
        offerDetails.stock.available === null
      ) {
        console.error(
          `❌ Problem z polem available! Wartość: ${offerDetails?.stock?.available}`
        );
        console.error(
          `❌ Cały obiekt stock: ${JSON.stringify(offerDetails?.stock, null, 2)}`
        );
        await this.emailService.sendSyncError({
          offerId,
          stage: 'Pobieranie szczegółów oferty',
          error: 'Nie można pobrać stanu magazynowego',
          productDetails: offerDetails,
        });
        return;
      }

      // Nowy stan magazynowy może być 0 i to jest poprawna wartość
      const newStock = offerDetails.stock.available;
      console.log(
        `📦 Pobrany nowy stan magazynowy: ${newStock} (typu ${typeof newStock})`
      );

      // Znajdź produkt w bazie
      console.log(`🔍 Szukam produktu z ofertą Allegro o ID: ${offerId}`);
      let allegroProduct =
        await this.productService.findByAllegroOfferId(offerId);

      if (!allegroProduct) {
        console.log('🔍 Szukam produktu przez matched_store_product...');

        allegroProduct = await this.productRepository
          .createQueryBuilder('product')
          .where(
            "product.matched_store_product->>'store_product_name' LIKE :name",
            {
              name: `%${offerDetails.name}%`,
            }
          )
          .orWhere('product.name LIKE :name', {
            name: `%${offerDetails.name}%`,
          })
          .getOne();

        if (allegroProduct) {
          console.log(
            '✅ Znaleziono produkt przez powiązanie matched_store_product'
          );

          // Aktualizuj allegroOfferId dla przyszłych synchronizacji
          if (!allegroProduct.marketplaces?.allegro?.productId) {
            allegroProduct.marketplaces = {
              ...allegroProduct.marketplaces,
              allegro: {
                active: allegroProduct.marketplaces?.allegro?.active ?? true,
                ...allegroProduct.marketplaces?.allegro,
                productId: offerId,
                url: `https://allegro.pl/oferta/${offerId}`,
              },
            };
            await this.productRepository.save(allegroProduct);
          }
        }
      }

      console.log(
        '🔎 Wynik wyszukiwania produktu Allegro:',
        allegroProduct
          ? `ID: ${allegroProduct.id}, Nazwa: ${allegroProduct.name}`
          : 'Nie znaleziono produktu'
      );

      if (!allegroProduct) {
        console.error(
          `❌ Nie znaleziono produktu dla oferty Allegro: ${offerId}`
        );
        await this.emailService.sendSyncError({
          offerId,
          stage: 'Wyszukiwanie produktu',
          error: 'Nie znaleziono produktu w bazie',
          productDetails: offerDetails,
        });
        return;
      }

      console.log(`🔍 Sprawdzanie powiązań produktu (matched_store_product):`);
      if (allegroProduct.matched_store_product) {
        console.log(`✅ Produkt ma powiązanie:`, {
          store_product_id:
            allegroProduct.matched_store_product.store_product_id,
          store_product_name:
            allegroProduct.matched_store_product.store_product_name,
          matched_at: allegroProduct.matched_store_product.matched_at,
        });
      } else {
        console.log(`⚠️ Produkt NIE ma powiązania z produktem w sklepie!`);
        console.log(
          `🔧 Tworzę automatyczne powiązanie produktu z samym sobą...`
        );

        // Automatyczne powiązanie produktu z samym sobą jeśli brak powiązania
        allegroProduct.matched_store_product = {
          store_product_id: allegroProduct.id,
          store_product_name: allegroProduct.name,
          matched_at: new Date(),
        };

        try {
          await this.productRepository.save(allegroProduct);
          console.log(
            `✅ Utworzono automatyczne powiązanie produktu z ID: ${allegroProduct.id}`
          );
        } catch (saveError) {
          console.error(
            `❌ Błąd podczas zapisywania automatycznego powiązania:`,
            saveError
          );
        }
      }

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      console.log('🔄 Rozpoczęto transakcję aktualizacji stanu');

      try {
        console.log(
          `📝 Aktualizuję produkt Allegro (ID: ${allegroProduct.id}) - nowy stan: ${newStock}`
        );
        await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({
            stock: newStock,
            marketplaces: () => `
              jsonb_set(
                marketplaces,
                '{allegro,stock}',
                '${newStock}'::jsonb
              )
            `,
          })
          .where('id = :id', { id: allegroProduct.id })
          .execute();
        console.log(`✅ Produkt Allegro zaktualizowany pomyślnie`);

        if (allegroProduct.matched_store_product) {
          const storeProductId =
            allegroProduct.matched_store_product.store_product_id;
          console.log(
            `🔄 Aktualizuję powiązany produkt w sklepie (ID: ${storeProductId}) - nowy stan: ${newStock}`
          );

          const updateResult = await queryRunner.manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock: newStock })
            .where('id = :id', { id: storeProductId })
            .execute();

          console.log(
            `✅ Powiązany produkt zaktualizowany, wynik: ${JSON.stringify(updateResult)}`
          );
        } else {
          console.log(`⚠️ Brak powiązanego produktu do aktualizacji`);
        }

        await queryRunner.commitTransaction();
        console.log(
          '✅ Transakcja zakończona sukcesem - stany magazynowe zsynchronizowane'
        );
      } catch (error) {
        console.error('❌ Błąd podczas transakcji:', error);
        await queryRunner.rollbackTransaction();
        console.error('❌ Transakcja wycofana z powodu błędu');
        throw error;
      } finally {
        await queryRunner.release();
        console.log('🔄 Zasoby transakcji zwolnione');
      }

      console.log(
        '📦 ===== ZAKOŃCZONO PRZETWARZANIE ZDARZENIA ZMIANY STANU ====='
      );
    } catch (error) {
      console.error('❌ Złapano błąd podczas przetwarzania zdarzenia:', error);
      await this.emailService.sendSyncError({
        offerId,
        stage: 'Przetwarzanie zdarzenia',
        error: error instanceof Error ? error.message : 'Nieznany błąd',
        productDetails: { event, error: JSON.stringify(error) },
      });
    }
  }

  public stopSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Synchronizacja zatrzymana');
    } else {
      console.log('ℹ️ Synchronizacja nie była uruchomiona');
    }
  }
}

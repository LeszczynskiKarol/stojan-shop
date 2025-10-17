// backend/src/services/allegro.service.ts

import axios from 'axios';
import { Repository } from 'typeorm';
import { allegroConfig } from '../config/allegro.config';
import { ALLEGRO_CATEGORIES } from '../config/allegro.constants';
import { AppDataSource } from '../config/database';
import { AllegroToken } from '../entities/AllegroToken';
import {
  AllegroOffer,
  AllegroOffersResponse,
  AllegroParameter,
  AllegroTokenData,
} from '../entities/AllegroTypes';
import { Product } from '../entities/Product';
import { parseAllegroDescription } from '../utils/allegroHelpers';
import { AllegroMappingService } from './allegro.mapping.service';
import { EmailService } from './email.service';

interface AllegroSmartResponse {
  classification: {
    fulfilled: boolean;
    lastChanged?: string;
    scheduledForReclassification?: boolean;
  };
  smartDeliveryMethods: Array<{
    id: string;
  }>;
  conditions?: Array<{
    code: string;
    name: string;
    description: string;
    fulfilled: boolean;
    passedDeliveryMethods?: string[];
    failedDeliveryMethods?: string[];
  }>;
}

interface GetOfferEventsParams {
  from?: string | null;
  limit?: number;
  type?: string[];
}

type ParameterKey =
  | 'MOC'
  | 'OBROTY'
  | 'NAPIECIE'
  | 'WAGA'
  | 'SREDNICA_WALU'
  | 'MODEL'
  | 'TYP_SILNIKA'
  | 'PRODUCENT'
  | 'MOC_ZNAMIONOWA'
  | 'RODZAJ';

interface AllegroParameterRaw {
  id: string;
  name: string;
  values: string[];
  valuesIds?: string[];
  rangeValue?: null;
}

export class AllegroService {
  private tokenRepository: Repository<AllegroToken>;
  private productRepository: Repository<Product>;
  private mappingService: AllegroMappingService;
  private emailService: EmailService;

  private cennikSmartDlaWagi = [
    { maxWaga: 1, id: '6c97494e-b06e-463e-8cf5-d36750d2ca31', smart: true }, // do 1kg
    { maxWaga: 4, id: '38161cbb-1386-4f17-96e3-4fae1f6de5ee', smart: true }, // do 4kg
    { maxWaga: 5, id: '5720f29c-89d2-4b8a-8e5b-4bc05d03ced4', smart: true }, // 4,5-5kg
    { maxWaga: 9, id: '28c0b642-2c0c-4b12-8e07-8116fd33f716', smart: true }, // 6,5-9kg
    { maxWaga: 13, id: '4225471b-4ca3-4a41-8af0-08a8bd8d0622', smart: true }, // 9,5-13kg
    { maxWaga: 18, id: '8ac507c5-5868-4f17-91cc-b76addadb954', smart: true }, // 13,5-18kg
    { maxWaga: 22, id: '452b15db-1f8b-4f16-b7cc-c882b7d8f4af', smart: true }, // 18,5-22kg
    { maxWaga: 27.5, id: 'f1570290-5db6-4614-bc16-0aeddbccd58f', smart: true }, // 22,5-27,5kg
    { maxWaga: 30, id: '592aba1b-5240-4589-8118-dd9d22306e66', smart: true }, // 28-30kg
    {
      maxWaga: Infinity,
      id: 'aa79662f-56d6-4f98-89c5-c960482c2c5f',
      smart: false,
    }, // powyżej 30kg - bez Smart!
  ];

  private wybierzCennikSmart(waga: number): string {
    console.log(`Wybieram cennik dla wagi: ${waga}kg`);

    // POPRAWKA - dla wag >30kg zwróć właściwy cennik
    if (waga > 30) {
      const bezSmartCennik = 'aa79662f-56d6-4f98-89c5-c960482c2c5f';
      console.log(
        `Paczka powyżej 30kg - używam cennika bez Smart: ${bezSmartCennik}`
      );
      return bezSmartCennik;
    }

    const cennik = this.cennikSmartDlaWagi.find(
      (c) => waga <= c.maxWaga && c.smart
    );
    console.log(`Wybrany cennik Smart dla ${waga}kg: ${cennik?.id}`);
    return cennik ? cennik.id : this.cennikSmartDlaWagi[0].id;
  }

  constructor() {
    this.tokenRepository = AppDataSource.getRepository(AllegroToken);
    this.productRepository = AppDataSource.getRepository(Product);
    this.mappingService = new AllegroMappingService();
    this.emailService = new EmailService();
  }

  async getAllOffers(page = 0, limit = 20) {
    try {
      process.stdout.write('\n=== START POBIERANIA OFERT ===\n');
      const accessToken = await this.getValidToken();
      process.stdout.write(`Token: ${accessToken.substring(0, 20)}...\n`);

      const offset = page * limit;
      const fetchResponse = await fetch(
        `${allegroConfig.apiUrl}/sale/offers?offset=${offset}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.allegro.public.v1+json',
            Connection: 'keep-alive',
          },
        }
      );
      process.stdout.write(
        `Status pierwszego zapytania: ${fetchResponse.status}\n`
      );

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        process.stdout.write(`Błąd pierwszego zapytania: ${errorText}\n`);
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      const response = {
        data: await fetchResponse.json(),
      } as { data: AllegroOffersResponse };

      process.stdout.write(
        `Liczba pobranych ofert: ${response.data.offers.length}\n`
      );

      const offersWithDetails: AllegroOffer[] = await Promise.all(
        response.data.offers.map(async (offer) => {
          try {
            process.stdout.write(
              `\nPobieranie szczegółów dla oferty ${offer.id}:\n`
            );
            const detailsResponse = await fetch(
              `${allegroConfig.apiUrl}/sale/product-offers/${offer.id}?include[]=description`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: 'application/vnd.allegro.public.v1+json',
                  Connection: 'keep-alive',
                },
              }
            );

            if (!detailsResponse.ok) {
              const errorText = await detailsResponse.text();
              process.stdout.write(
                `Błąd szczegółów oferty ${offer.id}: ${errorText}\n`
              );
              throw new Error(`HTTP error! status: ${detailsResponse.status}`);
            }
            const detailsData = (await detailsResponse.json()) as {
              description?: string;
              parameters?: AllegroParameterRaw[];
              productSet?: Array<{
                product?: {
                  parameters?: AllegroParameterRaw[];
                };
              }>;
              category?: {
                id: string;
              };
            };

            const baseParameters =
              detailsData.parameters?.map((p: AllegroParameterRaw) => ({
                ...p,
                values: p.values || [],
              })) || [];

            const productParameters =
              detailsData.productSet?.[0]?.product?.parameters?.map(
                (p: AllegroParameterRaw) => ({
                  ...p,
                  values: p.values || [],
                })
              ) || [];

            const getParmeterValue = (
              offer: any,
              categoryId: string,
              paramName: ParameterKey
            ): string => {
              const allParameters = [
                ...(offer.parameters || []),
                ...(offer.productSet?.[0]?.product?.parameters || []),
              ];

              let paramId = '';
              let paramNameToFind = '';

              if (categoryId === ALLEGRO_CATEGORIES.SILNIKI) {
                // Dla silników
                switch (paramName) {
                  case 'MOC':
                    paramId = '219137';
                    paramNameToFind = 'Moc';
                    break;
                  case 'OBROTY':
                    paramId = '219153';
                    paramNameToFind = 'Obroty';
                    break;
                  case 'NAPIECIE':
                    paramId = '219165';
                    paramNameToFind = 'Napięcie (V)';
                    break;
                  case 'WAGA':
                    paramId = '214478';
                    paramNameToFind = 'Waga';
                    break;
                  case 'SREDNICA_WALU':
                    paramId = '219149';
                    paramNameToFind = 'Średnica wału';
                    break;
                  case 'MODEL':
                    paramId = '237206';
                    paramNameToFind = 'Model';
                    break;
                  case 'PRODUCENT':
                    paramId = '248929';
                    paramNameToFind = 'Marka';
                    break;
                }
              } else if (categoryId === ALLEGRO_CATEGORIES.MOTOREDUKTORY) {
                // Dla motoreduktorów
                switch (paramName) {
                  case 'MOC':
                  case 'MOC_ZNAMIONOWA':
                    paramId = '11726';
                    paramNameToFind = 'Moc znamionowa';
                    break;
                  case 'OBROTY':
                    paramId = '221421';
                    paramNameToFind = 'Prędkość obrotowa';
                    break;
                  case 'WAGA':
                    paramId = '214694';
                    paramNameToFind = 'Waga';
                    break;
                  case 'SREDNICA_WALU':
                    paramId = '219149';
                    paramNameToFind = 'Średnica wału';
                    break;
                  case 'MODEL':
                    paramId = '237206';
                    paramNameToFind = 'Model';
                    break;
                  case 'RODZAJ':
                    paramId = '18654';
                    paramNameToFind = 'Rodzaj motoreduktora';
                    break;
                  case 'PRODUCENT':
                    paramId = '248929';
                    paramNameToFind = 'Marka';
                    break;
                }
              }

              // Najpierw szukamy po ID
              let param = allParameters.find((p) => p.id === paramId);

              // Jeśli nie znaleźliśmy po ID, szukamy po nazwie
              if (!param) {
                param = allParameters.find((p) => p.name === paramNameToFind);
              }

              return param?.values?.[0] || '';
            };

            const categoryId = detailsData.category?.id || '';

            // Określamy typ produktu na podstawie kategorii
            const productType =
              categoryId === ALLEGRO_CATEGORIES.SILNIKI
                ? 'silnik'
                : categoryId === ALLEGRO_CATEGORIES.MOTOREDUKTORY
                  ? 'motoreduktor'
                  : 'inny';

            // Teraz używamy tej kategorii w wywołaniach getParmeterValue
            const power = getParmeterValue(detailsData, categoryId, 'MOC');
            const voltage = getParmeterValue(
              detailsData,
              categoryId,
              'NAPIECIE'
            );
            const rpm = getParmeterValue(detailsData, categoryId, 'OBROTY');

            return {
              ...offer,
              ...detailsResponse,
              description: detailsData.description,
              parameters: [...baseParameters, ...productParameters],
              processedParameters: {
                power,
                voltage,
                rpm,
              },
            } as AllegroOffer;
          } catch (error) {
            console.error(
              `Błąd pobierania szczegółów oferty ${offer.id}:`,
              error
            );
            return offer;
          }
        })
      );

      return {
        offers: offersWithDetails,
        totalCount: response.data.totalCount,
        currentPage: page,
        totalPages: Math.ceil(response.data.totalCount / limit),
      };
    } catch (error) {
      console.error('Szczegóły błędu z Allegro:', error);
      throw error;
    }
  }

  public async clearAllAllegroData(): Promise<void> {
    try {
      console.log(
        'Rozpoczynam czyszczenie danych Allegro z wszystkich produktów...'
      );

      // Używamy raw query, aby zaktualizować wszystkie produkty jednocześnie
      await this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set({
          marketplaces: () =>
            "jsonb_set(marketplaces, '{allegro}', 'null'::jsonb)",
        })
        .where("marketplaces->'allegro' IS NOT NULL")
        .execute();

      // Alternatywnie, możemy też usunąć powiązanie matched_store_product dla produktów Allegro
      await this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set({
          matched_store_product: null,
        })
        .where('matched_store_product IS NOT NULL')
        .execute();

      console.log('Dane Allegro zostały pomyślnie wyczyszczone.');
    } catch (error) {
      console.error('Błąd podczas czyszczenia danych Allegro:', error);
      throw new Error('Nie udało się wyczyścić danych Allegro przed importem');
    }
  }

  async handleAuthCode(code: string): Promise<void> {
    const tokenData = await this.getTokenFromAuthCode(code);
    await this.saveToken(tokenData);
  }

  private async getTokenFromAuthCode(code: string): Promise<AllegroTokenData> {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', allegroConfig.redirectUri);

    const response = await axios.post(
      `${allegroConfig.authUrl}/token`,
      params,
      {
        auth: {
          username: allegroConfig.clientId,
          password: allegroConfig.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  public async getValidToken(): Promise<string> {
    try {
      const token = await this.tokenRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        console.log('Brak tokenu w bazie - próba pobrania nowego');
        return this.getNewToken();
      }

      if (new Date() >= token.expiresAt) {
        console.log('Token wygasł - próba odświeżenia');
        return this.refreshToken(token.refreshToken);
      }

      return token.accessToken;
    } catch (error) {
      console.error('Szczegółowy błąd getValidToken:', error);
      throw new Error('Nie udało się pobrać tokena autoryzacyjnego');
    }
  }

  private async saveToken(tokenData: AllegroTokenData): Promise<void> {
    if (!tokenData.access_token || !tokenData.refresh_token) {
      throw new Error('Brak wymaganych danych tokenu');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    const token = this.tokenRepository.create({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      expiresAt,
    });

    await this.tokenRepository.save(token);
  }

  async sprawdzStatusSmart(offerId: string) {
    try {
      const accessToken = await this.getValidToken();

      const url = `${allegroConfig.apiUrl}/sale/offers/${offerId}/smart`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.allegro.public.v1+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }

      const data = (await response.json()) as AllegroSmartResponse;

      // Sprawdź czy oferta jest Smart!
      const jestSmart = data.classification.fulfilled;

      // Sprawdź, które metody dostawy są Smart!
      const smartMetodyDostawy = data.smartDeliveryMethods.map(
        (method: { id: string }) => method.id
      );

      return {
        jestSmart,
        smartMetodyDostawy,
        pelnyRaport: data,
      };
    } catch (error) {
      console.error('Błąd sprawdzania statusu Smart!:', error);
      throw error;
    }
  }

  async createOffer(data: any) {
    const accessToken = await this.getValidToken();

    // Sprawdź, czy dane to produkt z bazy czy dane z formularza
    const isProduct = data.id && data.marketplaces;
    const allegroOffer = isProduct
      ? this.mappingService.mapProductToAllegroOffer(data)
      : data;

    console.log('Dane oferty do wysłania na Allegro:', allegroOffer);

    let productWeight = 0;
    if (data.weight) {
      // Z formularza
      productWeight = Number(data.weight);
    } else if (isProduct && data.marketplaces?.allegro?.parameters) {
      // Z parametrów oferty Allegro
      const wagaParam = data.marketplaces.allegro.parameters.find(
        (p: any) => p.id === '214478' || p.name === 'Waga'
      );
      productWeight = wagaParam ? Number(wagaParam.values[0]) : 0;
    } else if (allegroOffer.productSet?.[0]?.product?.parameters) {
      // Z parametrów produktu w ofercie
      const wagaParam = allegroOffer.productSet[0].product.parameters.find(
        (p: any) => p.id === '214478' || p.name === 'Waga'
      );
      productWeight = wagaParam ? Number(wagaParam.values[0]) : 0;
    }

    console.log(`Waga produktu: ${productWeight}kg`);

    // Wybierz odpowiedni cennik
    allegroOffer.delivery = {
      ...allegroOffer.delivery,
      handlingTime: 'PT24H',
      shippingRates: {
        id: this.wybierzCennikSmart(productWeight),
      },
    };

    // Dodatkowe sprawdzenia i poprawki danych
    if (!allegroOffer.stock || allegroOffer.stock.available <= 0) {
      allegroOffer.stock = { available: 1, unit: 'UNIT' };
    }

    // WAŻNA ZMIANA - konwersja formatu obrazów zgodnie z dokumentacją Allegro
    if (allegroOffer.images) {
      // Konwertuj obrazy na format zgodny z API Allegro (tablica stringów)
      const processedImages = [];

      for (const img of allegroOffer.images) {
        if (typeof img === 'string') {
          processedImages.push(img);
        } else if (img && typeof img === 'object' && img.url) {
          processedImages.push(img.url);
        }
      }

      allegroOffer.images = processedImages;

      // Jeśli nie mamy obrazów, dodaj placeholder
      if (allegroOffer.images.length === 0) {
        allegroOffer.images = [
          'https://via.placeholder.com/400x300?text=Brak+Zdjecia',
        ];
      }
    }

    // Inicjalizuj tablicę parameters, jeśli nie istnieje
    if (!allegroOffer.parameters) {
      allegroOffer.parameters = [];
    }

    // Dodaj wymagane parametry dla produktu, jeśli nie są już zdefiniowane
    if (allegroOffer.productSet && allegroOffer.productSet.length > 0) {
      if (!allegroOffer.productSet[0].product) {
        allegroOffer.productSet[0].product = {};
      }

      if (
        allegroOffer.parameters?.find((p: AllegroParameter) => p.id === '11323')
          ?.valuesIds?.[0] === '11323_2'
      ) {
        allegroOffer.productSet[0].marketedBeforeGPSRObligation = true;
      }

      // Dodaj wymagane dane bezpieczeństwa
      allegroOffer.productSet[0].responsibleProducer = {
        type: 'NAME',
        name: 'Stojan s.c.', // <--- TU ZMIEŃ! MUSI BYĆ DOKŁADNIE JAK W PANELU!
      };

      allegroOffer.productSet[0].safetyInformation = {
        type: 'TEXT',
        description:
          'Produkt spełnia wszystkie wymagania bezpieczeństwa UE. Przed użyciem zapoznaj się z instrukcją obsługi.',
      };

      // Upewnij się, że produkt ma nazwę
      allegroOffer.productSet[0].product.name = allegroOffer.name;

      // Upewnij się, że produkt ma obrazy
      allegroOffer.productSet[0].product.images = allegroOffer.images;

      // Dodaj wymagane parametry produktu, jeśli nie są już ustawione
      if (!allegroOffer.productSet[0].product.parameters) {
        allegroOffer.productSet[0].product.parameters = [];
      }

      // Sprawdź, czy wymagane parametry są już ustawione
      const hasModel = allegroOffer.productSet[0].product.parameters.some(
        (p: AllegroParameter) => p.id === '237206'
      );
      const hasEngineType = allegroOffer.productSet[0].product.parameters.some(
        (p: AllegroParameter) => p.id === '219145'
      );

      // Dla typu silnika sprawdź czy należy użyć jednofazowy
      if (
        !hasEngineType &&
        allegroOffer.category.id === ALLEGRO_CATEGORIES.SILNIKI
      ) {
        // Sprawdź czy nazwa wskazuje na silnik jednofazowy
        const isJednofazowy =
          allegroOffer.name.toLowerCase().includes('jednofazowy') ||
          (allegroOffer.description?.sections?.[0]?.items?.[0]?.content || '')
            .toLowerCase()
            .includes('jednofazowy');

        allegroOffer.productSet[0].product.parameters.push({
          id: '219145',
          name: 'Typ silnika',
          values: [isJednofazowy ? 'jednofazowy' : 'trójfazowy'],
          valuesIds: [isJednofazowy ? '219145_284933' : '219145_284937'],
        });
      } else if (allegroOffer.category.id === ALLEGRO_CATEGORIES.SILNIKI) {
        // Jeśli parametr już istnieje, zaktualizuj jego wartość
        const engineTypeParam =
          allegroOffer.productSet[0].product.parameters.find(
            (p: AllegroParameter) => p.id === '219145'
          );
        if (engineTypeParam) {
          // Sprawdź czy nazwa wskazuje na silnik jednofazowy
          const isJednofazowy =
            allegroOffer.name.toLowerCase().includes('1fazowy') ||
            (allegroOffer.description?.sections?.[0]?.items?.[0]?.content || '')
              .toLowerCase()
              .includes('1fazowy');

          engineTypeParam.values = [
            isJednofazowy ? 'jednofazowy' : 'trójfazowy',
          ];
          engineTypeParam.valuesIds = [
            isJednofazowy ? '219145_284933' : '219145_284937',
          ];
        }
      }
    }

    // KONIEC DODAWANEGO KODU

    // Logowanie poprawnych danych przed wysłaniem
    console.log(
      'Znormalizowane dane oferty przed wysłaniem do Allegro:',
      JSON.stringify(allegroOffer, null, 2)
    );

    try {
      try {
        // Sprawdź, czy dane JSON są poprawne
        const testJson = JSON.stringify(allegroOffer);
        JSON.parse(testJson); // Jeśli tutaj wystąpi błąd, to mamy problem z formatem danych
        console.log('Dane oferty są poprawnym JSON');
      } catch (error) {
        console.error('Błąd serializacji danych oferty:', error);
        throw new Error('Niepoprawny format danych oferty');
      }

      if (
        allegroOffer.productSet &&
        allegroOffer.productSet.length > 0 &&
        allegroOffer.images
      ) {
        // Upewnij się, że product istnieje
        if (!allegroOffer.productSet[0].product) {
          allegroOffer.productSet[0].product = {};
        }

        // Dodaj nazwę produktu, która jest wymagana przez Allegro
        allegroOffer.productSet[0].product.name = allegroOffer.name;

        // Dodaj obrazki do produktu
        allegroOffer.productSet[0].product.images = allegroOffer.images;
      }

      const response = await fetch(
        `${allegroConfig.apiUrl}/sale/product-offers`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.allegro.public.v1+json',
            Accept: 'application/vnd.allegro.public.v1+json',
          },
          body: JSON.stringify(allegroOffer),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Błąd API Allegro:', response.status, errorText);
        throw new Error(`Błąd API Allegro: ${response.status} - ${errorText}`);
      }

      const responseData = (await response.json()) as AllegroOffer;
      console.log('Odpowiedź z Allegro:', responseData);

      // Jeśli to był produkt z bazy, aktualizuj go
      if (isProduct && data.id) {
        data.marketplaces = {
          ...data.marketplaces,
          allegro: {
            ...data.marketplaces?.allegro,
            active: true,
            productId: responseData.id,
            url: `https://allegro.pl/oferta/${responseData.id}`,
          },
        };

        await this.productRepository.save(data);
      }

      return responseData;
    } catch (error: any) {
      console.error('Błąd API Allegro:', error.response?.data || error.message);

      // Sprawdź, czy błąd dotyczy niezgodności parametrów
      if (
        error.response?.data?.errors &&
        error.response.data.errors.some(
          (e: any) => e.code === 'PARAMETER_MISMATCH'
        )
      ) {
        console.log('Wykryto niezgodność parametrów - poprawiam wartości');

        // Pobierz poprawne wartości z komunikatów błędów
        const paramCorrections: Record<string, string> = {};

        error.response.data.errors.forEach((err: any) => {
          if (err.code === 'PARAMETER_MISMATCH') {
            // Wyciągnij ID parametru i poprawną wartość
            const paramIdMatch = err.message.match(/parameter '.*?'\((\d+)\)/);
            const correctValueMatch = err.userMessage.match(
              /which is (.*?)\. To list/
            );

            if (paramIdMatch && correctValueMatch) {
              const paramId = paramIdMatch[1];
              const correctValue = correctValueMatch[1];
              paramCorrections[paramId] = correctValue;
              console.log(
                `Parametr ${paramId} musi mieć wartość: ${correctValue}`
              );
            }
          }
        });

        // Popraw parametry w ofercie
        if (
          allegroOffer.productSet &&
          allegroOffer.productSet[0]?.product?.parameters
        ) {
          // Zdefiniujmy typ parametru dla lepszej czytelności
          interface AllegroParameter {
            id: string;
            values: string[];
            [key: string]: any; // Dla innych właściwości
          }

          allegroOffer.productSet[0].product.parameters =
            allegroOffer.productSet[0].product.parameters.map(
              (param: AllegroParameter) => {
                if (paramCorrections[param.id]) {
                  console.log(
                    `Zmieniam parametr ${param.id} z ${param.values[0]} na ${paramCorrections[param.id]}`
                  );
                  return {
                    ...param,
                    values: [paramCorrections[param.id]],
                  };
                }
                return param;
              }
            );

          // Spróbuj ponownie z poprawionymi parametrami
          console.log(
            'Ponawiam próbę z poprawionymi parametrami:',
            JSON.stringify(
              allegroOffer.productSet[0].product.parameters,
              null,
              2
            )
          );

          try {
            const retryResponse = await axios.post(
              `${allegroConfig.apiUrl}/sale/product-offers`,
              allegroOffer,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/vnd.allegro.public.v1+json',
                  Accept: 'application/vnd.allegro.public.v1+json',
                },
              }
            );

            console.log('Druga próba udana:', retryResponse.data);

            // Jeśli to był produkt z bazy, aktualizuj go
            if (isProduct && data.id) {
              data.marketplaces = {
                ...data.marketplaces,
                allegro: {
                  ...data.marketplaces?.allegro,
                  active: true,
                  productId: retryResponse.data.id,
                  url: `https://allegro.pl/oferta/${retryResponse.data.id}`,
                  price: parseFloat(
                    retryResponse.data.sellingMode?.price?.amount || '0'
                  ),
                  category: retryResponse.data.category,
                  parameters:
                    retryResponse.data.productSet?.[0]?.product?.parameters ||
                    [],
                  description: retryResponse.data.description,
                  stock: retryResponse.data.stock?.available,
                  images: retryResponse.data.images,
                  lastSyncAt: new Date(),
                  publication: retryResponse.data.publication,
                  validation: retryResponse.data.validation,
                },
              };

              await this.productRepository.save(data);
            }

            return retryResponse.data;
          } catch (retryError: unknown) {
            console.error(
              'Błąd ponownej próby:',
              retryError instanceof Error
                ? retryError.message
                : retryError instanceof axios.AxiosError && retryError.response
                  ? retryError.response.data
                  : 'Nieznany błąd'
            );

            throw retryError;
          }
        }
      }

      // Jeśli nie udało się poprawić parametrów lub to inny błąd, rzuć wyjątek
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((e: any) => e.userMessage || e.message || JSON.stringify(e))
          .join(', ');

        throw new Error(`Błąd API Allegro: ${errorMessages}`);
      }

      throw error;
    }
  }

  public async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await this.tokenRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        console.log('Brak tokenu - zwracam false');
        return false;
      }

      // Dodaj margines 5 minut przed wygaśnięciem
      const now = new Date();
      const expirationWithMargin = new Date(token.expiresAt);
      expirationWithMargin.setMinutes(expirationWithMargin.getMinutes() - 5);

      if (now >= expirationWithMargin) {
        try {
          await this.refreshToken(token.refreshToken);
          return true;
        } catch (error) {
          console.error('Błąd odświeżania tokenu:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Błąd sprawdzania statusu autoryzacji:', error);
      return false;
    }
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await axios.post(
      `${allegroConfig.authUrl}/token`,
      params,
      {
        auth: {
          username: allegroConfig.clientId,
          password: allegroConfig.clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    await this.saveToken(response.data);
    return response.data.access_token;
  }

  private async getNewToken(): Promise<string> {
    try {
      // To nie powinno być tutaj - powinno być w kontrolerze
      // Ten serwis nie powinien zajmować się przekierowaniami
      throw new Error(
        'Wymagana autoryzacja przez użytkownika - przekieruj do /api/allegro/auth'
      );
    } catch (error) {
      console.error('Błąd podczas pobierania nowego tokena:', error);
      throw error;
    }
  }

  public async getOfferById(id: string) {
    try {
      console.log(
        `🔍 [getOfferById] Rozpoczynam pobieranie szczegółów oferty: ${id}`
      );
      const accessToken = await this.getValidToken();
      console.log(
        `🔑 Token pobrany pomyślnie (pierwsze 10 znaków): ${accessToken.substring(0, 10)}...`
      );

      const url = `${allegroConfig.apiUrl}/sale/product-offers/${id}?include[]=parameters&include[]=productSet&include[]=description`;
      console.log(`🔍 Wysyłam zapytanie GET do: ${url}`);

      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.allegro.public.v1+json',
          Connection: 'keep-alive',
        },
      });

      console.log(
        `🔍 Status odpowiedzi HTTP: ${fetchResponse.status} ${fetchResponse.statusText}`
      );

      if (!fetchResponse.ok) {
        console.error(
          `❌ Błąd HTTP podczas pobierania oferty: ${fetchResponse.status}`
        );
        const errorText = await fetchResponse.text();
        console.error(`❌ Treść błędu: ${errorText}`);
        throw new Error(`HTTP error! status: ${fetchResponse.status}`);
      }

      // WAŻNE: Pobieramy JSON tylko RAZ!
      const responseData = (await fetchResponse.json()) as AllegroOffer;
      console.log(
        `📦 Stock w oryginalnej odpowiedzi API: ${JSON.stringify(responseData.stock, null, 2)}`
      );

      const baseParameters = responseData.parameters || [];
      const productParameters =
        responseData.productSet?.[0]?.product?.parameters || [];
      const allParameters = [...baseParameters, ...productParameters];

      const findParameter = (
        name: string,
        id: string
      ): AllegroParameter | undefined => {
        return allParameters.find((p) => p.name === name || p.id === id);
      };

      // Wyciągamy potrzebne wartości
      const powerParam = findParameter('Moc', '219137');
      const rpmParam = findParameter('Obroty', '219153');
      const voltageParam = findParameter('Napięcie (V)', '219165');
      const weightParam = findParameter('Waga', '214478');
      const shaftDiameterParam = findParameter('Średnica wału', '219149');
      const modelParam = findParameter('Model', '237206');

      // Dodajemy przetworzone parametry do odpowiedzi
      const enrichedResponse = {
        ...responseData,
        processedParameters: {
          power: powerParam?.values?.[0],
          rpm: rpmParam?.values?.[0],
          voltage: voltageParam?.values?.[0],
          weight: weightParam?.values?.[0],
          shaftDiameter: shaftDiameterParam?.values?.[0],
          model: modelParam?.values?.[0],
        },
      };
      console.log(
        `📦 Stock w końcowej odpowiedzi: ${JSON.stringify(enrichedResponse.stock, null, 2)}`
      );

      return enrichedResponse;
    } catch (error) {
      console.error('❌ Błąd podczas pobierania oferty:', error);
      throw new Error('Nie udało się pobrać oferty z Allegro');
    }
  }

  public async initializeToken(): Promise<void> {
    try {
      const token = await this.tokenRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        console.log('Brak tokenu - inicjalizacja pierwszego tokenu');
        await this.getNewToken();
      }
    } catch (error) {
      console.error('Błąd inicjalizacji tokenu:', error);
      throw new Error('Nie udało się zainicjalizować tokenu');
    }
  }

  async synchronizeSleeveDiameters(): Promise<void> {
    try {
      const allegroOffers = await this.getAllOffers(0, 1000);
      let zaktualizowaneProdukty = 0;

      for (const offer of allegroOffers.offers) {
        const descriptionData = parseAllegroDescription(offer.description);

        if (descriptionData?.srednicaTulei) {
          const matchingProduct = await this.productRepository.findOne({
            where: { name: offer.name },
          });

          if (matchingProduct) {
            matchingProduct.sleeveDiameter = parseFloat(
              descriptionData.srednicaTulei
            );
            await this.productRepository.save(matchingProduct);
            zaktualizowaneProdukty++;
          }
        }
      }
    } catch (error) {
      console.error('Błąd podczas synchronizacji średnic tulei:', error);
      throw error;
    }
  }
  async batchImportProducts(offers: AllegroOffer[]) {
    try {
      console.log('Rozpoczynam sprawdzanie produktów...');

      const importedProducts = await Promise.all(
        offers.map(async (offer) => {
          // Najpierw sprawdzamy czy produkt już istnieje
          const existingProduct = await this.productRepository
            .createQueryBuilder('product')
            .where(
              "product.marketplaces->'allegro'->>'productId' = :productId",
              { productId: offer.id }
            )
            .getOne();

          if (existingProduct) {
            // Sprawdzamy czy coś się zmieniło
            const hasChanges = this.checkForChanges(existingProduct, offer);

            if (!hasChanges) {
              console.log(`Produkt ${offer.id} nie wymaga aktualizacji`);
              return null; // Pomijamy ten produkt
            }

            console.log(`Aktualizuję produkt ${offer.id}`);
          } else {
            console.log(`Importuję nowy produkt ${offer.id}`);
          }
          let extractedDescription = '';
          if (typeof offer.description === 'string') {
            extractedDescription = offer.description;
          } else if (offer.description?.sections?.[0]?.items?.[0]?.content) {
            extractedDescription =
              offer.description.sections[0].items[0].content;
          }

          const opisProduktu = parseAllegroDescription(extractedDescription);
          const categoryId = offer.category?.id || '';

          // Przygotowujemy dane produktu zgodnie z Entity
          const productData: Partial<Product> = {
            name: offer.name,
            manufacturer:
              offer.parameters?.find((p) => p.id === '248929')?.values[0] ||
              offer.name.split(' ')[0],
            price: parseFloat(offer.sellingMode?.price?.amount || '0'),
            power: {
              value:
                offer.parameters?.find((p) =>
                  ['219137', '11726'].includes(p.id)
                )?.values[0] || '0',
              range: '',
            },
            rpm: {
              value:
                offer.parameters?.find((p) =>
                  ['219153', '221421'].includes(p.id)
                )?.values[0] || '0',
              range: '',
            },
            condition: (offer.parameters
              ?.find((p) => p.id === '11323')
              ?.values[0]?.toLowerCase()
              ?.replace('używany', 'uzywany') || 'nowy') as
              | 'nowy'
              | 'uzywany'
              | 'nieuzywany',
            shaftDiameter: opisProduktu?.srednicaWalu
              ? parseFloat(opisProduktu.srednicaWalu)
              : 0,
            sleeveDiameter: opisProduktu?.srednicaTulei
              ? parseFloat(opisProduktu.srednicaTulei)
              : 0,
            mechanicalSize: opisProduktu?.wielkoscMechaniczna
              ? parseInt(opisProduktu.wielkoscMechaniczna)
              : 0,
            stock: offer.stock?.available || 0,
            images:
              offer.images?.map((img) =>
                typeof img === 'string' ? img : img.url
              ) || [],
            marketplaces: {
              allegro: {
                active: offer.publication?.status === 'ACTIVE',
                productId: offer.id,
                price: parseFloat(offer.sellingMode?.price?.amount || '0'),
                url: `https://allegro.pl/oferta/${offer.id}`,
                description:
                  typeof offer.description === 'string'
                    ? {
                        sections: [{ items: [{ content: offer.description }] }],
                      }
                    : offer.description,
                parameters: offer.parameters,
                category: {
                  id: categoryId,
                },
                images: offer.images?.map((img) =>
                  typeof img === 'string' ? img : img.url
                ),
                wielkoscMechaniczna: opisProduktu?.wielkoscMechaniczna || '',
                waga: opisProduktu?.waga || '',
                srednicaWalu: opisProduktu?.srednicaWalu || '',
                napiecie: opisProduktu?.napiecie || '',
              },
            },
          };

          if (existingProduct) {
            // Aktualizujemy istniejący produkt
            Object.assign(existingProduct, productData);
            return await this.productRepository.save(existingProduct);
          } else {
            // Tworzymy nowy produkt
            const newProduct = this.productRepository.create(productData);
            return await this.productRepository.save(newProduct);
          }
        })
      );

      const actuallyImported = importedProducts.filter((p) => p !== null);
      console.log(
        `Zaimportowano/zaktualizowano ${actuallyImported.length} produktów`
      );
      return actuallyImported;
    } catch (error) {
      console.error('Błąd podczas importu:', error);
      throw error;
    }
  }

  private checkForChanges(
    existingProduct: Product,
    offer: AllegroOffer
  ): boolean {
    // Podstawowe porównanie
    if (
      existingProduct.marketplaces.allegro?.price !==
        parseFloat(offer.sellingMode?.price?.amount || '0') ||
      existingProduct.marketplaces.allegro?.stock !== offer.stock?.available ||
      existingProduct.marketplaces.allegro?.active !==
        (offer.publication?.status === 'ACTIVE')
    ) {
      return true;
    }

    // Porównanie parametrów
    const existingParams =
      existingProduct.marketplaces.allegro?.parameters || [];
    const newParams = offer.parameters || [];
    if (JSON.stringify(existingParams) !== JSON.stringify(newParams)) {
      return true;
    }

    // Możesz dodać więcej porównań jeśli potrzebujesz

    return false;
  }

  async getOfferEvents(params: GetOfferEventsParams) {
    try {
      console.log('📋 Parametry wejściowe getOfferEvents:', {
        from: params.from,
        limit: params.limit,
        type: params.type,
      });

      const accessToken = await this.getValidToken();
      console.log('🔑 Token pobrany dla getOfferEvents');

      const queryParams = new URLSearchParams();

      // Dodaj 'from' tylko jeśli nie jest null/undefined
      if (
        params.from !== null &&
        params.from !== undefined &&
        params.from !== ''
      ) {
        queryParams.append('from', params.from);
      }

      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      if (params.type && params.type.length > 0) {
        params.type.forEach((type) => queryParams.append('type', type));
      }

      const url = `${allegroConfig.apiUrl}/sale/offer-events${
        queryParams.toString() ? '?' + queryParams.toString() : ''
      }`;

      console.log('📡 Pełne URL zapytania:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.allegro.public.v1+json',
        },
      });

      console.log('📡 Status odpowiedzi:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Błąd API Allegro - status:', response.status);
        console.error('❌ Błąd API Allegro - treść:', errorBody);

        // Spróbuj sparsować jako JSON jeśli to możliwe
        try {
          const errorJson = JSON.parse(errorBody);
          console.error('❌ Błąd API Allegro - szczegóły:', errorJson);
        } catch (e) {
          // Ignoruj jeśli nie jest JSON
        }

        throw new Error(`Błąd pobierania zdarzeń: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('❌ Błąd w getOfferEvents:', error);
      throw error;
    }
  }

  async updateOfferStockById(
    offerId: string,
    newStock: number,
    retryCount = 0,
    maxRetries = 3
  ): Promise<void> {
    try {
      console.log(
        `🔄 [AllegroService] Rozpoczynam aktualizację oferty Allegro:`,
        {
          offerId,
          newStock,
          retry: retryCount,
          timestamp: new Date().toISOString(),
        }
      );
      const token = await this.getValidToken();
      console.log(`🔑 [AllegroService] Token pobrany pomyślnie`);
      const url = `${allegroConfig.apiUrl}/sale/product-offers/${offerId}`;
      console.log(`📡 [AllegroService] Wysyłam request do:`, url);
      const requestBody = {
        stock: {
          available: newStock,
          unit: 'UNIT',
        },
      };
      console.log(
        `📦 [AllegroService] Body requestu:`,
        JSON.stringify(requestBody)
      );
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.allegro.public.v1+json',
          Accept: 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log(`📡 [AllegroService] Status odpowiedzi:`, {
        status: response.status,
        statusText: response.statusText,
      });

      // Sprawdzamy czy otrzymaliśmy błąd 503 (Service Unavailable)
      if (response.status === 503 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Wykładnicze wycofanie: 1s, 2s, 4s, 8s itd.
        console.log(
          `⏱️ [AllegroService] Serwis niedostępny. Ponowna próba za ${delay}ms (${retryCount + 1}/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.updateOfferStockById(
          offerId,
          newStock,
          retryCount + 1,
          maxRetries
        );
      }

      const responseText = await response.text();
      console.log(`📝 [AllegroService] Pełna odpowiedź:`, responseText);

      if (!response.ok) {
        const errorMessage = `Błąd aktualizacji stanu oferty ${offerId}: ${response.statusText}\nBody: ${responseText}`;

        // Jeśli wyczerpaliśmy wszystkie próby, wysyłamy powiadomienie
        if (retryCount >= maxRetries - 1) {
          console.log(
            `📧 [AllegroService] Wysyłam powiadomienie email o błędzie po wszystkich próbach`
          );
          await this.emailService.sendSyncError({
            offerId,
            stage: 'aktualizacja stanu magazynowego',
            error: errorMessage,
            productDetails: {
              newStock,
              retries: retryCount + 1,
              maxRetries,
              lastStatus: response.status,
              timestamp: new Date().toISOString(),
            },
          });
        }

        throw new Error(errorMessage);
      }

      console.log(
        `✅ [AllegroService] Stan oferty ${offerId} zaktualizowany pomyślnie`
      );
    } catch (error) {
      console.error(`❌ [AllegroService] Błąd aktualizacji stanu:`, {
        offerId,
        newStock,
        error,
      });

      // Jeśli wyczerpaliśmy wszystkie próby i wystąpił ogólny błąd (nie HTTP), wysyłamy powiadomienie
      if (retryCount >= maxRetries - 1) {
        console.log(
          `📧 [AllegroService] Wysyłam powiadomienie email o ogólnym błędzie po wszystkich próbach`
        );
        await this.emailService.sendSyncError({
          offerId,
          stage: 'aktualizacja stanu magazynowego',
          error: error instanceof Error ? error.message : String(error),
          productDetails: {
            newStock,
            retries: retryCount + 1,
            maxRetries,
            timestamp: new Date().toISOString(),
          },
        });
      }

      throw error;
    }
  }

  async updateOfferPriceById(
    offerId: string,
    newPrice: number,
    retryCount = 0,
    maxRetries = 3
  ): Promise<void> {
    try {
      console.log(
        `🔄 [AllegroService] Rozpoczynam aktualizację ceny oferty Allegro:`,
        {
          offerId,
          newPrice,
          retry: retryCount,
          timestamp: new Date().toISOString(),
        }
      );
      const token = await this.getValidToken();
      console.log(`🔑 [AllegroService] Token pobrany pomyślnie`);
      const url = `${allegroConfig.apiUrl}/sale/product-offers/${offerId}`;
      console.log(`📡 [AllegroService] Wysyłam request do:`, url);
      const requestBody = {
        sellingMode: {
          price: {
            amount: newPrice.toString(),
            currency: 'PLN',
          },
        },
      };
      console.log(
        `💰 [AllegroService] Body requestu:`,
        JSON.stringify(requestBody)
      );
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.allegro.public.v1+json',
          Accept: 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log(`📡 [AllegroService] Status odpowiedzi:`, {
        status: response.status,
        statusText: response.statusText,
      });

      // Sprawdzamy czy otrzymaliśmy błąd 503 (Service Unavailable)
      if (response.status === 503 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Wykładnicze wycofanie: 1s, 2s, 4s, 8s itd.
        console.log(
          `⏱️ [AllegroService] Serwis niedostępny. Ponowna próba za ${delay}ms (${retryCount + 1}/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.updateOfferPriceById(
          offerId,
          newPrice,
          retryCount + 1,
          maxRetries
        );
      }

      const responseText = await response.text();
      console.log(`📝 [AllegroService] Pełna odpowiedź:`, responseText);

      if (!response.ok) {
        const errorMessage = `Błąd aktualizacji ceny oferty ${offerId}: ${response.statusText}\nBody: ${responseText}`;

        // Jeśli wyczerpaliśmy wszystkie próby, wysyłamy powiadomienie
        if (retryCount >= maxRetries - 1) {
          console.log(
            `📧 [AllegroService] Wysyłam powiadomienie email o błędzie po wszystkich próbach`
          );
          await this.emailService.sendSyncError({
            offerId,
            stage: 'aktualizacja ceny',
            error: errorMessage,
            productDetails: {
              newPrice,
              retries: retryCount + 1,
              maxRetries,
              lastStatus: response.status,
              timestamp: new Date().toISOString(),
            },
          });
        }

        throw new Error(errorMessage);
      }

      console.log(
        `✅ [AllegroService] Cena oferty ${offerId} zaktualizowana pomyślnie`
      );
    } catch (error) {
      console.error(`❌ [AllegroService] Błąd aktualizacji ceny:`, {
        offerId,
        newPrice,
        error,
      });

      // Jeśli wyczerpaliśmy wszystkie próby i wystąpił ogólny błąd (nie HTTP), wysyłamy powiadomienie
      if (retryCount >= maxRetries - 1) {
        console.log(
          `📧 [AllegroService] Wysyłam powiadomienie email o ogólnym błędzie po wszystkich próbach`
        );
        await this.emailService.sendSyncError({
          offerId,
          stage: 'aktualizacja ceny',
          error: error instanceof Error ? error.message : String(error),
          productDetails: {
            newPrice,
            retries: retryCount + 1,
            maxRetries,
            timestamp: new Date().toISOString(),
          },
        });
      }

      throw error;
    }
  }

  async changeOfferStatus(
    offerId: string,
    status: 'ACTIVATE' | 'END'
  ): Promise<any> {
    try {
      const tokens = await this.getValidToken();

      const url = `https://api.allegro.pl/sale/offer-publication-commands/${offerId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.allegro.public.v1+json',
          Authorization: `Bearer ${tokens}`,
          Accept: 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify({
          publicationStatus: status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Allegro API Error: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Błąd aktualizacji statusu oferty w Allegro:', error);
      throw error;
    }
  }

  async synchronizeStartTypes(): Promise<void> {
    try {
      console.log('Rozpoczynam synchronizację typów rozruchu z Allegro...');
      const allegroOffers = await this.getAllOffers(0, 1000);
      let zaktualizowaneProdukty = 0;

      for (const offer of allegroOffers.offers) {
        const descriptionData = parseAllegroDescription(offer.description);

        if (descriptionData?.rozruch) {
          // Mapuj opisy rozruchu z Allegro na wartości w naszej aplikacji
          let startType = null;
          const rozruch = descriptionData.rozruch.toLowerCase();

          if (rozruch.includes('bezpośredni') && rozruch.includes('220/380')) {
            startType = 'bezpośredni - 220/380V';
          } else if (
            rozruch.includes('bezpośredni') &&
            rozruch.includes('230/400')
          ) {
            startType = 'bezpośredni - 230/400V';
          } else if (
            rozruch.includes('gwiazda') &&
            rozruch.includes('380/660')
          ) {
            startType = 'gwiazda-trójkąt - 380/660V';
          } else if (
            rozruch.includes('gwiazda') &&
            rozruch.includes('400/690')
          ) {
            startType = 'gwiazda-trójkąt - 400/690V';
          } else if (rozruch.includes('gwiazda') && rozruch.includes('380v')) {
            startType = 'gwiazda-trójkąt - 380V△';
          } else if (rozruch.includes('gwiazda') && rozruch.includes('400v')) {
            startType = 'gwiazda-trójkąt - 400V△';
          } else if (rozruch.includes('bezpośredni')) {
            // Domyślny rozruch bezpośredni jeśli nie określono napięcia
            startType = 'bezpośredni - 230/400V';
          } else if (rozruch.includes('gwiazda')) {
            // Domyślny rozruch gwiazda-trójkąt jeśli nie określono napięcia
            startType = 'gwiazda-trójkąt - 400/690V';
          }

          if (startType) {
            // Znajdź produkt o takiej samej nazwie
            const matchingProduct = await this.productRepository.findOne({
              where: { name: offer.name },
            });

            if (matchingProduct) {
              matchingProduct.startType = startType;
              await this.productRepository.save(matchingProduct);
              zaktualizowaneProdukty++;
              console.log(
                `Zaktualizowano typ rozruchu dla produktu "${offer.name}" na "${startType}"`
              );
            }
          }
        }
      }

      console.log(
        `Zaktualizowano typy rozruchu dla ${zaktualizowaneProdukty} produktów`
      );
      return;
    } catch (error) {
      console.error('Błąd podczas synchronizacji typów rozruchu:', error);
      throw error;
    }
  }

  async updateOfferNameById(
    offerId: string,
    newName: string,
    retryCount = 0,
    maxRetries = 3
  ): Promise<void> {
    try {
      console.log(
        '🔄 [AllegroService] Rozpoczynam aktualizację nazwy oferty Allegro:',
        {
          offerId,
          newName,
          retry: retryCount,
          timestamp: new Date().toISOString(),
        }
      );
      const token = await this.getValidToken();
      console.log(`🔑 [AllegroService] Token pobrany pomyślnie`);
      const url = `${allegroConfig.apiUrl}/sale/product-offers/${offerId}`;
      console.log(`📡 [AllegroService] Wysyłam request do:`, url);
      const requestBody = {
        name: newName,
      };
      console.log(
        `📦 [AllegroService] Body requestu:`,
        JSON.stringify(requestBody)
      );
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.allegro.public.v1+json',
          Accept: 'application/vnd.allegro.public.v1+json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log(`📡 [AllegroService] Status odpowiedzi:`, {
        status: response.status,
        statusText: response.statusText,
      });

      // Sprawdzamy czy otrzymaliśmy błąd 503 (Service Unavailable)
      if (response.status === 503 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Wykładnicze wycofanie: 1s, 2s, 4s, 8s itd.
        console.log(
          `⏱️ [AllegroService] Serwis niedostępny. Ponowna próba za ${delay}ms (${retryCount + 1}/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.updateOfferNameById(
          offerId,
          newName,
          retryCount + 1,
          maxRetries
        );
      }

      const responseText = await response.text();
      console.log(`📝 [AllegroService] Pełna odpowiedź:`, responseText);

      if (!response.ok) {
        const errorMessage = `Błąd aktualizacji nazwy oferty ${offerId}: ${response.statusText}\nBody: ${responseText}`;

        // Jeśli wyczerpaliśmy wszystkie próby, wysyłamy powiadomienie
        if (retryCount >= maxRetries - 1) {
          console.log(
            `📧 [AllegroService] Wysyłam powiadomienie email o błędzie po wszystkich próbach`
          );
          await this.emailService.sendSyncError({
            offerId,
            stage: 'aktualizacja nazwy',
            error: errorMessage,
            productDetails: {
              newName,
              retries: retryCount + 1,
              maxRetries,
              lastStatus: response.status,
              timestamp: new Date().toISOString(),
            },
          });
        }

        throw new Error(errorMessage);
      }

      console.log(
        `✅ [AllegroService] Nazwa oferty ${offerId} zaktualizowana pomyślnie`
      );
    } catch (error) {
      console.error(`❌ [AllegroService] Błąd aktualizacji nazwy:`, {
        offerId,
        newName,
        error,
      });

      // Jeśli wyczerpaliśmy wszystkie próby i wystąpił ogólny błąd (nie HTTP), wysyłamy powiadomienie
      if (retryCount >= maxRetries - 1) {
        console.log(
          `📧 [AllegroService] Wysyłam powiadomienie email o ogólnym błędzie po wszystkich próbach`
        );
        await this.emailService.sendSyncError({
          offerId,
          stage: 'aktualizacja nazwy',
          error: error instanceof Error ? error.message : String(error),
          productDetails: {
            newName,
            retries: retryCount + 1,
            maxRetries,
            timestamp: new Date().toISOString(),
          },
        });
      }

      throw error;
    }
  }
}

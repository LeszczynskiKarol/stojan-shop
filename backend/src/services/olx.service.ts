// backend/src/services/olx.service.ts
import axios from 'axios';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { olxConfig, OLX_CATEGORIES, OLX_DEFAULTS } from '../config/olx.config';
import { OlxToken } from '../entities/OlxToken';
import { Product } from '../entities/Product';

export class OlxService {
  private tokenRepository: Repository<OlxToken>;
  private productRepository: Repository<Product>;

  constructor() {
    this.tokenRepository = AppDataSource.getRepository(OlxToken);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  // Autoryzacja
  async getAuthUrl(): Promise<string> {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: olxConfig.clientId,
      scope: olxConfig.scope,
      redirect_uri: olxConfig.redirectUri,
      state: Math.random().toString(36).substring(7), // Losowy state dla bezpieczeństwa
    });

    return `${olxConfig.authUrl}/authorize?${params.toString()}`;
  }

  async handleAuthCode(code: string): Promise<void> {
    try {
      const tokenData = await this.getTokenFromAuthCode(code);
      await this.saveToken(tokenData);
      console.log('✅ Token OLX zapisany pomyślnie');
    } catch (error) {
      console.error('❌ Błąd podczas pozyskiwania tokena OLX:', error);
      throw new Error('Nie udało się pozyskać tokena autoryzacyjnego OLX');
    }
  }

  private async getTokenFromAuthCode(code: string) {
    console.log('🔐 Client ID:', olxConfig.clientId);
    console.log(
      '🔐 Client Secret:',
      olxConfig.clientSecret.substring(0, 10) + '...'
    );
    console.log('🔐 Redirect URI:', olxConfig.redirectUri);
    console.log('🔐 Code:', code);

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: olxConfig.redirectUri,
      client_id: olxConfig.clientId,
      client_secret: olxConfig.clientSecret,
      scope: olxConfig.scope,
    });

    const response = await axios.post(
      `${olxConfig.apiOpenUrl}/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  }

  private async saveToken(tokenData: any) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Usuń stare tokeny
    await this.tokenRepository.delete({});

    const token = this.tokenRepository.create({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      expiresAt,
    });

    await this.tokenRepository.save(token);
  }

  private async getValidToken(): Promise<string> {
    console.log('🔍 Szukam tokenu w bazie...');

    // POPRAWKA - dodaj where:
    const token = await this.tokenRepository.findOne({
      where: {}, // Pusty where = pobierz jakikolwiek
      order: { createdAt: 'DESC' },
    });

    console.log('📌 Token z bazy:', token ? 'Znaleziono' : 'BRAK!');

    if (!token) {
      throw new Error('Brak tokenu autoryzacyjnego OLX. Proszę się zalogować.');
    }

    console.log('📅 Token expires at:', token.expiresAt);
    console.log('📅 Current time:', new Date());

    if (new Date() >= token.expiresAt) {
      console.log('🔄 Token wygasł, odświeżam...');
      return this.refreshToken(token.refreshToken);
    }

    console.log('✅ Token jest ważny');
    return token.accessToken;
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: olxConfig.clientId,
        client_secret: olxConfig.clientSecret,
      });

      const response = await axios.post(
        `${olxConfig.apiOpenUrl}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      await this.saveToken(response.data);
      console.log('✅ Token OLX odświeżony');
      return response.data.access_token;
    } catch (error: any) {
      console.error(
        '❌ Błąd podczas odświeżania tokenu:',
        error.response?.data
      );
      throw new Error('Błąd podczas odświeżania tokenu OLX');
    }
  }

  // Pobieranie ofert użytkownika

  async getUserAdverts(params?: {
    offset?: number;
    limit?: number;
    category_ids?: string;
    external_id?: string;
  }) {
    try {
      const accessToken = await this.getValidToken();
      console.log('🔑 Token pobrany:', accessToken.substring(0, 20) + '...');

      const queryParams = new URLSearchParams();
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      // PRAWIDŁOWY ENDPOINT Z DOKUMENTACJI!
      const url = `https://www.olx.pl/api/partner/adverts?${queryParams.toString()}`;
      console.log('📡 Request URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2.0', // Z kropką!
          Accept: 'application/json',
        },
      });

      console.log('✅ Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error details:');
      if (error.response?.data?.error?.validation) {
        console.error(
          'Validation errors:',
          JSON.stringify(error.response.data.error.validation, null, 2)
        );
      }

      // Jeśli nie masz ofert, zwróć pustą listę
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('📭 Brak ofert - zwracam pustą listę');
        return { data: [] };
      }

      throw error;
    }
  }

  // Import wszystkich ofert do bazy
  async importAllAdverts() {
    try {
      let offset = 0;
      const limit = 100;
      let totalImported = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await this.getUserAdverts({ offset, limit });
        const adverts = response.data || [];

        if (adverts.length === 0) {
          hasMore = false;
          break;
        }

        // Zapisz oferty do bazy
        for (const advert of adverts) {
          await this.saveAdvertToDatabase(advert);
          totalImported++;
        }

        console.log(`📦 Zaimportowano ${totalImported} ofert z OLX`);

        offset += limit;
        if (adverts.length < limit) {
          hasMore = false;
        }
      }

      return { success: true, totalImported };
    } catch (error) {
      console.error('❌ Błąd podczas importu ofert:', error);
      throw error;
    }
  }

  private async saveAdvertToDatabase(advert: any) {
    try {
      // Poprawka: TypeORM nie obsługuje zagnieżdżonych ścieżek w where
      // Musimy użyć QueryBuilder lub raw query
      const existingProducts = await this.productRepository
        .createQueryBuilder('product')
        .where("(product.marketplaces->'olx'->>'advertId') = :advertId", {
          advertId: advert.id.toString(),
        })
        .getMany();

      let product = existingProducts[0];

      if (!product) {
        // Poprawka: najpierw tworzymy obiekt, potem używamy create()
        const productData = {
          name: advert.title,
          manufacturer: this.extractManufacturer(advert.title),
          price: advert.price?.value || 0,
          condition: this.mapCondition(advert),
          stock: 1,
          images: advert.images?.map((img: any) => img.url) || [],
          mainImage: advert.images?.[0]?.url || '',
          galleryImages:
            advert.images?.slice(1).map((img: any) => img.url) || [],
          marketplaces: {
            olx: {
              active: advert.status === 'active',
              advertId: advert.id.toString(),
              price: advert.price?.value,
              url: advert.url,
              status: advert.status,
              validTo: advert.valid_to ? new Date(advert.valid_to) : undefined,
              createdAt: new Date(advert.created_at),
              activatedAt: advert.activated_at
                ? new Date(advert.activated_at)
                : undefined,
              title: advert.title,
              description: advert.description,
              categoryId: advert.category_id,
              advertiserType: advert.advertiser_type,
              location: advert.location,
              images: advert.images?.map((img: any) => img.url),
              attributes: advert.attributes,
            },
          },
          // Pola wymagane
          power: { value: '0', range: '0' },
          rpm: { value: '0', range: '0' },
          shaftDiameter: 0,
          mechanicalSize: 0,
          weight: 0,
        };

        product = this.productRepository.create(productData);
      } else {
        // Aktualizuj istniejący produkt
        if (!product.marketplaces) {
          product.marketplaces = {};
        }

        product.marketplaces.olx = {
          active: advert.status === 'active',
          advertId: advert.id.toString(),
          price: advert.price?.value,
          url: advert.url,
          status: advert.status,
          validTo: advert.valid_to ? new Date(advert.valid_to) : undefined,
          createdAt: new Date(advert.created_at),
          activatedAt: advert.activated_at
            ? new Date(advert.activated_at)
            : undefined,
          title: advert.title,
          description: advert.description,
          categoryId: advert.category_id,
          advertiserType: advert.advertiser_type,
          location: advert.location,
          images: advert.images?.map((img: any) => img.url),
          attributes: advert.attributes,
        };
      }

      await this.productRepository.save(product);
      console.log(`✅ Zapisano ofertę OLX: ${advert.title}`);
    } catch (error) {
      console.error(`❌ Błąd zapisywania oferty ${advert.id}:`, error);
    }
  }

  private extractManufacturer(title: string): string {
    // Próbuj wyodrębnić producenta z tytułu
    const manufacturers = ['SEW', 'SIEMENS', 'ABB', 'WEG', 'NORD', 'LENZE'];
    for (const manufacturer of manufacturers) {
      if (title.toUpperCase().includes(manufacturer)) {
        return manufacturer;
      }
    }
    return 'Nieznany';
  }

  private mapCondition(advert: any): 'nowy' | 'uzywany' | 'nieuzywany' {
    const stateAttr = advert.attributes?.find(
      (attr: any) => attr.code === 'state'
    );
    if (stateAttr?.value === 'new') return 'nowy';
    if (stateAttr?.value === 'used') return 'uzywany';
    return 'uzywany'; // Domyślnie
  }

  // Pobierz kategorie
  async getCategories(parentId?: number) {
    try {
      const accessToken = await this.getValidToken();

      const url = parentId
        ? `${olxConfig.apiUrl}/categories?parent_id=${parentId}`
        : `${olxConfig.apiUrl}/categories`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2.0',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Błąd podczas pobierania kategorii:',
        error.response?.data
      );
      throw new Error('Nie udało się pobrać kategorii z OLX');
    }
  }

  // Sprawdź status autoryzacji
  async checkAuthStatus() {
    try {
      const token = await this.tokenRepository.findOne({
        where: {}, // DODAJ WHERE
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        return { authenticated: false, message: 'Brak tokenu' };
      }

      const isExpired = new Date() >= token.expiresAt;

      if (isExpired) {
        try {
          await this.refreshToken(token.refreshToken);
          return { authenticated: true, message: 'Token odświeżony' };
        } catch {
          return {
            authenticated: false,
            message: 'Token wygasł i nie można go odświeżyć',
          };
        }
      }

      return {
        authenticated: true,
        message: 'Autoryzacja aktywna',
        expiresAt: token.expiresAt,
      };
    } catch (error) {
      console.error('❌ checkAuthStatus error:', error);
      return { authenticated: false, message: 'Błąd sprawdzania autoryzacji' };
    }
  }

  async findCategoriesForMotors() {
    try {
      const accessToken = await this.getValidToken();

      // Pobierz główne kategorie
      const mainCategories = await axios.get(`${olxConfig.apiUrl}/categories`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: '2.0',
        },
      });

      // Szukamy kategorii związanych z maszynami/przemysłem
      const relevantCategories = [];

      for (const category of mainCategories.data) {
        if (
          category.name.toLowerCase().includes('biznes') ||
          category.name.toLowerCase().includes('przemysł') ||
          category.name.toLowerCase().includes('maszyn')
        ) {
          // Pobierz podkategorie
          const subCategories = await axios.get(
            `${olxConfig.apiUrl}/categories?parent_id=${category.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Version: '2.0',
              },
            }
          );

          relevantCategories.push({
            main: category,
            sub: subCategories.data,
          });
        }
      }

      return relevantCategories;
    } catch (error: any) {
      console.error('❌ Błąd szukania kategorii:', error.response?.data);
      throw error;
    }
  }
  async updateAdvert(advertId: string, updates: any) {
    try {
      const accessToken = await this.getValidToken();

      const response = await axios.put(
        `${olxConfig.apiUrl}/adverts/${advertId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Version: '2.0',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Błąd aktualizacji oferty:', error.response?.data);
      throw error;
    }
  }

  async extendAdvert(advertId: string) {
    try {
      const accessToken = await this.getValidToken();

      const response = await axios.post(
        `${olxConfig.apiUrl}/adverts/${advertId}/commands`,
        { command: 'extend' },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Version: '2.0',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Błąd przedłużania oferty:', error.response?.data);
      throw error;
    }
  }
}

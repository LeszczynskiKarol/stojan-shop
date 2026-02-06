// backend/src/services/allegro.mapping.service.ts
import { Product } from '../entities/Product';
import { AllegroParameter } from '../entities/AllegroTypes';
import {
  PARAMETRY_WSPOLNE,
  SILNIKI_PARAMETRY,
  ALLEGRO_DEFAULTS,
} from '../config/allegro.constants';

export class AllegroMappingService {
  mapProductToAllegroOffer(product: Product) {
    const allegroPrice =
      product.marketplaces?.allegro?.price ||
      product.marketplaces?.ownStore?.price;
    if (!allegroPrice) {
      throw new Error('Brak ceny dla oferty Allegro');
    }
    console.log('Mapowanie produktu na ofertę Allegro:', {
      product: {
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: product.marketplaces?.allegro?.price,
      },
    });

    const productName = this.generateTitle(product);

    return {
      name: productName,
      category: { id: ALLEGRO_DEFAULTS.CATEGORY_ID },
      parameters: this.mapParameters(product),
      description: {
        sections: [
          {
            items: [
              {
                type: 'TEXT',
                content: this.generateDescription(product),
              },
            ],
          },
        ],
      },
      images: product.mainImage ? [product.mainImage] : [],
      productSet: [
        {
          product: {
            name: productName,
            images: product.mainImage ? [product.mainImage] : [],
            parameters: [
              // Parametry wymagane przez Allegro
              {
                id: SILNIKI_PARAMETRY.MODEL,
                name: 'Model',
                values: [`Silnik-${product.mechanicalSize || 'Standard'}`],
              },
              {
                id: SILNIKI_PARAMETRY.ENGINE_TYPE.ID,
                name: 'Rodzaj silnika',
                values: ['trójfazowy'],
                valuesIds: [SILNIKI_PARAMETRY.ENGINE_TYPE.VALUES.ELECTRIC],
              },
              {
                id: SILNIKI_PARAMETRY.PRODUCENT,
                name: 'Marka',
                values: ['Inni'],
              },

              {
                id: SILNIKI_PARAMETRY.MOC,
                name: 'Moc',
                values: [product.power?.value || '0'],
                unit: 'kW',
              },
              {
                id: SILNIKI_PARAMETRY.OBROTY,
                name: 'Obroty',
                values: [product.rpm?.value || '0'],
                unit: 'obr/min',
              },
              {
                id: SILNIKI_PARAMETRY.SREDNICA_WALU,
                name: 'Średnica wału',
                values: [product.shaftDiameter?.toString() || '0'],
                unit: 'mm',
              },
              {
                id: SILNIKI_PARAMETRY.NAPIECIE,
                name: 'Napięcie (V)',
                values: [product.startType?.match(/\d+/g)?.[0] || '400'],
                unit: 'V',
              },
              {
                id: SILNIKI_PARAMETRY.WAGA,
                name: 'Waga',
                values: [product.weight?.toString() || '0'],
                unit: 'kg',
              },
            ],
          },
        },
      ],
      delivery: {
        shippingRates: { id: ALLEGRO_DEFAULTS.SHIPPING_RATE_ID },
        handlingTime: ALLEGRO_DEFAULTS.HANDLING_TIME,
      },
      sellingMode: {
        format: 'BUY_NOW',
        price: {
          amount: allegroPrice.toString(),
          currency: 'PLN',
        },
      },
      stock: {
        available: product.stock,
        unit: 'UNIT',
      },
      location: {
        countryCode: 'PL',
        province: 'KUJAWSKO_POMORSKIE',
        city: 'Łubianka',
        postCode: '87-152',
      },
      payments: { invoice: 'VAT' },
    };
  }

  private mapParameters(product: Product): AllegroParameter[] {
    return [
      {
        id: PARAMETRY_WSPOLNE.CONDITION.ID,
        name: 'Stan',
        values: [product.condition === 'nowy' ? 'Nowy' : 'Używany'],
        valuesIds: [
          product.condition === 'nowy'
            ? PARAMETRY_WSPOLNE.CONDITION.VALUES.NEW
            : PARAMETRY_WSPOLNE.CONDITION.VALUES.USED,
        ],
      },
      // DODANO parametr Marka
      {
        id: '248929',
        name: 'Marka',
        values: ['Inni'],
      },
      // DODANO rodzaj silnika (wymagany przez Allegro)
      {
        id: '219157',
        name: 'Rodzaj silnika',
        values: ['elektryczny'],
        valuesIds: ['219157_284941'],
      },
    ].filter((param) => {
      // Filtrujemy puste wartości
      if (param.values && Array.isArray(param.values)) {
        return param.values.length > 0 && param.values[0] !== '';
      }
      if (param.valuesIds && Array.isArray(param.valuesIds)) {
        return param.valuesIds.length > 0;
      }
      return false;
    });
  }

  private generateTitle(product: Product): string {
    return `Silnik elektryczny ${product.power?.value || ''}kW ${product.rpm?.value || ''}obr. ${
      product.condition === 'nowy' ? 'NOWY' : 'używany'
    }`;
  }

  private generateDescription(product: Product): string {
    return `
SILNIK ELEKTRYCZNY
TRÓJFAZOWY
${product.condition === 'nowy' ? 'NOWY' : '(po remoncie gotowy do pracy)'}

${product.power?.value || ''}kW ${product.rpm?.value || ''}obr.

Parametry techniczne:
- średnica wału: ${product.shaftDiameter || ''}mm
${product.sleeveDiameter ? `- średnica tulei: ${product.sleeveDiameter}mm\n` : ''}
${product.flangeSize ? `- rozmiar kołnierza: ${product.flangeSize}mm\n` : ''}
- rozruch: ${product.startType || ''}
- wielkość mechaniczna: ${product.mechanicalSize || ''}

Gwarancja rozruchowa: 1 miesiąc
Faktura VAT
Transport: organizujemy transport na terenie całego kraju

Zapraszamy do kontaktu!
    `.trim();
  }
}

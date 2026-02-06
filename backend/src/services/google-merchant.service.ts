// backend/src/services/google-merchant.service.ts
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { SHIPPING_METHODS } from '../config/shipping.config';

export class GoogleMerchantService {
  private productService: ProductService;
  private categoryService: CategoryService;
  private baseUrl: string =
    process.env.FRONTEND_URL || 'https://www.silniki-elektryczne.com.pl';

  constructor() {
    this.productService = new ProductService();
    this.categoryService = new CategoryService();
  }

  async generateFeed() {
    const products = await this.productService.getProducts(
      { inStock: true },
      undefined
    );

    const xmlItems = await Promise.all(
      products.products.map(async (product) => {
        const category = product.categories?.[0];
        const categoryPath = category
          ? await this.buildCategoryPath(category)
          : '';

        const description = this.cleanDescription(
          product.description || product.name
        );

        // Sprawdzamy i konwertujemy cenę
        const price = Number(product.price);
        if (isNaN(price) || price <= 0) {
          console.warn(
            `Pominięto produkt ${product.name} - nieprawidłowa cena`
          );
          return null;
        }

        // Sprawdzamy i konwertujemy wagę
        const weight = Number(product.weight);
        if (isNaN(weight) || weight <= 0) {
          console.warn(
            `Pominięto produkt ${product.name} - nieprawidłowa waga`
          );
          return null;
        }

        return `
          <item>
            <g:id>${product.id}</g:id>
            <g:title>${product.name}</g:title>
            <g:description>${description}</g:description>
            <g:link>${this.baseUrl}/${category?.slug || 'produkty'}/${product.marketplaces.ownStore?.slug || ''}</g:link>
            <g:image_link>${product.mainImage || product.images[0]}</g:image_link>
            <g:additional_image_link>${product.images
              .slice(1, 10)
              .filter((url) => url && url.startsWith('http'))
              .join(',')}</g:additional_image_link>
            <g:availability>${product.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
            <g:price>${price.toFixed(2)} PLN</g:price>
            <g:brand>${product.manufacturer || 'Generic'}</g:brand>
            <g:condition>${product.condition === 'nowy' ? 'new' : 'used'}</g:condition>
            <g:identifier_exists>no</g:identifier_exists>
            <g:google_product_category>${this.mapToGoogleCategory(categoryPath)}</g:google_product_category>
            <g:product_type>Przemysłowe > ${categoryPath}</g:product_type>
            <g:shipping>
              <g:country>PL</g:country>
              <g:service>Standard</g:service>
              <g:price>${this.calculateShippingCost(weight).toFixed(2)} PLN</g:price>
            </g:shipping>
            <g:shipping_weight>${weight} kg</g:shipping_weight>
            <g:custom_label_0>Moc ${product.power.value}</g:custom_label_0>
            <g:custom_label_1>Obroty ${product.rpm.value}</g:custom_label_1>
            <g:custom_label_2>Wielkość ${product.mechanicalSize || ''}</g:custom_label_2>
            <g:custom_label_3>Rozruch ${product.startType || ''}</g:custom_label_3>
            <g:custom_label_4>Wał ${product.shaftDiameter ? `${product.shaftDiameter}mm` : ''}</g:custom_label_4>
          </item>
        `.trim();
      })
    );

    const validItems = xmlItems.filter((item) => item !== null);

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
      <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
        <channel>
          <title>Silniki-elektryczne.com.pl</title>
          <link>${this.baseUrl}</link>
          <description>Feed produktowy silniki-elektryczne.com.pl</description>
          ${validItems.join('\n')}
        </channel>
      </rss>`;

    return feed;
  }

  private cleanDescription(description: string): string {
    // Usuń tagi HTML i ogranicz długość
    return description.replace(/<[^>]*>/g, '').substring(0, 5000);
  }

  private async buildCategoryPath(category: any): Promise<string> {
    const categories = [];
    let currentCat = category;

    while (currentCat) {
      categories.unshift(currentCat.name);
      currentCat = currentCat.parent;
    }

    return categories.join(' > ');
  }

  private mapToGoogleCategory(categoryPath: string): number {
    // Mapowanie kategorii na oficjalne ID Google
    // https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
    const categoryMappings: Record<string, number> = {
      'Silniki trójfazowe': 5613, // Przykładowe ID
      'Silniki jednofazowe': 5613,
      'Wentylatory przemysłowe': 505284,
      Motoreduktory: 5613,
    };

    const category = Object.keys(categoryMappings).find((cat) =>
      categoryPath.toLowerCase().includes(cat.toLowerCase())
    );

    return category ? categoryMappings[category] : 5613; // Domyślna kategoria
  }

  private calculateShippingCost(weight: number): number {
    // Użyj logiki z shipping.config.ts
    const shippingMethod = SHIPPING_METHODS[0];
    const rate = shippingMethod.rates.find(
      (r) => weight >= r.minWeight && weight <= r.maxWeight
    );

    return rate?.prepaidCost || 29; // Domyślna wartość
  }

  private validateProduct(product: any) {
    if (!product.name) throw new Error('Brak nazwy produktu');
    if (!product.price || product.price <= 0)
      throw new Error('Nieprawidłowa cena');
    if (!product.image_link) throw new Error('Brak obrazu produktu');
    if (!product.description) {
      product.description = product.name; // Użyj nazwy jako opisu
    }
    return true;
  }
}

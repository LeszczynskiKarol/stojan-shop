// backend/src/controllers/shipping.controller.ts
import { Request, Response } from 'express';
import { SHIPPING_METHODS } from '../config/shipping.config';
import { ApiResponse } from '../utils/apiResponse';
import { ProductService } from '../services/product.service';

export class ShippingController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  public calculateShippingCost = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { items, paymentMethod } = req.body;

      // Dodajemy pełniejszą walidację
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Brak produktów do wysyłki',
        });
        return;
      }

      // Sprawdzamy każdy przedmiot
      for (const item of items) {
        if (
          !item.productId ||
          typeof item.quantity !== 'number' ||
          item.quantity <= 0
        ) {
          res.status(400).json({
            success: false,
            error: 'Nieprawidłowe dane produktu',
          });
          return;
        }

        // Sprawdzamy czy produkt istnieje
        try {
          await this.productService.getProductById(item.productId);
        } catch (error) {
          res.status(400).json({
            success: false,
            error: `Nie znaleziono produktu o ID: ${item.productId}`,
          });
          return;
        }
      }

      if (!paymentMethod || !['prepaid', 'cod'].includes(paymentMethod)) {
        res.status(400).json({
          success: false,
          error: 'Nieprawidłowa metoda płatności',
        });
        return;
      }

      // Obliczamy koszt wysyłki
      let totalWeight = 0;

      const productIds = items.map((item) => item.productId);
      const products = await Promise.all(
        productIds.map((id) => this.productService.getProductById(id))
      );

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = products[i];

        if (!product) {
          res.status(400).json({
            success: false,
            error: `Nie znaleziono produktu o ID: ${item.productId}`,
          });
          return;
        }

        // Konwertujemy wagę na liczbę i sprawdzamy czy jest prawidłowa
        const weight = Number(product.weight);
        if (isNaN(weight) || weight <= 0) {
          res.status(400).json({
            success: false,
            error: `Brak lub nieprawidłowa waga dla produktu: ${product.name}`,
          });
          return;
        }

        totalWeight += weight * item.quantity;
      }

      // Znajdź odpowiednią stawkę
      const shippingMethod = SHIPPING_METHODS[0];
      const rate = shippingMethod.rates.find(
        (r) => totalWeight >= r.minWeight && totalWeight <= r.maxWeight
      );

      if (!rate) {
        res.status(400).json({
          success: false,
          error: 'Nie można obliczyć kosztu wysyłki dla podanej wagi',
        });
        return;
      }

      const cost = paymentMethod === 'cod' ? rate.codCost : rate.prepaidCost;

      if (cost === null) {
        res.status(400).json({
          success: false,
          error: 'Wybrana metoda płatności jest niedostępna dla tej wagi',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          cost,
          weight: totalWeight,
          method: paymentMethod,
        },
      });
    } catch (error) {
      console.error('Błąd podczas obliczania kosztu wysyłki:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas obliczania kosztu wysyłki',
      });
    }
  };
}

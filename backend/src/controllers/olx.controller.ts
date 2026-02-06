// backend/src/controllers/olx.controller.ts
import { RequestHandler } from 'express';
import { OlxService } from '../services/olx.service';
import { ApiResponse } from '../utils/apiResponse';

export class OlxController {
  private olxService: OlxService;

  constructor() {
    this.olxService = new OlxService();
  }

  // Pobierz URL autoryzacji
  public getAuthUrl: RequestHandler = async (_req, res): Promise<void> => {
    try {
      const authUrl = await this.olxService.getAuthUrl();
      res.json(ApiResponse.success({ url: authUrl }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  // Obsłuż callback z kodem autoryzacyjnym
  public handleCallback: RequestHandler = async (req, res): Promise<void> => {
    const { code, state } = req.query;

    if (!code) {
      res.status(400).json(ApiResponse.error('Brak kodu autoryzacyjnego'));
      return;
    }

    try {
      await this.olxService.handleAuthCode(code as string);

      // Przekieruj do FRONTENDU z sukcesem
      res.redirect(
        'https://www.silniki-elektryczne.com.pl/admin/marketplaces/olx?auth=success'
      );
    } catch (error: any) {
      console.error('Błąd autoryzacji OLX:', error);
      res.redirect(
        'https://www.silniki-elektryczne.com.pl/admin/marketplaces/olx?auth=error'
      );
    }
  };

  // Sprawdź status autoryzacji
  public checkAuthStatus: RequestHandler = async (_req, res): Promise<void> => {
    try {
      const status = await this.olxService.checkAuthStatus();
      res.json(ApiResponse.success(status));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  // Pobierz oferty użytkownika
  public getUserAdverts: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { offset, limit, category_ids } = req.query;

      const adverts = await this.olxService.getUserAdverts({
        offset: offset ? parseInt(offset as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        category_ids: category_ids as string,
      });

      res.json(ApiResponse.success(adverts));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  // Importuj wszystkie oferty
  public importAllAdverts: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      const result = await this.olxService.importAllAdverts();
      res.json(ApiResponse.success(result, 'Import zakończony pomyślnie'));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  // Pobierz kategorie
  public getCategories: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { parent_id } = req.query;
      const categories = await this.olxService.getCategories(
        parent_id ? parseInt(parent_id as string) : undefined
      );
      res.json(ApiResponse.success(categories));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  public findMotorCategories: RequestHandler = async (
    _req,
    res
  ): Promise<void> => {
    try {
      const categories = await this.olxService.findCategoriesForMotors();
      res.json(ApiResponse.success(categories));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  public updateAdvert: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.olxService.updateAdvert(id, req.body);
      res.json(ApiResponse.success(result));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };

  public extendAdvert: RequestHandler = async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.olxService.extendAdvert(id);
      res.json(ApiResponse.success(result));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  };
}

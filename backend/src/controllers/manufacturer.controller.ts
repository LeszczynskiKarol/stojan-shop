// backend/src/controllers/manufacturer.controller.ts
import { Request, Response } from 'express';
import { ManufacturerService } from '../services/manufacturer.service';
import { ApiResponse } from '../utils/apiResponse';

export class ManufacturerController {
  private service: ManufacturerService;

  constructor() {
    this.service = new ManufacturerService();
  }

  public getAll = async (req: Request, res: Response) => {
    try {
      const manufacturers = await this.service.getAll();
      res.json(ApiResponse.success(manufacturers));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Błąd podczas pobierania producentów'));
    }
  };

  public getById = async (req: Request, res: Response) => {
    try {
      const manufacturer = await this.service.getById(req.params.id);
      res.json(ApiResponse.success(manufacturer));
    } catch (error) {
      res
        .status(404)
        .json(ApiResponse.error('Producent nie został znaleziony'));
    }
  };

  public getBySlug = async (req: Request, res: Response) => {
    try {
      const manufacturer = await this.service.getBySlug(req.params.slug);
      res.json(ApiResponse.success(manufacturer));
    } catch (error) {
      res
        .status(404)
        .json(ApiResponse.error('Producent nie został znaleziony'));
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const manufacturer = await this.service.create(req.body);
      res.status(201).json(ApiResponse.success(manufacturer));
    } catch (error) {
      res
        .status(400)
        .json(ApiResponse.error('Błąd podczas tworzenia producenta'));
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const manufacturer = await this.service.update(req.params.id, req.body);
      res.json(ApiResponse.success(manufacturer));
    } catch (error) {
      res
        .status(400)
        .json(ApiResponse.error('Błąd podczas aktualizacji producenta'));
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      await this.service.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Producent został usunięty'));
    } catch (error) {
      res
        .status(400)
        .json(ApiResponse.error('Błąd podczas usuwania producenta'));
    }
  };
}

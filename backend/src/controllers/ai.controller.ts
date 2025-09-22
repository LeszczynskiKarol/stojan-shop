// backend/src/controllers/ai.controller.ts
import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  public generateProductDescription = async (req: Request, res: Response) => {
    try {
      const { product } = req.body;
      const description =
        await this.aiService.generateProductDescription(product);

      res.json({
        success: true,
        description,
      });
    } catch (error) {
      console.error('Błąd podczas generowania opisu:', error);
      res.status(500).json({
        success: false,
        error: 'Nie udało się wygenerować opisu produktu',
      });
    }
  };
}

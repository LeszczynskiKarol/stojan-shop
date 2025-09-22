// backend/src/controllers/legal.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LegalPage } from '../entities/LegalPage';
import slugify from 'slugify';

export class LegalController {
  private repository = AppDataSource.getRepository(LegalPage);

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const page = await this.repository.findOne({ where: { slug } });

      if (!page) {
        res.status(404).json({ error: 'Strona nie znaleziona' });
        return;
      }

      res.json(page);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const pages = await this.repository.find();
      res.json({
        data: pages,
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd serwera',
      });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content } = req.body;
      const slug = slugify(title, { lower: true, strict: true });

      const existingPage = await this.repository.findOne({ where: { slug } });
      if (existingPage) {
        res.status(400).json({ error: 'Strona o takim tytule już istnieje' });
        return;
      }

      const page = this.repository.create({
        title,
        content,
        slug,
      });

      await this.repository.save(page);
      res.status(201).json(page);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      const page = await this.repository.findOne({ where: { id } });
      if (!page) {
        res.status(404).json({ error: 'Strona nie znaleziona' });
        return;
      }

      const slug = slugify(title, { lower: true, strict: true });
      const existingPage = await this.repository.findOne({ where: { slug } });
      if (existingPage && existingPage.id !== id) {
        res.status(400).json({ error: 'Strona o takim tytule już istnieje' });
        return;
      }

      page.title = title;
      page.content = content;
      page.slug = slug;

      await this.repository.save(page);
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = await this.repository.findOne({ where: { id } });

      if (!page) {
        res.status(404).json({ error: 'Strona nie znaleziona' });
        return;
      }

      await this.repository.remove(page);
      res.json({ message: 'Strona została usunięta' });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };
}

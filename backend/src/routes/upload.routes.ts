// backend/src/routes/upload.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
}).array('images', 10);

router.post(
  '/products',
  upload,
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json(ApiResponse.error('Nie przesłano żadnych plików'));
      return;
    }

    try {
      const uploadService = new UploadService();
      const urls = await Promise.all(
        files.map((file) => uploadService.uploadImage(file, 'products'))
      );

      res.json({
        success: true,
        data: {
          urls: urls, // upewnij się że urls jest tablicą
        },
      });
    } catch (error: any) {
      console.error('Błąd podczas uploadu:', error);
      res
        .status(500)
        .json(ApiResponse.error(`Błąd podczas uploadowania: ${error.message}`));
    }
  }
);

router.post(
  '/blog',
  upload,
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json(ApiResponse.error('Nie przesłano żadnych plików'));
      return;
    }

    try {
      const uploadService = new UploadService();
      const urls = await Promise.all(
        files.map((file) => uploadService.uploadImage(file, 'blog'))
      );
      res.json({
        success: true,
        data: {
          urls: urls,
        },
      });
    } catch (error: any) {
      console.error('Błąd podczas uploadu:', error);
      res
        .status(500)
        .json(ApiResponse.error(`Błąd podczas uploadowania: ${error.message}`));
    }
  }
);

router.post(
  '/datasheets',
  upload,
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json(ApiResponse.error('Nie przesłano żadnych plików'));
      return;
    }

    try {
      const uploadService = new UploadService();
      const urls = await Promise.all(
        files.map((file) => uploadService.uploadDataSheet(file))
      );

      res.json({
        success: true,
        data: {
          urls: urls,
        },
      });
    } catch (error: any) {
      console.error('Błąd podczas uploadu:', error);
      res
        .status(500)
        .json(ApiResponse.error(`Błąd podczas uploadowania: ${error.message}`));
    }
  }
);

export default router;

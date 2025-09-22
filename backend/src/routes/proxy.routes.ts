// backend/src/routes/proxy.routes.ts
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async function (req: Request, res: Response) {
  try {
    const imageUrl = req.query.url as string;
    console.log('Kurwa! Próbuję pobrać:', imageUrl);

    if (!imageUrl) {
      res.status(400).send('Brak URL obrazu');
      return;
    }

    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    res.set({
      'Content-Type': response.headers['content-type'],
      'Cache-Control': 'public, max-age=31536000',
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Jebło:', error);
    res.status(500).send('Błąd pobierania obrazu');
  }
});

export default router;

// backend/src/middlewares/recaptcha.middleware.ts
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.config';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  error?: string[];
}

export const verifyRecaptcha = (minScore: number = 0.5) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recaptchaToken } = req.body;

      if (!recaptchaToken) {
        res.status(400).json({ message: 'Brak tokenu reCAPTCHA' });
        return;
      }

      const response = await axios.post<RecaptchaResponse>(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: env.RECAPTCHA_SECRET_KEY,
            response: recaptchaToken,
          },
        }
      );

      if (!response.data.success || response.data.score < minScore) {
        res
          .status(400)
          .json({ message: 'Weryfikacja reCAPTCHA nie powiodła się' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Błąd weryfikacji reCAPTCHA' });
      return;
    }
  };
};

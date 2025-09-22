// backend/src/controllers/consent.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export class ConsentController {
  async updateConsent(req: Request, res: Response) {
    try {
      const { userId, consentSettings } = req.body;

      if (userId) {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (user) {
          user.consentSettings = consentSettings;
          await userRepository.save(user);
        }
      }

      res.cookie('consentSettings', JSON.stringify(consentSettings), {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 rok
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Błąd podczas aktualizacji zgód:', error);
      return res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas aktualizacji ustawień zgód',
      });
    }
  }
}

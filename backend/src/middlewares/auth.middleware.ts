// backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { UserRole } from '../entities/User';

export const auth = (allowedRoles: UserRole[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({ message: 'Brak tokenu autoryzacji' });
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        res.status(403).json({ message: 'Brak uprawnień' });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Nieprawidłowy token' });
    }
  };
};

// backend/src/routes/user.routes.ts

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middlewares/auth.middleware';
import { verifyRecaptcha } from '../middlewares/recaptcha.middleware';
import { UserRole } from '../entities/User';

const router = Router();
const controller = new UserController();

// Publiczne endpointy
router.post('/login', verifyRecaptcha(0.5), controller.login);
router.post('/logout', auth(), controller.logout);
router.get('/me', auth(), controller.getMe);

// Endpointy wymagające roli admina
router.post('/register', auth([UserRole.ADMIN]), controller.register);

export default router;

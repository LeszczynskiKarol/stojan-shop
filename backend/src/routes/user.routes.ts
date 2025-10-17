// backend/src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middlewares/auth.middleware';
// import { verifyRecaptcha } from '../middlewares/recaptcha.middleware'; // ← ZAKOMENTUJ

const router = Router();
const controller = new UserController();

// USUŃ verifyRecaptcha(0.5) Z TEJ LINII:
router.post('/login', controller.login); // ← BEZ verifyRecaptcha!
router.post('/logout', auth(), controller.logout);
router.get('/me', auth(), controller.getMe);
router.post('/register', controller.register); // ← BEZ verifyRecaptcha!

export default router;

// backend/src/routes/shipping.routes.ts
import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';

const router = Router();
const shippingController = new ShippingController();

router.post('/calculate', shippingController.calculateShippingCost);

export default router;

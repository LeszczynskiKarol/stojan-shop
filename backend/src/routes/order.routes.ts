// backend/src/routes/order.routes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const orderController = new OrderController();

router.get('/stats', orderController.getOrderStats);
router.get('/orders/detailed-stats', orderController.getDetailedStats);

// Najpierw najbardziej specificzne routy
router.get('/stripe-session/:sessionId', async (req, res) => {
  await orderController.getOrderByStripeSession(req, res);
});
router.get('/details/by-number/:orderNumber', (req, res, next) => {
  console.log('4. Hit order route /details/by-number/:orderNumber');
  console.log('orderNumber:', req.params.orderNumber);
  orderController.getOrderByNumber(req, res);
});
router.get('/events', orderController.handleSSE);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.post('/webhook', orderController.handleStripeWebhook);
router.get('/', orderController.getAllOrders);
router.patch('/:id/status', orderController.updateOrderStatus);
router.post(
  '/:id/invoice',
  upload.array('invoice', 4),
  orderController.uploadInvoice
);
router.delete('/:id/invoice', orderController.deleteInvoice);
router.delete('/bulk', orderController.deleteMultipleOrders);
router.delete('/:id', orderController.deleteOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/bulk/cancel', orderController.cancelMultipleOrders);

export default router;

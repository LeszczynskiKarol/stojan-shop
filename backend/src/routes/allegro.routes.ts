// backend/src/routes/allegro.routes.ts
import { Router } from 'express';
import { AllegroController } from '../controllers/allegro.controller';
import { AllegroEventSyncService } from '../services/allegroEventSync.service';

const router = Router();
const allegroController = new AllegroController();
const allegroEventSync = new AllegroEventSyncService();

router.get('/sync-status', (req, res) => {
  res.json({
    lastEventId: allegroEventSync.getLastEventId(),
    isRunning: allegroEventSync.isRunning(),
  });
});

router.post('/force-sync', async (req, res) => {
  try {
    await allegroEventSync.syncEvents();
    res.json({ success: true, message: 'Synchronizacja wykonana pomyślnie' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd synchronizacji' });
  }
});
router.patch('/offers/:offerId/stock', allegroController.updateOfferStock);
router.post('/offers', allegroController.createOffer);
router.post('/link-product/:productId', allegroController.linkProductToAllegro);
router.get('/unlinked-offers', allegroController.getUnlinkedAllegroOffers);
router.post('/products/:productId/allegro', allegroController.createOffer);
router.get('/auth', allegroController.getAuthUrl);
router.get('/auth/callback', allegroController.handleCallback);
router.post('/auth/callback', allegroController.handleCallback);
router.get('/admin/allegro/search', allegroController.searchProducts);
router.post('/admin/allegro/import-all', allegroController.importAllOffers);

router.get('/auth/status', allegroController.getAuthStatus);
router.post(
  '/sync-sleeve-diameters',
  allegroController.synchronizeSleeveDiameters
);
router.post('/sync-start-types', allegroController.synchronizeStartTypes);
router.get('/offers', allegroController.getAllOffers);
router.get('/offers/:id', allegroController.getOfferById);
router.post('/offers/:offerId/import', allegroController.importToOwnStore);
router.patch('/offers/:offerId/name', allegroController.updateOfferName);
router.get('/admin/allegro/offers', allegroController.getAllOffers);
router.patch('/allegro/offers/:id/price', allegroController.updateOfferPrice);
router.post('/test-sync', async (req, res) => {
  try {
    const mockEvent = {
      id: 'TEST_' + Date.now(),
      type: 'OFFER_STOCK_CHANGED',
      occurredAt: new Date().toISOString(),
      offer: {
        id: req.body.offerId || '17243881834', // możesz podać ID w zapytaniu lub użyć domyślnego
        publication: null,
        external: {
          id: 'test/123',
        },
      },
    };

    await allegroEventSync.handleStockChangeEvent(mockEvent);
    res.json({ success: true, message: 'Event testowy przetworzony' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany błąd',
    });
  }
});

router.post('/test-stock-event', async (req, res) => {
  try {
    const testEvent = {
      id: 'test-' + Date.now(),
      offerId: req.body.offerId,
      newStock: parseInt(req.body.newStock),
      type: 'OFFER_STOCK_CHANGED',
    };

    res.json({
      success: true,
      message: 'Testowe zdarzenie przetworzone pomyślnie',
      event: testEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Błąd podczas przetwarzania testowego zdarzenia',
    });
  }
});
export default router;

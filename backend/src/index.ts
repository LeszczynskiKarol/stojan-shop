// backend/src/index.ts
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import aiRoutes from './routes/ai.routes';
import cors from 'cors';
import dotenv from 'dotenv';
import analyticsRoutes from './routes/analytics.routes';
import { AllegroEventSyncService } from './services/allegroEventSync.service';
import { AppDataSource } from './config/database';
import { WebhookController } from './controllers/webhook.controller';
import { ProductController } from './controllers/product.controller';
import { CategoryController } from './controllers/category.controller';
import uploadRoutes from './routes/upload.routes';
import blogRoutes from './routes/blog.routes';
import productRoutes from './routes/product.routes';
import { sessionMiddleware } from './middlewares/session.middleware';
import manufacturerRoutes from './routes/manufacturer.routes';
import userRoutes from './routes/user.routes';
import sitemapRoutes from './routes/sitemap.routes';
import orderRoutes from './routes/order.routes';
import allegroProductsRoutes from './routes/allegroProducts.routes';
import categoryRoutes from './routes/category.routes';
import proxyRoutes from './routes/proxy.routes';
import legalRoutes from './routes/legal.routes';
import shippingRoutes from './routes/shipping.routes';
import allegroRoutes from './routes/allegro.routes';
import olxRoutes from './routes/olx.routes';
import taskRoutes from './routes/task.routes';

// Obsługa niezłapanych błędów
process.on('uncaughtException', (error: Error) => {
  console.error('🔥 Krytyczny błąd:', error);
  // Nie zamykamy procesu, tylko logujemy
});

process.on('unhandledRejection', (reason: any) => {
  console.error('🔥 Nieobsłużona obietnica:', reason);
  // Nie zamykamy procesu, tylko logujemy
});

dotenv.config();

const app: Application = express();
const webhookController = new WebhookController();
const productController = new ProductController();
const categoryController = new CategoryController();

// Stripe webhook
const stripeWebhookPath = '/api/webhooks/stripe';
app.post(
  stripeWebhookPath,
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook,
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Stripe webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
);

// Zwiększamy limity na parsery
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS - akceptujemy wszystkie pochodzenia w trybie developerskim
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? true
        : [
            'https://app-reactapp.ngrok.app',
            'http://localhost:3000',
            'https://www.silniki-elektryczne.com.pl',
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    maxAge: 86400, // 24h
  })
);

app.options('*', cors());

// Middleware do obsługi beacon
app.use((req, res, next) => {
  if (
    req.method === 'POST' &&
    req.headers['content-type']?.includes('text/plain')
  ) {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
      } catch {
        req.body = data;
      }
      next();
    });
  } else {
    next();
  }
});

// Middleware bezpieczeństwa
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(sessionMiddleware);
app.use('/api/image-proxy', proxyRoutes);

// Główne routy API
const mainRouter = express.Router();

const RESERVED_SLUGS = [
  'products',
  'categories',
  'admin',
  'orders',
  'shipping',
  'pages',
  'allegro',
  'olx',
  'import',
  'manufacturer',
  'legal',
  'sitemap',
  'tasks',
  'image-proxy',
];

// Routy API
mainRouter.use('/products', productRoutes);
mainRouter.use('/legal', legalRoutes);
mainRouter.use('/blog', blogRoutes);
mainRouter.use('/categories', categoryRoutes);
mainRouter.use('/manufacturers', manufacturerRoutes);
mainRouter.use('/orders', orderRoutes);
mainRouter.use('/users', userRoutes);
mainRouter.use('/shipping', shippingRoutes);
mainRouter.use('/allegro', allegroRoutes);
mainRouter.use('/allegroProducts', allegroProductsRoutes);
mainRouter.use('/olx', olxRoutes);
mainRouter.use('/admin/categories', categoryRoutes);
mainRouter.use('/ai', aiRoutes);
mainRouter.use('/analytics', analyticsRoutes);
mainRouter.use('/sitemap', sitemapRoutes);
mainRouter.use('/tasks', taskRoutes);

// Dynamiczne routy z walidacją
mainRouter.get('/:categorySlug/:productSlug', (req, res, next) => {
  const { categorySlug } = req.params;
  if (RESERVED_SLUGS.includes(categorySlug)) return next();
  productController.getProductBySlug(req, res, next);
});

mainRouter.get('/:categorySlug', (req, res, next) => {
  const { categorySlug } = req.params;
  if (RESERVED_SLUGS.includes(categorySlug)) {
    return next();
  }

  categoryController.getBySlug(req, res);
});
app.use('/api/uploads', uploadRoutes);
app.use('/api', mainRouter);

// Zaawansowana obsługa błędów
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('⚠️ Error:', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Próba odzyskania po błędzie
  try {
    res.status(err.status || 500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Wystąpił błąd. Spróbuj ponownie.'
          : err.message,
    });
  } catch (error) {
    console.error('🔥 Krytyczny błąd przy obsłudze błędu:', error);
    res.status(500).end();
  }
});

// Start serwera z obsługą błędów połączenia
const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    const allegroEventSync = new AllegroEventSyncService();
    allegroEventSync.startSync(300000);
    console.log(
      '🔄 Synchronizacja zdarzeń Allegro uruchomiona z interwałem 5 minut'
    );
    console.log('🔄 Uruchomiono synchronizację z Allegro');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serwer wystartował na http://0.0.0.0:${PORT}`);
    });

    // Obsługa zamknięcia
    const gracefulShutdown = () => {
      //allegroEventSync.stopSync();
      server.close(async () => {
        await AppDataSource.destroy();
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Keep-alive i timeout
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Obsługa błędów serwera
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} wymaga podwyższonych uprawnień`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} jest już w użyciu`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('❌ Błąd podczas startu serwera:', error);
    // Próba ponownego uruchomienia po 5 sekundach
    setTimeout(startServer, 5000);
  }
};

startServer();

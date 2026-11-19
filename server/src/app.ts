import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './lib/env.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(pinoHttp({ autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api', catalogRouter); // public storefront
  app.use('/api/cart', cartRouter); // preview is public, the rest checks the session itself
  app.use('/api', requireAuth, ordersRouter);
  app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

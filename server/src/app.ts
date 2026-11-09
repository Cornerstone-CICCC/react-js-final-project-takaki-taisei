import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { env } from './config/env';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from 'express-rate-limit';
import { AppError } from './utils/AppError';
import { resolve, extname } from 'node:path';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
  const origins = env.corsOrigin.split(',').map((o) => o.trim());
  // CORS alone does not reject cookie-authenticated mutation requests.
  app.use((req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      ((req.headers.origin && !origins.includes(req.headers.origin)) ||
       req.headers['sec-fetch-site'] === 'cross-site')) return next(new AppError(403, 'Origin is not allowed'));
    next();
  });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(['/api/auth/login', '/api/auth/signup'], rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  if (process.env.STATIC_DIR) {
    const root = resolve(process.env.STATIC_DIR);
    app.use(express.static(root));
    app.get('/{*path}', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/') || extname(req.path) || !req.accepts('html')) return next();
      res.sendFile('index.html', { root });
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

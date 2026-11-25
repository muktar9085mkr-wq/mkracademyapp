import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createApiApp } from './src/server/api';
import { renderProductPageHtml } from './src/server/ogMetadata';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApiApp();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Serve public assets (icons, manifest, .well-known/assetlinks.json)
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));

function extractQueryProductId(req: Request): string {
  const raw = req.query.product || req.query.id;
  return typeof raw === 'string' ? raw : '';
}

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
  const isRunningTsSource = process.argv.some((arg) => arg.endsWith('server.ts'));
  const isProdRuntime =
    process.env.NODE_ENV === 'production' || (!isRunningTsSource && fs.existsSync(distHtmlPath));

  if (isProdRuntime) {
    const getProdTemplate = () =>
      fs.existsSync(distHtmlPath) ? fs.readFileSync(distHtmlPath, 'utf-8') : undefined;

    app.get(['/product/:id', '/'], async (req: Request, res: Response, next: NextFunction) => {
      const productId = req.params.id || extractQueryProductId(req);
      if (!productId) {
        next();
        return;
      }
      try {
        const html = await renderProductPageHtml(productId, req, getProdTemplate());
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        res.status(200).send(html);
      } catch (err) {
        console.error('Production SSR OG error:', err);
        next();
      }
    });

    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.get(['/product/:id', '/'], async (req: Request, res: Response, next: NextFunction) => {
      const productId = req.params.id || extractQueryProductId(req);
      if (!productId) {
        next();
        return;
      }
      try {
        const rawTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const html = await renderProductPageHtml(productId, req, transformed);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
      } catch (err) {
        console.error('Dev SSR OG error:', err);
        next();
      }
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MKR Academy server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

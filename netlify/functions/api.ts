import serverless from 'serverless-http';
import { createApiApp } from '../../src/server/api';
import { renderProductPageHtml } from '../../src/server/ogMetadata';

const app = createApiApp();

// Fallback handler in case Netlify invokes the function with the raw /product/:id path
app.get('/product/:id', async (req, res) => {
  try {
    const html = await renderProductPageHtml(req.params.id || '', req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.status(200).send(html);
  } catch (err) {
    console.error('Netlify product fallback render error:', err);
    res.status(500).send('Unable to load product page');
  }
});

export const handler = serverless(app);

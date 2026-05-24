import express from 'express';
import app from './api/index';
import path from 'path';
import fs from 'fs';

const PORT = 3000;

async function startServer() {
  let isProd = process.env.NODE_ENV === 'production';
  let vite: any = null;

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Successfully initialized Vite dev server middleware');
    } catch (err) {
      console.warn('Vite dev server failed to start or is not installed. Falling back to serving static files from dist.', err);
      isProd = true;
    }
  }

  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  // Universal catch-all for non-API routes (Express 5 safe regex)
  app.get(/^(?!\/api).*/, async (req, res, next) => {
    const url = req.url;
    // Serve static files to let express.static or Vite middlewares handle them
    if (url.includes('.') && !url.endsWith('.html')) {
      return next();
    }

    try {
      if (isProd) {
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      } else {
        let html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        if (vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      }
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on Port ${PORT}`);
  });
}

startServer();

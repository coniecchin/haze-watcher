/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.ts';
import psiHandler from './api/psi.ts';
import twoHrForecastHandler from './api/two-hr-forecast.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serverless API Endpoints
  app.get('/api/health', healthHandler);
  app.get('/api/psi', psiHandler);
  app.get('/api/two-hr-forecast', twoHrForecastHandler);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} [Mode: ${isProd ? 'production' : 'development'}]`);
    console.log(`- GET /api/health`);
    console.log(`- GET /api/psi`);
    console.log(`- GET /api/two-hr-forecast`);
  });
}

startServer();

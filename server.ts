import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/src/routes/index.js';
import { initDatabase, getDatabaseStatus } from './server/src/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Basic security and parsing middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database (MongoDB Atlas if URI present, or in-memory seed engine)
  const dbResult = await initDatabase();
  console.log(`[HotelPro] Database initialized in ${dbResult.mode} mode.`);
  if (dbResult.error) {
    console.warn(`[HotelPro] MongoDB notice: ${dbResult.error}. Running with seed store.`);
  }

  // Mount REST API endpoints
  app.use('/api', apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HotelPro] System operational on http://0.0.0.0:${PORT}`);
    console.log(`[HotelPro] API status: http://0.0.0.0:${PORT}/api/health`);
  });
}

startServer().catch(err => {
  console.error('[HotelPro] Fatal server bootstrap failure:', err);
  process.exit(1);
});

import './src/env.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Modular Route Handlers
import mangaRouter from './src/server/routes/manga.js';
import videoRouter from './src/server/routes/video.js';
import downloadRouter from './src/server/routes/download.js';
import playerFrameRouter from './src/server/routes/playerFrame.js';
import proxyRouter from './src/server/routes/proxy.js';
import systemRouter from './src/server/routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());

// API Routers
app.use('/api/manga', mangaRouter);
app.use('/api/video', videoRouter);
app.use('/api/video/download', downloadRouter);
app.use('/api/video', playerFrameRouter);
app.use('/api', playerFrameRouter); // Pass-through proxy (/api/pf/:host*)
app.use('/api', proxyRouter);       // Image proxy (/api/image-proxy)
app.use('/api', systemRouter);      // Health check (/api/health)

// PWA Assets & Static Frontend Serving
const DIST_DIR = path.join(__dirname, 'dist');

app.get('/sw.js', (_req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'src', 'web', 'sw.js'));
});

app.get('/manifest.json', (_req, res) => {
  res.type('application/manifest+json').sendFile(path.join(__dirname, 'src', 'web', 'manifest.json'));
});

app.use(express.static(DIST_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// SPA Fallback: All unhandled routes return dist/index.html
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Server Initialization & Graceful Shutdown
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[Kura] Server aktif berjalan di http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Kura ERROR] Port ${PORT} sudah digunakan!`);
      console.error(`Server Kura kemungkinan SUDAH BERJALAN di latar belakang.`);
      console.error(`- Untuk langsung memakai: buka browser ke http://localhost:${PORT}`);
      console.error(`- Untuk restart: matikan proses lama terlebih dahulu, atau gunakan port lain (contoh: PORT=4001 npm start)\n`);
      process.exit(1);
    } else {
      console.error('[Kura ERROR] Gagal memulai server:', err);
      process.exit(1);
    }
  });

  const handleShutdown = (signal) => {
    console.log(`\n[Kura] Menerima sinyal ${signal}. Menutup server secara graceful...`);
    if (server) {
      server.close(() => {
        console.log('[Kura] Server HTTP berhasil ditutup. Keluar.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Kura] Penutupan server melebihi batas waktu 10s. Memaksa keluar.');
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;

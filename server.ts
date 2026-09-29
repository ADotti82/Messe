import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for liturgical calendar and geocoding to prevent rate limiting
const liturgyCache = new Map<string, any>();
const geocodeCache = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API proxy for CalAPI (bypasses HTTP/HTTPS mixed content and CORS)
  app.get('/api/calapi/:year/:month/:day', async (req, res) => {
    const { year, month, day } = req.params;
    const cacheKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    if (liturgyCache.has(cacheKey)) {
      return res.json(liturgyCache.get(cacheKey));
    }

    try {
      const url = `http://calapi.inadiutorium.cz/api/v0/en/calendars/general-it/${year}/${month}/${day}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RegistroDelleMesse/1.0',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({ error: 'CalAPI error' });
      }

      const data = await response.json();
      liturgyCache.set(cacheKey, data);
      return res.json(data);
    } catch (err: any) {
      console.warn(`CalAPI fetch failed for ${cacheKey}:`, err?.message);
      return res.status(503).json({ error: 'CalAPI unavailable', message: err?.message });
    }
  });

  // API proxy for reverse geocoding (OpenStreetMap Nominatim with respectful user agent)
  app.get('/api/geocode', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }

    const roundedLat = Number(lat).toFixed(4);
    const roundedLon = Number(lon).toFixed(4);
    const cacheKey = `${roundedLat},${roundedLon}`;

    if (geocodeCache.has(cacheKey)) {
      return res.json(geocodeCache.get(cacheKey));
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        String(lat)
      )}&lon=${encodeURIComponent(String(lon))}&zoom=18&addressdetails=1`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RegistroDelleMesseApp/1.0 (donandreadotti@gmail.com)',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Geocode error' });
      }

      const data = await response.json();
      geocodeCache.set(cacheKey, data);
      return res.json(data);
    } catch (err: any) {
      console.warn(`Geocode fetch failed:`, err?.message);
      return res.status(503).json({ error: 'Geocoding unavailable' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

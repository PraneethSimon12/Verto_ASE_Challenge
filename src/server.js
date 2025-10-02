import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import productsRouter from './routes/products.js';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ── Config ─────────────────────────────────────────────────── */
const PROJECT_ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS =
  (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());

/* ── Core middleware ─────────────────────────────────────────── */
app.use(morgan('dev'));
app.use(express.json());

// CORS: allow our UI origin (and CLI tools with no origin)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/postman or same-origin UI
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'), false);
    }
  })
);

/* ── Static demo UI ──────────────────────────────────────────── */
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

/* ── Health & version ───────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// /api/version reads package.json once at boot
let pkg = { name: 'ims', version: '0.0.0' };
try {
  pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
} catch {}
app.get('/api/version', (_req, res) => res.json({ name: pkg.name, version: pkg.version }));

/* ── API rate limiting ───────────────────────────────────────── */
// 300 requests / 15 minutes per IP on /api/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

/* ── API routes ──────────────────────────────────────────────── */
app.use('/api/products', productsRouter);

/* ── Swagger docs (at /api/docs) ─────────────────────────────── */
try {
  const openapiSpec = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.json'), 'utf-8')
  );
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
} catch {
  console.warn('Swagger disabled: openapi.json not found or invalid.');
}

/* ── 404 for unknown API routes ──────────────────────────────── */
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not Found' }));

/* ── Centralized error handler (must be LAST) ────────────────── */
app.use((err, _req, res, _next) => {
  const status = err.status || 500;

  // zod error support (optional)
  let details;
  if (err.issues && Array.isArray(err.issues)) {
    details = err.issues.map(i => ({
      path: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''),
      message: i.message
    }));
  }

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(details ? { details } : {})
  });
});

/* ── Start server ────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`IMS server running on http://localhost:${PORT}`);
});

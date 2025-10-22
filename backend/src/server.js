// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const accessLog = require('./middleware/accessLog');

// Route modules
const authRoutes = require('./routes/auth.routes');
const navigationRoutes = require('./routes/navigation.routes');
const processesRoutes = require('./routes/processes.routes');
const searchRoutes = require('./routes/search.routes');
const documentsRoutes = require('./routes/documents.routes');
const filesRoutes = require('./routes/files.routes');
const wikiLinksRoutes = require('./routes/wikilinks.routes');
const tagsRoutes = require('./routes/tags.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const recentsRoutes = require('./routes/recents.routes');
const complianceRoutes = require('./routes/compliance.routes');
const privacyRoutes = require('./routes/privacy.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 8000;

// Tell Express we may be behind a proxy (CRA dev server / reverse proxy)
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1)); // 1 hop is fine for dev

/* -----------------------------
   Security & Core Middleware
------------------------------ */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(accessLog());

/* -----------------------------
   Static Uploads
------------------------------ */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

/* -----------------------------
   Health Probes
------------------------------ */
app.get('/health', (_req, res) => res.json({ status: 'OK' }));
app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/readyz', async (_req, res) => {
  const ok = await testConnection();
  res.status(ok ? 200 : 500).send(ok ? 'ready' : 'not-ready');
});

/* -----------------------------
   Rate Limiters
------------------------------ */
// Rate limit login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, _res) => req.ip, // rely on Express' ip (respects trust proxy)
});
app.use('/api/auth/login', authLimiter);

/* -----------------------------
   API Routes
------------------------------ */
app.use('/api/auth', authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/processes', processesRoutes);   // <-- needed for BPMN editor + creation
app.use('/api/documents', documentsRoutes);   // <-- needed for document editor
app.use('/api/files', filesRoutes);           // <-- needed for file list/download
app.use('/api/search', searchRoutes);
app.use('/api/wikilinks', wikiLinksRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/recents', recentsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/stats', statsRoutes);           // <-- dashboard counts

/* -----------------------------
   Serve Frontend (SPA Fallback)
------------------------------ */
const buildPath = path.resolve(__dirname, '../../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // Any GET that doesn't start with /api, /uploads, or health endpoints -> index.html
  app.get(/^\/(?!api|uploads|health|healthz|readyz).*/, (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

/* -----------------------------
   404 + Error Handler
------------------------------ */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

/* -----------------------------
   Start Server
------------------------------ */
const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) process.exit(1);

  app.listen(PORT, () => {
    console.log(`✅ Database connected`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}`);
  });
};

startServer();

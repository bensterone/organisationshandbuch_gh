const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

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

const app = express();
const PORT = process.env.PORT || 8000;

const accessLog = require('./middleware/accessLog');
const complianceRoutes = require('./routes/compliance.routes');
const privacyRoutes = require('./routes/privacy.routes');

// Security & basic middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Access Log and Compliance routes
app.use(accessLog());
app.use('/api/compliance', complianceRoutes);
app.use('/api/privacy', privacyRoutes);

// Static uploads (serve PDFs/images)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health
app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('/healthz', (req, res) => res.send('ok'));
app.get('/readyz', async (req, res) => {
  const ok = await testConnection();
  res.status(ok ? 200 : 500).send(ok ? 'ready' : 'not-ready');
});


// Rate limit login
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth/login', authLimiter);
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/processes', processesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/wikilinks', wikiLinksRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/recents', recentsRoutes);


// Serve frontend build (same-origin)
const buildPath = path.resolve(__dirname, '../../frontend/build');
if (require('fs').existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get(['/', '/login', '/documents', '/processes', '/navigation', '/favorites', '/search', '/tags', '/recents', '/privacy', '/compliance', '/wiki', '/bpmn', '/settings', '/health'], (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// 404 + error
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

// Start
const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) process.exit(1);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}`);
  });
};

startServer();

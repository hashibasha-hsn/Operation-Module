const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3009;

// PostgreSQL configuration for translations
const translationsPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Rasika',
  database: 'hashibasha_org',
});

// In-memory cache for translations
const translationsCache = {
  en: null,
  ar: null,
  lastUpdated: {
    en: null,
    ar: null,
  },
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Service URLs
const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
  ORG: process.env.ORG_SERVICE_URL || 'http://localhost:3012',
  USER: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  PERMISSION: process.env.PERMISSION_SERVICE_URL || 'http://localhost:3005',
};

// Proxy configurations
const authProxy = createProxyMiddleware({
  target: SERVICES.AUTH,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Connection'] = 'keep-alive';
  },
});

const orgProxy = createProxyMiddleware({
  target: SERVICES.ORG,
  changeOrigin: true,
  pathRewrite: {
    '^/api/org': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Connection'] = 'keep-alive';
  },
});

const userProxy = createProxyMiddleware({
  target: SERVICES.USER,
  changeOrigin: true,
  pathRewrite: {
    '^/api/user': '',
  },
});

const notificationProxy = createProxyMiddleware({
  target: SERVICES.NOTIFICATION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notification': '',
  },
});

const permissionProxy = createProxyMiddleware({
  target: SERVICES.PERMISSION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/permission': '',
  },
});

const auditsProxy = createProxyMiddleware({
  target: SERVICES.ORG,
  changeOrigin: true,
  pathRewrite: {
    '^/api/audits': '/audits',
  },
});

// Route proxies
app.use('/api/auth', authProxy);
app.use('/api/org', orgProxy);
app.use('/api/user', userProxy);
app.use('/api/notification', notificationProxy);
app.use('/api/permission', permissionProxy);
app.use('/api/audits', auditsProxy);

// Translations endpoint with caching
app.get('/api/translations/:lang', async (req, res) => {
  const { lang } = req.params;
  const validLanguages = ['en', 'ar'];
  
  if (!validLanguages.includes(lang)) {
    return res.status(400).json({ error: 'Invalid language. Use "en" or "ar"' });
  }

  // Check cache
  const now = Date.now();
  if (translationsCache[lang] && 
      translationsCache.lastUpdated[lang] && 
      (now - translationsCache.lastUpdated[lang]) < translationsCache.cacheDuration) {
    return res.json(translationsCache[lang]);
  }

  try {
    const result = await translationsPool.query(
      'SELECT key, CASE WHEN $1 = \'en\' THEN en ELSE ar END as translation FROM translations',
      [lang]
    );

    const translations = {};
    result.rows.forEach(row => {
      translations[row.key] = row.translation;
    });

    // Update cache
    translationsCache[lang] = translations;
    translationsCache.lastUpdated[lang] = now;

    res.json(translations);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Clear translations cache endpoint (for admin use)
app.post('/api/translations/cache/clear', (req, res) => {
  translationsCache.en = null;
  translationsCache.ar = null;
  translationsCache.lastUpdated.en = null;
  translationsCache.lastUpdated.ar = null;
  res.json({ message: 'Translations cache cleared' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: SERVICES,
    timestamp: new Date().toISOString(),
  });
});

// Service status endpoint
app.get('/api/status', async (req, res) => {
  const axios = require('axios');
  const status = {};

  try {
    const authHealth = await axios.get(`${SERVICES.AUTH}/health`).catch(() => ({ status: 'down' }));
    status.auth = authHealth.data?.status || 'down';
  } catch (e) {
    status.auth = 'down';
  }

  try {
    const orgHealth = await axios.get(`${SERVICES.ORG}/health`).catch(() => ({ status: 'down' }));
    status.org = orgHealth.data?.status || 'down';
  } catch (e) {
    status.org = 'down';
  }

  try {
    const userHealth = await axios.get(`${SERVICES.USER}/health`).catch(() => ({ status: 'down' }));
    status.user = userHealth.data?.status || 'down';
  } catch (e) {
    status.user = 'down';
  }

  try {
    const notificationHealth = await axios.get(`${SERVICES.NOTIFICATION}/health`).catch(() => ({ status: 'down' }));
    status.notification = notificationHealth.data?.status || 'down';
  } catch (e) {
    status.notification = 'down';
  }

  try {
    const permissionHealth = await axios.get(`${SERVICES.PERMISSION}/health`).catch(() => ({ status: 'down' }));
    status.permission = permissionHealth.data?.status || 'down';
  } catch (e) {
    status.permission = 'down';
  }

  res.json({
    gateway: 'ok',
    services: status,
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal Gateway Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:', SERVICES);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Service status: http://localhost:${PORT}/api/status`);
});

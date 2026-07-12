const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Azure App Service / most PaaS inject PORT. Keep GATEWAY_PORT as a local override.
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3009;

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
  LOCATION: process.env.LOCATION_SERVICE_URL || 'http://localhost:3013',
  LANGUAGE: process.env.LANGUAGE_SERVICE_URL || 'http://localhost:3014',
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
  proxyTimeout: 60000,
  timeout: 60000,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Connection', 'keep-alive');
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Connection'] = 'keep-alive';
  },
  onError: (err, req, res) => {
    console.error('[org-proxy]', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        message: 'Organization service unavailable. Please retry in a few seconds.',
      });
    }
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

const locationProxy = createProxyMiddleware({
  target: SERVICES.LOCATION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/location': '',
  },
});

const languageProxy = createProxyMiddleware({
  target: SERVICES.LANGUAGE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/language': '',
  },
});

const translationsProxy = createProxyMiddleware({
  target: SERVICES.LANGUAGE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/translations': '/translations',
  },
});

// Route proxies
app.use('/api/auth', authProxy);
app.use('/api/org', orgProxy);
app.use('/uploads', createProxyMiddleware({
  target: SERVICES.ORG,
  changeOrigin: true,
}));
app.use('/api/user', userProxy);
app.use('/api/location', locationProxy);
app.use('/api/language', languageProxy);
app.use('/api/translations', translationsProxy);
app.use('/api/notification', notificationProxy);
app.use('/api/permission', permissionProxy);
app.use('/api/audits', auditsProxy);

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

  try {
    const locationHealth = await axios.get(`${SERVICES.LOCATION}/health`).catch(() => ({ status: 'down' }));
    status.location = locationHealth.data?.status || 'down';
  } catch (e) {
    status.location = 'down';
  }

  try {
    const languageHealth = await axios.get(`${SERVICES.LANGUAGE}/health`).catch(() => ({ status: 'down' }));
    status.language = languageHealth.data?.status || 'down';
  } catch (e) {
    status.language = 'down';
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

// Start server — bind 0.0.0.0 for Azure App Service / containers
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:', SERVICES);
  console.log(`Health check: /health`);
  console.log(`Service status: /api/status`);
});

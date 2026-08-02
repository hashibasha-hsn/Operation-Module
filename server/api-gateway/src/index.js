const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3009;

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email', 'X-Organization-Id'],
}));

// Merged architecture:
// - user-service (:3002) hosts auth + permission + notification
// - org-service (:3012) hosts location + language + org
// - audit-log-service (:3015) hosts audit logs
// - email-service (:3016) hosts outgoing email delivery (Graph/SMTP)
const USER = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const ORG = process.env.ORG_SERVICE_URL || 'http://localhost:3012';
const AUDIT = process.env.AUDIT_LOG_SERVICE_URL || 'http://localhost:3015';
const EMAIL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3016';

const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || USER,
  USER,
  ORG,
  LOCATION: process.env.LOCATION_SERVICE_URL || ORG,
  LANGUAGE: process.env.LANGUAGE_SERVICE_URL || ORG,
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || USER,
  PERMISSION: process.env.PERMISSION_SERVICE_URL || USER,
  AUDIT,
  EMAIL,
};

function proxy(target, pathRewrite) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    proxyTimeout: 60000,
    timeout: 60000,
    onError: (err, req, res) => {
      console.error('[gateway-proxy]', req.path, err.message);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Upstream service unavailable', path: req.path });
      }
    },
  });
}

app.use('/api/auth', proxy(SERVICES.AUTH, { '^/api/auth': '/auth' }));
app.use('/api/user', proxy(SERVICES.USER, { '^/api/user': '' }));
app.use('/api/notification/email', proxy(SERVICES.EMAIL, { '^/api/notification': '' }));
app.use('/api/notification', proxy(SERVICES.NOTIFICATION, { '^/api/notification': '' }));
app.use('/api/email', proxy(SERVICES.EMAIL, { '^/api': '' }));
app.use('/api/permission', proxy(SERVICES.PERMISSION, { '^/api/permission': '' }));
app.use('/api/org', proxy(SERVICES.ORG, { '^/api/org': '' }));
app.use('/api/audits', proxy(SERVICES.ORG, { '^/api/audits': '/audits' }));
app.use('/api/attendance', proxy(SERVICES.ORG, { '^/api/attendance': '/attendance' }));
app.use('/uploads', proxy(SERVICES.ORG));
app.use('/api/location', proxy(SERVICES.LOCATION, { '^/api/location': '' }));
app.use('/api/language', proxy(SERVICES.LANGUAGE, { '^/api/language': '' }));
app.use('/api/translations', proxy(SERVICES.LANGUAGE, { '^/api/translations': '/translations' }));
app.use('/api/audit-logs', proxy(SERVICES.ORG, { '^/api/audit-logs': '/audit-logs' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'four-backend',
    services: SERVICES,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', async (req, res) => {
  const axios = require('axios');
  const check = async (url) => {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      return response.data?.status || 'ok';
    } catch {
      return 'down';
    }
  };

  const [user, org, audit] = await Promise.all([
    check(SERVICES.USER),
    check(SERVICES.ORG),
    check(SERVICES.AUDIT),
  ]);

  res.json({
    gateway: 'ok',
    mode: 'four-backend',
    services: {
      user,
      org,
      auditLog: audit,
      auth: user,
      permission: user,
      notification: user,
      location: org,
      language: org,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal Gateway Error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:', SERVICES);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Service status: http://localhost:${PORT}/api/status`);
});

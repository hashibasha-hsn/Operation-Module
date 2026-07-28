/**
 * Shared PostgreSQL configuration for database setup scripts.
 * Override via environment variables before running setup.
 *
 *   DB_HOST / PGHOST          default: localhost
 *   DB_PORT / PGPORT          default: 5432
 *   DB_USER / PGUSER          default: postgres
 *   DB_PASSWORD / PGPASSWORD  (required — no default)
 *   LOCATION_DB_NAME          default: hashibasha_location
 *   LANGUAGE_DB_NAME          default: hashibasha_language
 */

function getBaseConfig() {
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  };
}

const DATABASES = {
  auth: process.env.AUTH_DB_NAME || 'hashibasha_auth',
  user: process.env.USER_DB_NAME || 'hashibasha_user',
  org: process.env.ORG_DB_NAME || 'hashibasha_org',
  notification: process.env.NOTIFICATION_DB_NAME || 'hashibasha_notification',
  permission: process.env.PERMISSION_DB_NAME || 'hashibasha_permission',
  location: process.env.LOCATION_DB_NAME || 'hashibasha_location',
  language: process.env.LANGUAGE_DB_NAME || 'hashibasha_language',
};

function applyEnvToProcess() {
  const base = getBaseConfig();
  process.env.DB_HOST = base.host;
  process.env.DB_PORT = String(base.port);
  process.env.DB_USER = base.user;
  process.env.DB_PASSWORD = base.password;
  process.env.PGHOST = base.host;
  process.env.PGPORT = String(base.port);
  process.env.PGUSER = base.user;
  process.env.PGPASSWORD = base.password;
  process.env.PGDATABASE = DATABASES.org;
  process.env.PGUSER_DB = DATABASES.user;
  process.env.LOCATION_DB_NAME = DATABASES.location;
  process.env.LANGUAGE_DB_NAME = DATABASES.language;
}

function poolConfig(database) {
  return { ...getBaseConfig(), database };
}

module.exports = {
  getBaseConfig,
  DATABASES,
  applyEnvToProcess,
  poolConfig,
};

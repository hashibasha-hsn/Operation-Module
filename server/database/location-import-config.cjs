/**
 * Shared DB config for location import scripts (Supabase schema-aware).
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const ROOT = path.join(__dirname, '..', '..');
const env = loadEnvFile(path.join(ROOT, 'server', 'location-service', '.env'));

const SCHEMA = process.env.DB_SCHEMA || env.DB_SCHEMA || 'hashibasha_location';

function getPgClient() {
  const { Client } = require('pg');
  if (env.DATABASE_URL) {
    return new Client({
      connectionString: env.DATABASE_URL,
      ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return new Client({
    host: process.env.DB_HOST || env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || env.DB_PASSWORD || 'Rasika',
    database: process.env.DB_NAME || env.DB_NAME || 'hashibasha_location',
  });
}

function findSaLocationExcel() {
  const candidates = [
    path.join(ROOT, 'أحياء_مدن_السعودية_العنوان_الوطني (1).xlsx'),
    path.join(ROOT, 'أحياء_مدن_السعودية_العنوان_الوطني.xlsx'),
  ];
  const direct = candidates.find((p) => fs.existsSync(p));
  if (direct) return direct;
  const files = fs.readdirSync(ROOT).filter((f) => f.toLowerCase().endsWith('.xlsx'));
  if (files.length === 1) return path.join(ROOT, files[0]);
  const match = files.find((f) => /xlsx$/i.test(f));
  return match ? path.join(ROOT, match) : null;
}

async function useLocationSchema(client) {
  await client.query(`SET search_path TO "${SCHEMA}"`);
}

module.exports = {
  ROOT,
  SCHEMA,
  getPgClient,
  findSaLocationExcel,
  useLocationSchema,
  loadEnvFile,
};

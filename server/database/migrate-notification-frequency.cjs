/**
 * Add frequency and per-type preference columns to notification_preferences.
 * Run: node server/database/migrate-notification-frequency.cjs
 */
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'Rasika',
    database: process.env.PGDATABASE || 'hashibasha_notification',
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      notification_type VARCHAR(100) NOT NULL,
      email_enabled BOOLEAN DEFAULT true,
      push_enabled BOOLEAN DEFAULT true,
      sms_enabled BOOLEAN DEFAULT false,
      in_app_enabled BOOLEAN DEFAULT true,
      email_frequency VARCHAR(20) DEFAULT 'instant',
      sms_urgent_only BOOLEAN DEFAULT true,
      push_desktop_enabled BOOLEAN DEFAULT true,
      push_mobile_enabled BOOLEAN DEFAULT true,
      in_app_sound_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, notification_type)
    );
  `);

  await client.query(`
    ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS notification_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(20) DEFAULT 'instant',
    ADD COLUMN IF NOT EXISTS sms_urgent_only BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS push_desktop_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS push_mobile_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS in_app_sound_enabled BOOLEAN DEFAULT true;
  `);

  await client.query(`
    UPDATE notification_preferences
    SET notification_type = '_global'
    WHERE notification_type IS NULL;
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_user_type
    ON notification_preferences(user_id, notification_type);
  `);

  await client.end();
  console.log('notification frequency migration OK');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

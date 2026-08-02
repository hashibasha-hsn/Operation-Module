const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const c = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.nwwcoukuvyqnbxulvqcl',
  password: 'D419EAA12b!Secure',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const sql = fs.readFileSync(
    path.join(__dirname, 'add-email-graph-config.sql'),
    'utf8',
  );
  await c.query(sql);
  const r = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='hashibasha_notification' AND table_name='email_config_settings'
     ORDER BY ordinal_position`,
  );
  console.log(JSON.stringify(r.rows.map((x) => x.column_name)));
  await c.end();
})().catch((e) => { console.error('ERR: ' + e.message); process.exit(1); });

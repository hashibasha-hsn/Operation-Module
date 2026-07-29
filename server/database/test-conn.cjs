const { Client } = require('pg');
const url = 'postgresql://postgres.nwwcoukuvyqnbxulvqcl:%40%23%24D419EAA12b@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  console.log('Connecting with URL:', url);
  const c = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    family: 4,
  });
  const parsed = c.connectionParameters;
  console.log('user=', parsed.user, 'database=', parsed.database, 'host=', parsed.host, 'port=', parsed.port);

  await c.connect();
  const r = await c.query('SELECT 1 AS ok');
  console.log('connected', r.rows[0]);
  await c.end();
}
main().catch(e => { console.error('ERROR:', e.message, e.code); process.exit(1); });

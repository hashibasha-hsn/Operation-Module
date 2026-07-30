const { Client } = require('pg');
async function main() {
  const client = new Client({ host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 6543, user: 'postgres.nwwcoukuvyqnbxulvqcl', password: 'D419EAA12b!Secure', database: 'postgres', ssl: { rejectUnauthorized: false } });
  await client.connect();
  const fns = await client.query("SELECT uuid_generate_v4() AS v");
  console.log('uuid_generate_v4():', fns.rows[0].v);
  const gn = await client.query("SELECT gen_random_uuid() AS v");
  console.log('gen_random_uuid():', gn.rows[0].v);
  const logs = await client.query("SELECT target, operation, details->>'title' AS title FROM hashibasha_org.audit_logs WHERE target IN ('Process','Audit') ORDER BY created_at DESC LIMIT 20");
  console.log('Process/Audit logs:', JSON.stringify(logs.rows, null, 2));
  await client.end();
}
main().catch(e => console.error(e));

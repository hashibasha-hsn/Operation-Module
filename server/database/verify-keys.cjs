const { Client } = require('pg');
const keys = ['processSection','periodicitySection','remindersSection','submissionReportSection','reviewSection','advanceSettingsSection','publicFormSection','languageSettingsSection','processManagement','owner','period','assignees','urlQr','schedule'];

(async () => {
  const c = new Client({host:'aws-0-ap-southeast-1.pooler.supabase.com',port:6543,user:'postgres.nwwcoukuvyqnbxulvqcl',password:'D419EAA12b!Secure',database:'postgres',ssl:{rejectUnauthorized:false}});
  await c.connect();
  const r = await c.query("SELECT key, en, ar FROM hashibasha_language.language_entries WHERE key = ANY($1) ORDER BY key", [keys]);
  console.log('Total found:', r.rows.length);
  r.rows.forEach(row => console.log(row.key, '-> EN:', row.en, '| AR:', row.ar));
  if (r.rows.length < keys.length) {
    const found = r.rows.map(r => r.key);
    const missing = keys.filter(k => !found.includes(k));
    console.log('Missing keys:', missing);
  } else {
    console.log('All keys present in DB');
  }
  await c.end();
})().catch(e => console.error(e));

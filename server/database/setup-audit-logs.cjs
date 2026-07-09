const pg = require('pg');
const fs = require('fs');
const path = require('path');

const orgPool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Rasika',
  database: process.env.PGDATABASE || 'hashibasha_org',
});

const userPool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Rasika',
  database: process.env.PGUSER_DB || 'hashibasha_user',
});

async function getUserEmailMap() {
  try {
    // Try users table first (has email), fall back gracefully
    const { rows } = await userPool.query(
      `SELECT user_id, email, name FROM user_profiles WHERE isremoved = FALSE`,
    );
    const map = new Map();
    for (const row of rows) {
      map.set(row.user_id, { email: row.email, name: row.name });
    }
    return map;
  } catch (e) {
    // On fresh DB the columns may differ — return empty map
    console.log('  Note: Could not load user email map, using empty map (fresh install).');
    return new Map();
  }
}

async function backfillFromSubmissions(emailMap) {
  const { rows } = await orgPool.query(`
    SELECT s.id, s."workflowType", s."workflowId", s."submittedBy", s.status,
           s."organizationId", s."updatedAt", s."submittedAt",
           p.title AS process_title, a.title AS audit_title
    FROM submissions s
    LEFT JOIN processes p ON s."workflowId" = p.id AND s."workflowType" = 'process'
    LEFT JOIN audits a ON s."workflowId" = a.id AND s."workflowType" = 'audit'
    WHERE s.status NOT IN ('draft')
    ORDER BY COALESCE(s."submittedAt", s."updatedAt") DESC
    LIMIT 500
  `);

  let inserted = 0;
  for (const row of rows) {
    const user = emailMap.get(row.submittedBy);
    const performedBy = user?.email || row.submittedBy;
    const title = row.process_title || row.audit_title || 'Untitled Form';
    const operation =
      row.status === 'rejected' ? 'Discard' : 'Update';
    const createdAt = row.submittedAt || row.updatedAt;

    const exists = await orgPool.query(
      `SELECT 1 FROM audit_logs WHERE "targetId" = $1 AND operation = $2 LIMIT 1`,
      [row.id, operation],
    );
    if (exists.rowCount > 0) continue;

    await orgPool.query(
      `
      INSERT INTO audit_logs (target, operation, "performedBy", details, "targetId", "organizationId", "createdAt")
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      `,
      [
        'Form Submission',
        operation,
        performedBy,
        JSON.stringify({
          title,
          FormId: row.workflowId,
          submissionId: row.id,
          workflowType: row.workflowType,
          status: row.status,
        }),
        row.id,
        row.organizationId || 'default-org',
        createdAt,
      ],
    );
    inserted += 1;
  }
  return inserted;
}

async function backfillFromUsers(emailMap) {
  const { rows } = await userPool.query(`
    SELECT userid, email, name, createdat, updatedat
    FROM user_profiles
    WHERE updatedat > createdat + interval '1 second'
    ORDER BY updatedat DESC
    LIMIT 200
  `);

  let inserted = 0;
  for (const row of rows) {
    const exists = await orgPool.query(
      `SELECT 1 FROM audit_logs WHERE "targetId" = $1 AND target = 'User' LIMIT 1`,
      [row.userid],
    );
    if (exists.rowCount > 0) continue;

    await orgPool.query(
      `
      INSERT INTO audit_logs (target, operation, "performedBy", details, "targetId", "organizationId", "createdAt")
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      `,
      [
        'User',
        'Update',
        row.email,
        JSON.stringify({ email: row.email, name: row.name }),
        row.userid,
        'default-org',
        row.updatedat,
      ],
    );
    inserted += 1;
  }
  return inserted;
}

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'audit-logs-schema.sql'), 'utf8');
  console.log('Applying audit-logs-schema.sql...');
  await orgPool.query(schema);
  console.log('✓ Audit logs schema applied');

  try {
    const emailMap = await getUserEmailMap();
    const fromSubmissions = await backfillFromSubmissions(emailMap);
    const fromUsers = await backfillFromUsers(emailMap);
    console.log(`✓ Backfilled ${fromSubmissions} submission log(s)`);
    console.log(`✓ Backfilled ${fromUsers} user update log(s)`);
  } catch (e) {
    console.log(`  Note: Backfill skipped on fresh install (${e.message})`);
  }

  const { rows } = await orgPool.query('SELECT COUNT(*)::int AS count FROM audit_logs');
  console.log(`✓ Total audit logs in DB: ${rows[0].count}`);

  await orgPool.end();
  await userPool.end();
}

run().catch(async (error) => {
  console.error(error);
  await orgPool.end();
  await userPool.end();
  process.exit(1);
});

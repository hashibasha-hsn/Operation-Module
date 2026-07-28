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

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'tickets-schema.sql'), 'utf8');
  console.log('Applying tickets-schema.sql...');
  await orgPool.query(schema);
  console.log('✓ Tickets schema applied');

  const orgId = 'default-org';

  await orgPool.query(
    `
    INSERT INTO ticket_settings ("organizationId", "attachmentMandatory", "disableTicketDelete", "hidePriorities")
    VALUES ($1, FALSE, FALSE, FALSE)
    ON CONFLICT ("organizationId") DO NOTHING
    `,
    [orgId],
  );

  await orgPool.query(
    `
    INSERT INTO ticket_tags (id, "tagName", "tagType", "tagValues", "isMandatory", "organizationId")
    VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Issue Type', 'ticket', '["Equipment","Safety","Cleanliness"]'::jsonb, TRUE, $1),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Severity', 'ticket', '["Low","Medium","High"]'::jsonb, FALSE, $1)
    ON CONFLICT (id) DO NOTHING
    `,
    [orgId],
  );

  await orgPool.query(
    `
    INSERT INTO auto_ticket_categories (id, "categoryName", "parentId", "assigneeIds", priority, "dueDateConfig", "organizationId")
    VALUES
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Equipment', NULL, '["admin-user-id"]'::jsonb, 'high', '{"daysFromNow": 2}'::jsonb, $1),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'AC Leakage', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '["admin-user-id"]'::jsonb, 'highest', '{"daysFromNow": 1}'::jsonb, $1)
    ON CONFLICT (id) DO NOTHING
    `,
    [orgId],
  );

  await orgPool.query(
    `
    INSERT INTO ticket_rules (id, "ruleType", "targetStatuses", "daysAfter", "organizationId")
    VALUES
      ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'created_at', '["on_hold"]'::jsonb, 10, $1),
      ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'completed_at', '["complete"]'::jsonb, 7, $1)
    ON CONFLICT (id) DO NOTHING
    `,
    [orgId],
  );

  console.log('✓ Sample ticket setup data seeded');
  await orgPool.end();
}

run().catch(async (error) => {
  console.error(error);
  await orgPool.end();
  process.exit(1);
});

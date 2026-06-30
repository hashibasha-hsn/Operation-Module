import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Rasika',
  database: process.env.DB_NAME || process.env.PGUSER_DB || 'hashibasha_user',
});

const client = await pool.connect();
try {
  await client.query(`
    ALTER TABLE hybrid_assignee_assignments
    DROP CONSTRAINT IF EXISTS hybrid_assignee_assignments_assignmenttype_check
  `);

  await client.query(`
    ALTER TABLE hybrid_assignee_assignments
    ADD CONSTRAINT hybrid_assignee_assignments_assignmenttype_check
    CHECK (assignmenttype IN (
      'process_approval',
      'action_point_assignee',
      'action_point_closure',
      'individual',
      'bulk',
      'designation',
      'common'
    ))
  `);

  await client.query(`
    ALTER TABLE hybrid_assignee_assignments
    ALTER COLUMN userid TYPE character varying USING userid::text
  `);

  console.log('Hybrid assignee schema migration completed.');
} finally {
  client.release();
  await pool.end();
}

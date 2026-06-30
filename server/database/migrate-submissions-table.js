import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Rasika',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'hashibasha_org',
});

const client = await pool.connect();
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "workflowType" varchar NOT NULL,
      "workflowId" uuid NOT NULL,
      "storeId" uuid NOT NULL,
      "submittedBy" varchar NOT NULL,
      status varchar NOT NULL DEFAULT 'new',
      answers json,
      attachments json,
      score decimal(5,2),
      passed boolean NOT NULL DEFAULT false,
      "dueDate" timestamp,
      "submittedAt" timestamp,
      "reviewHistory" json,
      "currentReviewLevel" integer NOT NULL DEFAULT 0,
      "organizationId" varchar NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_submissions_user_org
    ON submissions ("submittedBy", "organizationId", "workflowType")
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_submissions_draft
    ON submissions ("workflowId", "submittedBy", "storeId", status)
  `);

  console.log('Submissions table migration completed.');
} finally {
  client.release();
  await pool.end();
}

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
    CREATE TABLE IF NOT EXISTS audits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(200) NOT NULL,
      description text,
      "processTag" varchar(50),
      "processTags" json,
      status varchar NOT NULL DEFAULT 'draft',
      frequency varchar(50),
      properties json,
      "frequencyConfig" json,
      "isActive" boolean NOT NULL DEFAULT true,
      "requiresApproval" boolean NOT NULL DEFAULT true,
      "visibilityRules" json,
      "reminderConfig" json,
      "scoringConfig" json,
      "passThreshold" decimal(5,2),
      "reviewLevels" integer NOT NULL DEFAULT 1,
      "criticalQuestionIds" text DEFAULT '',
      "organizationId" varchar NOT NULL,
      "createdBy" varchar,
      "assigneeIds" text DEFAULT '',
      "storeIds" text DEFAULT '',
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_sections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(200) NOT NULL,
      description text,
      "displayOrder" integer NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT true,
      "maxScore" decimal(5,2),
      weight decimal(5,2),
      "auditId" uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_questions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "questionText" varchar(500) NOT NULL,
      "questionType" varchar(50) NOT NULL,
      options json,
      "isRequired" boolean NOT NULL DEFAULT false,
      "validationRules" json,
      "conditionalLogic" json,
      "displayOrder" integer NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT true,
      "isCritical" boolean NOT NULL DEFAULT false,
      "maxScore" decimal(5,2),
      weight decimal(5,2),
      "sectionId" uuid NOT NULL REFERENCES audit_sections(id) ON DELETE CASCADE,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);

  await client.query(`ALTER TABLE audits ADD COLUMN IF NOT EXISTS "processTags" json`);
  await client.query(`ALTER TABLE audits ADD COLUMN IF NOT EXISTS properties json`);

  console.log('Audit tables migration completed.');
} finally {
  client.release();
  await pool.end();
}

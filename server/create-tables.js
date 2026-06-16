import { Client } from 'pg';

async function createTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Rasika',
    database: 'hashibasha_user',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create process_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS process_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tagName" VARCHAR(100) NOT NULL,
        "ownerName" VARCHAR(100) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "organizationId" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created process_tags table');

    // Create indexes for process_tags
    await client.query(`CREATE INDEX IF NOT EXISTS idx_process_tags_organizationId ON process_tags("organizationId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_process_tags_tagName ON process_tags("tagName")`);
    console.log('Created indexes for process_tags');

    // Create question_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tagName" VARCHAR(100) NOT NULL,
        "values" TEXT[] DEFAULT '{}',
        "isActive" BOOLEAN DEFAULT true,
        "organizationId" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created question_tags table');

    // Create indexes for question_tags
    await client.query(`CREATE INDEX IF NOT EXISTS idx_question_tags_organizationId ON question_tags("organizationId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_question_tags_tagName ON question_tags("tagName")`);
    console.log('Created indexes for question_tags');

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
  }
}

createTables();

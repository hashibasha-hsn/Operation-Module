import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL configuration (override via DB_* or PG* env vars)
const config = {
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Rasika',
  database: 'postgres',
};

async function setupDatabases() {
  const pool = new Pool(config);
  
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.connect();
    console.log('Connected successfully!');

    // Create databases
    console.log('\nCreating databases...');
    const databases = [
      'hashibasha_auth',
      'hashibasha_user', 
      'hashibasha_org',
      'hashibasha_notification',
      'hashibasha_permission'
    ];

    for (const db of databases) {
      try {
        await pool.query(`CREATE DATABASE ${db}`);
        console.log(`✓ Database '${db}' created`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`- Database '${db}' already exists`);
        } else {
          console.error(`✗ Error creating database '${db}':`, error.message);
        }
      }
    }

    // Close connection to postgres database
    await pool.end();

    // Create schemas in each database
    console.log('\nCreating schemas...');
    
    const schemaFiles = [
      { database: 'hashibasha_auth', file: 'auth-schema.sql' },
      { database: 'hashibasha_user', file: 'user-schema.sql' },
      { database: 'hashibasha_org', file: 'org-schema.sql' },
      { database: 'hashibasha_notification', file: 'notification-schema.sql' },
      { database: 'hashibasha_permission', file: 'permission-schema.sql' },
      { database: 'hashibasha_org', file: 'noticeboard-schema.sql' },
      { database: 'hashibasha_org', file: 'translations-schema.sql' }
    ];

    for (const { database, file } of schemaFiles) {
      const dbConfig = { ...config, database };
      const dbPool = new Pool(dbConfig);
      
      try {
        await dbPool.connect();
        console.log(`\nConnected to '${database}'`);
        
        const sqlPath = path.join(__dirname, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await dbPool.query(sql);
        console.log(`✓ Schema created for '${database}'`);
        
        await dbPool.end();
      } catch (error) {
        console.error(`✗ Error setting up '${database}':`, error.message);
        await dbPool.end();
      }
    }

    console.log('\n✓ Database setup completed successfully!');
    
  } catch (error) {
    console.error('✗ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabases();

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_org'
};

async function applyNoticeboardSchema() {
  const pool = new Pool(config);
  
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.connect();
    console.log('Connected successfully!');
    
    const sqlPath = path.join(__dirname, 'noticeboard-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying noticeboard schema...');
    await pool.query(sql);
    console.log('✓ Noticeboard schema applied successfully!');
    
    await pool.end();
    console.log('Done!');
  } catch (error) {
    console.error('✗ Error applying schema:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyNoticeboardSchema();

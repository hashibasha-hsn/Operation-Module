import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_org'
};

async function createTranslationsTable() {
  const pool = new Pool(config);
  
  try {
    console.log('Connecting to hashibasha_org database...');
    await pool.connect();
    console.log('Connected successfully!');

    const sqlPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'translations-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating translations table...');
    await pool.query(sql);
    console.log('✓ Translations table created successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('✗ Error creating translations table:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createTranslationsTable();

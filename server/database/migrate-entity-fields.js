import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Rasika',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'hashibasha_org',
});

const entityColumns = [
  ['status', 'BOOLEAN DEFAULT true'],
  ['registrationName', 'VARCHAR(255)'],
  ['companyId', 'VARCHAR(100)'],
  ['taxSchemeId', 'VARCHAR(50)'],
  ['businessCategory', 'VARCHAR(255)'],
  ['businessIdentificationId', 'VARCHAR(100)'],
  ['identificationScheme', 'VARCHAR(50)'],
  ['streetName', 'VARCHAR(255)'],
  ['districtName', 'VARCHAR(100)'],
  ['cityName', 'VARCHAR(100)'],
  ['buildingNumber', 'VARCHAR(50)'],
  ['postalZone', 'VARCHAR(50)'],
  ['countryIdentificationCode', 'VARCHAR(10)'],
  ['csrIndustryBusinessCategory', 'VARCHAR(255)'],
  ['csrCommonName', 'VARCHAR(255)'],
  ['csrSerialNumber', 'VARCHAR(255)'],
  ['csrOrganizationIdentifier', 'VARCHAR(255)'],
  ['csrOrganizationUnitName', 'VARCHAR(255)'],
  ['csrOrganizationName', 'VARCHAR(255)'],
  ['csrCountryName', 'VARCHAR(10)'],
  ['csrInvoiceType', 'VARCHAR(100)'],
  ['csrLocationAddress', 'VARCHAR(500)'],
  ['csrEnvironmentType', 'VARCHAR(50)'],
  ['generatedCsr', 'TEXT'],
  ['generatedPrivateKey', 'TEXT'],
  ['ccsidOtp', 'VARCHAR(100)'],
  ['ccsidBinaryToken', 'TEXT'],
  ['tokenSecret', 'VARCHAR(255)'],
  ['requestId', 'VARCHAR(100)'],
  ['pcsidBinaryToken', 'TEXT'],
  ['pcsidSecret', 'VARCHAR(255)'],
  ['registeredDate', 'TIMESTAMP'],
];

const removedColumns = [
  ['status', 'BOOLEAN DEFAULT true'],
  ['registrationName', 'VARCHAR(255)'],
  ['companyId', 'VARCHAR(100)'],
  ['taxSchemeId', 'VARCHAR(50)'],
  ['businessCategory', 'VARCHAR(255)'],
  ['businessIdentificationId', 'VARCHAR(100)'],
  ['identificationScheme', 'VARCHAR(50)'],
  ['streetName', 'VARCHAR(255)'],
  ['districtName', 'VARCHAR(100)'],
  ['cityName', 'VARCHAR(100)'],
  ['buildingNumber', 'VARCHAR(50)'],
  ['postalZone', 'VARCHAR(50)'],
  ['countryIdentificationCode', 'VARCHAR(10)'],
  ['csrIndustryBusinessCategory', 'VARCHAR(255)'],
  ['csrCommonName', 'VARCHAR(255)'],
  ['csrSerialNumber', 'VARCHAR(255)'],
  ['csrOrganizationIdentifier', 'VARCHAR(255)'],
  ['csrOrganizationUnitName', 'VARCHAR(255)'],
  ['csrOrganizationName', 'VARCHAR(255)'],
  ['csrCountryName', 'VARCHAR(10)'],
  ['csrInvoiceType', 'VARCHAR(100)'],
  ['csrLocationAddress', 'VARCHAR(500)'],
  ['csrEnvironmentType', 'VARCHAR(50)'],
  ['generatedCsr', 'TEXT'],
  ['generatedPrivateKey', 'TEXT'],
  ['ccsidOtp', 'VARCHAR(100)'],
  ['ccsidBinaryToken', 'TEXT'],
  ['tokenSecret', 'VARCHAR(255)'],
  ['requestId', 'VARCHAR(100)'],
  ['pcsidBinaryToken', 'TEXT'],
  ['pcsidSecret', 'VARCHAR(255)'],
  ['registeredDate', 'TIMESTAMP'],
];

async function addColumns(client, table, columns) {
  for (const [name, type] of columns) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "${name}" ${type}`);
  }
}

const client = await pool.connect();
try {
  await addColumns(client, 'entities', entityColumns);
  await addColumns(client, 'removed_entities', removedColumns);
  console.log('Entity profile columns migration completed.');
} finally {
  client.release();
  await pool.end();
}

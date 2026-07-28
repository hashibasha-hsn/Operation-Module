const pg = require('pg');
const pool = new pg.Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'Rasika',
  database: 'hashibasha_org',
});
pool
  .query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='assessments' ORDER BY ordinal_position",
  )
  .then((r) => {
    console.log(r.rows.map((x) => x.column_name).join(', '));
    pool.end();
  })
  .catch((e) => {
    console.error(e);
    pool.end();
  });

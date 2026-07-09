const { getPgClient, useLocationSchema } = require('./location-import-config.cjs');

(async () => {
  const client = getPgClient();
  await client.connect();
  await useLocationSchema(client);

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM sa_region) AS regions,
      (SELECT COUNT(*)::int FROM sa_cities) AS cities,
      (SELECT COUNT(*)::int FROM sa_districts) AS districts,
      (SELECT COUNT(*)::int FROM countries) AS countries,
      (SELECT COUNT(*)::int FROM states) AS states,
      (SELECT COUNT(*)::int FROM cities) AS generic_cities
  `);
  console.log('Counts:', counts.rows[0]);

  const region = await client.query(
    `SELECT id, name, name_ar FROM sa_region WHERE name ILIKE '%asir%' OR name_ar LIKE '%عسير%' LIMIT 1`,
  );
  console.log('Asir region:', region.rows[0]);

  if (region.rows[0]) {
    const cities = await client.query(
      'SELECT id, name, name_ar FROM sa_cities WHERE region_id = $1 ORDER BY name LIMIT 5',
      [region.rows[0].id],
    );
    console.log('Sample cities:', cities.rows);

    if (cities.rows[0]) {
      const districts = await client.query(
        'SELECT id, name, name_ar FROM sa_districts WHERE city_id = $1 ORDER BY name LIMIT 3',
        [cities.rows[0].id],
      );
      console.log('Sample districts:', districts.rows);
    }
  }

  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

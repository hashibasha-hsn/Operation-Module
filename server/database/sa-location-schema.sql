-- Saudi Arabia National Address location tables
-- Database: hashibasha_location

CREATE TABLE IF NOT EXISTS sa_region (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  code VARCHAR(10) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sa_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES sa_region(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (region_id, name_ar)
);

CREATE TABLE IF NOT EXISTS sa_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES sa_cities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  code VARCHAR(10),
  postal_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (city_id, name_ar)
);

CREATE INDEX IF NOT EXISTS idx_sa_cities_region ON sa_cities(region_id);
CREATE INDEX IF NOT EXISTS idx_sa_districts_city ON sa_districts(city_id);
CREATE INDEX IF NOT EXISTS idx_sa_region_name_ar ON sa_region(name_ar);
CREATE INDEX IF NOT EXISTS idx_sa_cities_name_ar ON sa_cities(name_ar);
CREATE INDEX IF NOT EXISTS idx_sa_districts_name_ar ON sa_districts(name_ar);

CREATE OR REPLACE FUNCTION update_sa_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sa_region_updated_at ON sa_region;
CREATE TRIGGER trg_sa_region_updated_at
  BEFORE UPDATE ON sa_region
  FOR EACH ROW EXECUTE FUNCTION update_sa_location_updated_at();

DROP TRIGGER IF EXISTS trg_sa_cities_updated_at ON sa_cities;
CREATE TRIGGER trg_sa_cities_updated_at
  BEFORE UPDATE ON sa_cities
  FOR EACH ROW EXECUTE FUNCTION update_sa_location_updated_at();

DROP TRIGGER IF EXISTS trg_sa_districts_updated_at ON sa_districts;
CREATE TRIGGER trg_sa_districts_updated_at
  BEFORE UPDATE ON sa_districts
  FOR EACH ROW EXECUTE FUNCTION update_sa_location_updated_at();

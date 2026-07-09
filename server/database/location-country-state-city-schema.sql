-- Generic Country / State / City location tables
-- Database: hashibasha_location

-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  name_ar      VARCHAR(150),
  code         VARCHAR(10)  UNIQUE,          -- ISO 3166-1 alpha-2, e.g. "SA"
  code3        VARCHAR(10)  UNIQUE,          -- ISO 3166-1 alpha-3, e.g. "SAU"
  phone_code   VARCHAR(10),                  -- e.g. "+966"
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_by   VARCHAR(255),
  updated_by   VARCHAR(255),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- States / Provinces / Regions
CREATE TABLE IF NOT EXISTS states (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id   UUID         NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  name_ar      VARCHAR(150),
  code         VARCHAR(20),
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_by   VARCHAR(255),
  updated_by   VARCHAR(255),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (country_id, name)
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id     UUID         NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  name_ar      VARCHAR(150),
  code         VARCHAR(20),
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_by   VARCHAR(255),
  updated_by   VARCHAR(255),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (state_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_states_country_id   ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_states_name         ON states(name);
CREATE INDEX IF NOT EXISTS idx_states_name_ar      ON states(name_ar);
CREATE INDEX IF NOT EXISTS idx_cities_state_id     ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_name         ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_name_ar      ON cities(name_ar);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_countries_updated_at ON countries;
CREATE TRIGGER trg_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_location_updated_at();

DROP TRIGGER IF EXISTS trg_states_updated_at ON states;
CREATE TRIGGER trg_states_updated_at
  BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_location_updated_at();

DROP TRIGGER IF EXISTS trg_cities_updated_at ON cities;
CREATE TRIGGER trg_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_location_updated_at();

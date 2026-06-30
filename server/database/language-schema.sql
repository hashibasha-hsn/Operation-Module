-- Language service database schema (hashibasha_language)
CREATE TABLE IF NOT EXISTS language_entries (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  en TEXT NOT NULL,
  ar TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_language_entries_key ON language_entries(key);

CREATE OR REPLACE FUNCTION update_language_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_language_entries_updated_at ON language_entries;
CREATE TRIGGER trigger_update_language_entries_updated_at
  BEFORE UPDATE ON language_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_language_entries_updated_at();

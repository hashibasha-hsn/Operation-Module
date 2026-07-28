-- Adds created_by / updated_by (and timestamps if missing) to ALL tables across Hashibasha schemas.
-- Safe to run multiple times (IF NOT EXISTS guards).
-- Run in Supabase SQL editor or: psql $DATABASE_URL -f server/database/add-audit-columns-migration.sql

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN (
      'hashibasha_auth',
      'hashibasha_user',
      'hashibasha_org',
      'hashibasha_notification',
      'hashibasha_permission',
      'hashibasha_location',
      'hashibasha_language'
    )
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_by varchar(255)', rec.table_schema, rec.table_name);
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_by varchar(255)', rec.table_schema, rec.table_name);
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()', rec.table_schema, rec.table_name);
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()', rec.table_schema, rec.table_name);
  END LOOP;
END $$;

-- BI dashboards previously used last_modified_by — copy into updated_by then drop legacy column if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'hashibasha_org' AND table_name = 'bi_dashboards' AND column_name = 'last_modified_by'
  ) THEN
    UPDATE hashibasha_org.bi_dashboards
    SET updated_by = COALESCE(updated_by, last_modified_by)
    WHERE last_modified_by IS NOT NULL;
    ALTER TABLE hashibasha_org.bi_dashboards DROP COLUMN IF EXISTS last_modified_by;
  END IF;
END $$;

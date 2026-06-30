-- Add region and location reference columns to entities
ALTER TABLE entities ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS "regionId" VARCHAR(36);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS "cityId" VARCHAR(36);
ALTER TABLE entities ADD COLUMN IF NOT EXISTS "districtId" VARCHAR(36);

CREATE INDEX IF NOT EXISTS idx_entities_region ON entities(region);

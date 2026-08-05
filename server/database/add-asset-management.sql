-- Asset management module extension
-- Run against the hashibasha_org schema (org service) for existing deployments.
-- org-service uses SnakeNamingStrategy, so columns are snake_case.

-- Asset table config extensions
ALTER TABLE asset_tables
  ADD COLUMN IF NOT EXISTS "publish_status" varchar(50) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "renewal_reminder_config" json,
  ADD COLUMN IF NOT EXISTS "view_roles" json,
  ADD COLUMN IF NOT EXISTS "edit_roles" json,
  ADD COLUMN IF NOT EXISTS "lock_table_operations" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Asset entry extensions
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS "table_id" varchar,
  ADD COLUMN IF NOT EXISTS "owner_user_id" varchar,
  ADD COLUMN IF NOT EXISTS "photo_urls" json,
  ADD COLUMN IF NOT EXISTS "file_urls" json,
  ADD COLUMN IF NOT EXISTS "ticket_ids" json,
  ADD COLUMN IF NOT EXISTS "previous_owners" json;

-- Filter presets
CREATE TABLE IF NOT EXISTS asset_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  criteria json,
  visibility varchar(50) DEFAULT 'private',
  "created_by" varchar,
  "organization_id" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_table_id ON assets ("table_id");
CREATE INDEX IF NOT EXISTS idx_assets_owner_user_id ON assets ("owner_user_id");
CREATE INDEX IF NOT EXISTS idx_asset_filters_organization ON asset_filters ("organization_id");

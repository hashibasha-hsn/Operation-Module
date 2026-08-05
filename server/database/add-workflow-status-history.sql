-- Add workflow status-history timeline + parent/child hierarchy columns
-- Run against the hashibasha_org schema (org service) for existing deployments.
-- org-service uses SnakeNamingStrategy, so columns are snake_case.

ALTER TABLE processes
  ADD COLUMN IF NOT EXISTS "status_history" json,
  ADD COLUMN IF NOT EXISTS "parent_id" varchar;

ALTER TABLE audits
  ADD COLUMN IF NOT EXISTS "status_history" json,
  ADD COLUMN IF NOT EXISTS "parent_id" varchar;

CREATE INDEX IF NOT EXISTS idx_processes_parent_id ON processes ("parent_id");
CREATE INDEX IF NOT EXISTS idx_audits_parent_id ON audits ("parent_id");

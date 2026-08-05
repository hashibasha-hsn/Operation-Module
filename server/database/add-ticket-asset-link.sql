-- Ticket ↔ Asset link (hashibasha_org)

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS asset_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tickets_asset ON tickets(asset_id);

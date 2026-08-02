-- Email service config columns for Microsoft Graph delivery.
-- Idempotent: safe to run multiple times.

ALTER TABLE hashibasha_notification.email_config_settings
  ADD COLUMN IF NOT EXISTS "deliveryProvider" text DEFAULT 'smtp',
  ADD COLUMN IF NOT EXISTS "azureTenantId" text,
  ADD COLUMN IF NOT EXISTS "azureClientId" text,
  ADD COLUMN IF NOT EXISTS "azureClientSecret" text,
  ADD COLUMN IF NOT EXISTS "graphSendAsUser" text,
  ADD COLUMN IF NOT EXISTS "frontendUrl" text;

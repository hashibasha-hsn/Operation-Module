-- Platform audit logs (hashibasha_org)

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target VARCHAR(100) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  "performedBy" VARCHAR(255) NOT NULL,
  details JSONB,
  "targetId" VARCHAR(255),
  "organizationId" VARCHAR(255) NOT NULL DEFAULT 'default-org',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs("organizationId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs("performedBy");

-- Permission Service Database Schema
-- Database: hashibasha_permission

-- Permission cache table (for performance)
CREATE TABLE IF NOT EXISTS permission_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    permissions JSONB NOT NULL,
    scope_id UUID,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permission audit log table
CREATE TABLE IF NOT EXISTS permission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    permission_required VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL,
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role change history table
CREATE TABLE IF NOT EXISTS role_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    old_role_id UUID,
    new_role_id UUID NOT NULL,
    changed_by UUID NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scope access table (for hierarchical scope validation)
CREATE TABLE IF NOT EXISTS scope_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID NOT NULL,
    access_level VARCHAR(20) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes for better performance
CREATE INDEX idx_permission_cache_user_id ON permission_cache(user_id);
CREATE INDEX idx_permission_cache_role_id ON permission_cache(role_id);
CREATE INDEX idx_permission_cache_expires_at ON permission_cache(expires_at);
CREATE INDEX idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX idx_permission_audit_logs_action ON permission_audit_logs(action);
CREATE INDEX idx_permission_audit_logs_created_at ON permission_audit_logs(created_at);
CREATE INDEX idx_role_change_history_user_id ON role_change_history(user_id);
CREATE INDEX idx_role_change_history_changed_at ON role_change_history(changed_at);
CREATE INDEX idx_scope_access_user_id ON scope_access(user_id);
CREATE INDEX idx_scope_access_scope_id ON scope_access(scope_id);
CREATE INDEX idx_scope_access_is_active ON scope_access(is_active);

-- Clean up expired cache entries (scheduled cleanup)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM permission_cache WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM scope_access WHERE expires_at < CURRENT_TIMESTAMP AND expires_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

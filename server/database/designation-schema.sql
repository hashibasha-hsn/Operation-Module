-- Designation and Feature Permission Schema
-- Database: hashibasha_user (or separate designation database)

-- Designations table (custom job titles)
CREATE TABLE IF NOT EXISTS designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reporting_designation_id UUID REFERENCES designations(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, organization_id)
);

-- System Roles table (pre-defined roles with scope and creator access)
CREATE TABLE IF NOT EXISTS system_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    scope_level VARCHAR(20) NOT NULL, -- 'org', 'regional', 'store', 'task'
    has_creator_access BOOLEAN DEFAULT false, -- can create workflows/processes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features table (define system features)
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'workflow', 'user', 'reporting', 'asset', 'ticket', etc.
    description TEXT,
    requires_creator_access BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Feature Permissions table (map system roles to features)
CREATE TABLE IF NOT EXISTS role_feature_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL, -- 'read', 'write', 'delete', 'admin'
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, feature_id)
);

-- Designation Role Mapping table (map custom designations to system roles)
CREATE TABLE IF NOT EXISTS designation_role_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation_id UUID NOT NULL REFERENCES designations(id) ON DELETE CASCADE,
    system_role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mapped_by UUID,
    UNIQUE(designation_id, organization_id)
);

-- User Designation Assignment table (assign users to designations)
CREATE TABLE IF NOT EXISTS user_designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    designation_id UUID NOT NULL REFERENCES designations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    is_primary BOOLEAN DEFAULT true,
    UNIQUE(user_id, organization_id, is_primary)
);

-- Indexes for better performance
CREATE INDEX idx_designations_organization_id ON designations(organization_id);
CREATE INDEX idx_designations_reporting_designation_id ON designations(reporting_designation_id);
CREATE INDEX idx_system_roles_scope_level ON system_roles(scope_level);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_role_feature_permissions_role_id ON role_feature_permissions(role_id);
CREATE INDEX idx_role_feature_permissions_feature_id ON role_feature_permissions(feature_id);
CREATE INDEX idx_designation_role_mapping_designation_id ON designation_role_mapping(designation_id);
CREATE INDEX idx_designation_role_mapping_system_role_id ON designation_role_mapping(system_role_id);
CREATE INDEX idx_user_designations_user_id ON user_designations(user_id);
CREATE INDEX idx_user_designations_designation_id ON user_designations(designation_id);

-- Insert default system roles (based on Taqtics model)
INSERT INTO system_roles (name, display_name, description, scope_level, has_creator_access) VALUES
('company_admin', 'Company Admin', 'Full organization-wide access with creator privileges', 'org', true),
('non_creator_company_admin', 'Non-Creator Company Admin', 'Full organization-wide access without creator privileges', 'org', false),
('area_manager', 'Area Manager', 'Regional scope with creator privileges', 'regional', true),
('non_creator_area_manager', 'Non-Creator Area Manager', 'Regional scope without creator privileges', 'regional', false),
('process_manager', 'Process Manager', 'Specific process management with creator privileges', 'regional', true),
('user_manager', 'User Manager', 'User oversight and management', 'regional', false),
('store_manager', 'Store Manager', 'Store-level scope with creator privileges', 'store', true),
('non_creator_store_manager', 'Non-Creator Store Manager', 'Store-level scope without creator privileges', 'store', false),
('store_employee', 'Store Employee', 'Task execution only', 'task', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default features
INSERT INTO features (name, display_name, category, description, requires_creator_access) VALUES
('workflow_create', 'Create Workflows', 'workflow', 'Create and design workflows', true),
('workflow_edit', 'Edit Workflows', 'workflow', 'Edit existing workflows', true),
('workflow_execute', 'Execute Workflows', 'workflow', 'Execute assigned workflows', false),
('workflow_view', 'View Workflows', 'workflow', 'View workflows', false),
('user_create', 'Create Users', 'user', 'Create new users', false),
('user_edit', 'Edit Users', 'user', 'Edit user details', false),
('user_delete', 'Delete Users', 'user', 'Delete users', false),
('user_view', 'View Users', 'user', 'View user list', false),
('designation_create', 'Create Designations', 'user', 'Create new designations', false),
('designation_edit', 'Edit Designations', 'user', 'Edit designations', false),
('reporting_dashboard', 'Reporting Dashboard', 'reporting', 'Access BI dashboards', false),
('reporting_export', 'Export Reports', 'reporting', 'Export reports', false),
('asset_create', 'Create Assets', 'asset', 'Create new assets', false),
('asset_edit', 'Edit Assets', 'asset', 'Edit assets', false),
('asset_view', 'View Assets', 'asset', 'View asset registers and details', false),
('asset_delete', 'Delete Assets', 'asset', 'Delete assets', false),
('asset_transfer', 'Transfer Asset Ownership', 'asset', 'Transfer asset ownership between users', false),
('asset_publish', 'Publish Asset Tables', 'asset', 'Publish and archive asset tables', true),
('asset_import', 'Bulk Import Assets', 'asset', 'Bulk upload assets from Excel', false),
('asset_ticket', 'Create Tickets from Assets', 'asset', 'Create issue tickets from asset records', false),
('asset_report', 'Asset Reports', 'asset', 'Access asset reports and PDF exports', false),
('ticket_create', 'Create Tickets', 'ticket', 'Create issue tickets', false),
('ticket_resolve', 'Resolve Tickets', 'ticket', 'Resolve issue tickets', false),
('learning_view', 'View Learning', 'learning', 'Access learning content and courses', false)
ON CONFLICT (name) DO NOTHING;

-- Grant default permissions for Company Admin (full access)
INSERT INTO role_feature_permissions (role_id, feature_id, permission_level)
SELECT 
    (SELECT id FROM system_roles WHERE name = 'company_admin'),
    id,
    'admin'
FROM features
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Grant default permissions for Area Manager (regional access)
INSERT INTO role_feature_permissions (role_id, feature_id, permission_level)
SELECT 
    (SELECT id FROM system_roles WHERE name = 'area_manager'),
    id,
    CASE 
        WHEN category = 'workflow' THEN 'write'
        WHEN category = 'reporting' THEN 'write'
        WHEN category = 'user' THEN 'read'
        ELSE 'read'
    END
FROM features
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Grant default permissions for Store Manager (store-level access)
INSERT INTO role_feature_permissions (role_id, feature_id, permission_level)
SELECT 
    (SELECT id FROM system_roles WHERE name = 'store_manager'),
    id,
    CASE 
        WHEN category = 'workflow' THEN 'write'
        WHEN category = 'user' THEN 'read'
        WHEN category = 'reporting' THEN 'read'
        ELSE 'read'
    END
FROM features
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Grant default permissions for Store Employee (task execution only)
INSERT INTO role_feature_permissions (role_id, feature_id, permission_level)
SELECT 
    (SELECT id FROM system_roles WHERE name = 'store_employee'),
    id,
    CASE 
        WHEN name = 'workflow_execute' THEN 'write'
        WHEN name = 'workflow_view' THEN 'read'
        ELSE 'read'
    END
FROM features
ON CONFLICT (role_id, feature_id) DO NOTHING;

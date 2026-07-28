-- Organization Service Database Schema
-- Database: hashibasha_org

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    industry VARCHAR(100),
    company_size VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'FREE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regions table (hierarchical structure)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    parent_region_id UUID REFERENCES regions(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table (stores/branches)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    region_id UUID REFERENCES regions(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'UAE',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    location_type VARCHAR(50) DEFAULT 'STORE',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_regions_org_id ON regions(org_id);
CREATE INDEX idx_regions_parent_region_id ON regions(parent_region_id);
CREATE INDEX idx_locations_org_id ON locations(org_id);
CREATE INDEX idx_locations_region_id ON locations(region_id);
CREATE INDEX idx_locations_location_type ON locations(location_type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Process/Audit submissions
CREATE TABLE IF NOT EXISTS submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "workflowType" varchar NOT NULL,
    "workflowId" uuid NOT NULL,
    "storeId" uuid NOT NULL,
    "submittedBy" varchar NOT NULL,
    status varchar NOT NULL DEFAULT 'new',
    answers json,
    attachments json,
    score decimal(5,2),
    passed boolean NOT NULL DEFAULT false,
    "dueDate" timestamp,
    "submittedAt" timestamp,
    "reviewHistory" json,
    "currentReviewLevel" integer NOT NULL DEFAULT 0,
    "organizationId" varchar NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_org
    ON submissions ("submittedBy", "organizationId", "workflowType");

CREATE INDEX IF NOT EXISTS idx_submissions_draft
    ON submissions ("workflowId", "submittedBy", "storeId", status);

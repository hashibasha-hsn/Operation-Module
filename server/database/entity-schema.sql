-- Entity Database Schema
-- Database: hashibasha_org

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL,
    area VARCHAR(100),
    entity_id VARCHAR(100) UNIQUE,
    store_status VARCHAR(50) DEFAULT 'Functional',
    city VARCHAR(100),
    region VARCHAR(100),
    "regionId" VARCHAR(36),
    "cityId" VARCHAR(36),
    "districtId" VARCHAR(36),
    staff INTEGER,
    latitude DECIMAL(10, 8) DEFAULT 0.00000000,
    longitude DECIMAL(11, 8) DEFAULT 0.00000000,
    store_radius INTEGER DEFAULT 100,
    organization_id UUID NOT NULL,
    status BOOLEAN DEFAULT true,
    registration_name VARCHAR(255),
    company_id VARCHAR(100),
    tax_scheme_id VARCHAR(50),
    business_category VARCHAR(255),
    business_identification_id VARCHAR(100),
    identification_scheme VARCHAR(50),
    street_name VARCHAR(255),
    district_name VARCHAR(100),
    city_name VARCHAR(100),
    building_number VARCHAR(50),
    postal_zone VARCHAR(50),
    country_identification_code VARCHAR(10),
    csr_industry_business_category VARCHAR(255),
    csr_common_name VARCHAR(255),
    csr_serial_number VARCHAR(255),
    csr_organization_identifier VARCHAR(255),
    csr_organization_unit_name VARCHAR(255),
    csr_organization_name VARCHAR(255),
    csr_country_name VARCHAR(10),
    csr_invoice_type VARCHAR(100),
    csr_location_address VARCHAR(500),
    csr_environment_type VARCHAR(50),
    generated_csr TEXT,
    generated_private_key TEXT,
    ccsid_otp VARCHAR(100),
    ccsid_binary_token TEXT,
    token_secret VARCHAR(255),
    request_id VARCHAR(100),
    pcsid_binary_token TEXT,
    pcsid_secret VARCHAR(255),
    registered_date TIMESTAMP,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT chk_store_radius CHECK (store_radius >= 100 AND store_radius <= 1000)
);

-- Indexes for better performance
CREATE INDEX idx_entities_organization_id ON entities(organization_id);
CREATE INDEX idx_entities_store_status ON entities(store_status);
CREATE INDEX idx_entities_city ON entities(city);
CREATE INDEX idx_entities_area ON entities(area);
CREATE INDEX idx_entities_status ON entities(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

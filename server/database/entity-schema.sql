-- Entity Database Schema
-- Database: hashibasha_org

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL,
    area VARCHAR(100),
    entity_id VARCHAR(100) UNIQUE,
    store_status VARCHAR(50) DEFAULT 'Functional',
    city VARCHAR(100),
    staff INTEGER,
    status BOOLEAN DEFAULT true,
    latitude DECIMAL(10, 8) DEFAULT 0.00000000,
    longitude DECIMAL(11, 8) DEFAULT 0.00000000,
    store_radius INTEGER DEFAULT 100,
    organization_id UUID NOT NULL,
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

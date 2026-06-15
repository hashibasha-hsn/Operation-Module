-- Attendance Configuration and Records Schema

-- Attendance Configuration Table
CREATE TABLE IF NOT EXISTS attendance_config (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    store_id VARCHAR(255),
    check_in_time TIME NOT NULL DEFAULT '09:00:00',
    check_out_time TIME NOT NULL DEFAULT '18:00:00',
    grace_period_minutes INTEGER NOT NULL DEFAULT 15,
    require_selfie BOOLEAN NOT NULL DEFAULT true,
    require_gps BOOLEAN NOT NULL DEFAULT true,
    allowed_gps_radius_meters INTEGER NOT NULL DEFAULT 100,
    enable_auto_checkout BOOLEAN NOT NULL DEFAULT false,
    notify_on_late BOOLEAN NOT NULL DEFAULT true,
    notify_on_absent BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    store_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    total_hours DECIMAL(5,2),
    status VARCHAR(50) NOT NULL, -- 'present', 'absent', 'late', 'checked-in', 'on-leave'
    selfie_url TEXT,
    location TEXT,
    gps_coordinates TEXT,
    gps_accuracy_meters DECIMAL(10,2),
    ip_address VARCHAR(45),
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Attendance Assignments Table (for assigning attendance policies to users/stores)
CREATE TABLE IF NOT EXISTS attendance_assignments (
    id SERIAL PRIMARY KEY,
    attendance_config_id INTEGER NOT NULL,
    assignee_type VARCHAR(50) NOT NULL, -- 'store', 'user', 'designation'
    assignee_id VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (attendance_config_id) REFERENCES attendance_config(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Attendance Exceptions Table (for holidays, leave, etc.)
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    store_id VARCHAR(255),
    organization_id VARCHAR(255) NOT NULL,
    exception_type VARCHAR(50) NOT NULL, -- 'holiday', 'leave', 'sick', 'personal'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Attendance Reports Table (for generating and storing reports)
CREATE TABLE IF NOT EXISTS attendance_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    store_id VARCHAR(255),
    user_id VARCHAR(255),
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_by VARCHAR(255) NOT NULL,
    file_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_store_id ON attendance_records(store_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_org_id ON attendance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_config_org_id ON attendance_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_config_store_id ON attendance_config(store_id);
CREATE INDEX IF NOT EXISTS idx_attendance_assignments_config_id ON attendance_assignments(attendance_config_id);
CREATE INDEX IF NOT EXISTS idx_attendance_assignments_assignee_id ON attendance_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_user_id ON attendance_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_date_range ON attendance_exceptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_org_id ON attendance_reports(organization_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_config_updated_at BEFORE UPDATE ON attendance_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_exceptions_updated_at BEFORE UPDATE ON attendance_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

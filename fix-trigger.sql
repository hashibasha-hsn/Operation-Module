DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE OR REPLACE FUNCTION update_users_updatedAt()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_users_updatedAt();

-- Also apply the migrate-user-lastlogin migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;

-- Ensure user_profiles has lastlogin column used by User Management
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lastlogin TIMESTAMP;

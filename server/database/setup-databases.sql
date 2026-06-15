-- Main database setup script for Hashi Basha microservices
-- PostgreSQL port: 5432, Password: Rasika

-- Create databases for each service
CREATE DATABASE IF NOT EXISTS hashibasha_auth;
CREATE DATABASE IF NOT EXISTS hashibasha_user;
CREATE DATABASE IF NOT EXISTS hashibasha_org;
CREATE DATABASE IF NOT EXISTS hashibasha_notification;
CREATE DATABASE IF NOT EXISTS hashibasha_permission;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE hashibasha_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hashibasha_user TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hashibasha_org TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hashibasha_notification TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hashibasha_permission TO postgres;

-- Display created databases
\l

-- Database initialization script for Vibe LMS
-- This script ensures the database is properly set up with required extensions

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE vibelms TO vibelms;
GRANT ALL PRIVILEGES ON SCHEMA public TO vibelms;
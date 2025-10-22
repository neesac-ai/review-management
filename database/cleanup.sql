-- Database Cleanup Script
-- Run this BEFORE running the main schema.sql

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view own profile" ON clients;
DROP POLICY IF EXISTS "Users can update own profile" ON clients;
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view templates for own businesses" ON review_templates;
DROP POLICY IF EXISTS "Users can insert templates for own businesses" ON review_templates;
DROP POLICY IF EXISTS "Users can update templates for own businesses" ON review_templates;
DROP POLICY IF EXISTS "Users can delete templates for own businesses" ON review_templates;
DROP POLICY IF EXISTS "Users can view QR codes for own businesses" ON qr_codes;
DROP POLICY IF EXISTS "Users can insert QR codes for own businesses" ON qr_codes;
DROP POLICY IF EXISTS "Users can update QR codes for own businesses" ON qr_codes;
DROP POLICY IF EXISTS "Users can delete QR codes for own businesses" ON qr_codes;
DROP POLICY IF EXISTS "Users can view feedback for own businesses" ON feedback;
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update feedback for own businesses" ON feedback;
DROP POLICY IF EXISTS "Users can view analytics for own businesses" ON analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics;
DROP POLICY IF EXISTS "Public can view QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Public can view businesses for QR codes" ON businesses;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS review_templates CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS ai_model_configs CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS ai_models CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS qr_type CASCADE;
DROP TYPE IF EXISTS template_status CASCADE;
DROP TYPE IF EXISTS feedback_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extensions (optional - only if you want to remove them completely)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Reset RLS on any remaining tables
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_model_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_models DISABLE ROW LEVEL SECURITY;

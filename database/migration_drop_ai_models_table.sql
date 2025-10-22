-- Migration: Drop unused ai_models table
-- This table was initially created with hardcoded models, but we switched to 
-- dynamic model fetching from providers. The ai_model_configs table is sufficient.

-- Drop the ai_models table
DROP TABLE IF EXISTS ai_models CASCADE;

-- Verify by listing remaining tables (optional check)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';


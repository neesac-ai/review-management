-- Migration: Add review_content column to analytics table
-- Run this if your analytics table already exists

-- Add review_content column to store the review text
ALTER TABLE analytics 
ADD COLUMN IF NOT EXISTS review_content TEXT;

-- Add comment
COMMENT ON COLUMN analytics.review_content IS 'The AI-generated review content (for copy_review events)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_review_content ON analytics(review_content) WHERE review_content IS NOT NULL;


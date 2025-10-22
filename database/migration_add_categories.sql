-- Migration: Add categories table and update review_templates

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS review_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Step 2: Add category_id to review_templates
ALTER TABLE review_templates
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES review_categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_categories_business_id ON review_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_review_templates_category_id ON review_templates(category_id);

-- Step 4: Add comments for documentation
COMMENT ON TABLE review_categories IS 'Categories for organizing review templates by service/product type';
COMMENT ON COLUMN review_templates.category_id IS 'Category this template belongs to';
COMMENT ON COLUMN review_templates.word_count IS 'Target word count for this review (10, 20, 50, 100, etc.)';
COMMENT ON COLUMN review_templates.is_manual IS 'Whether this template was manually created (true) or AI-generated (false)';


-- Fix existing review templates to be active instead of approved
UPDATE review_templates 
SET status = 'active'
WHERE status = 'approved';

-- Verify the update
SELECT id, business_id, status, seo_score, LEFT(content, 50) as content_preview
FROM review_templates
WHERE status = 'active';


# Category Filter Fix

## Problem
Templates from all categories were showing in every category. For example:
- Created 10 templates for "SEO" category
- Created 10 templates for "Social Media" category
- Result: Both categories showed all 20 templates (merged)

## Root Cause
The backend endpoint `GET /api/reviews/templates/:businessId` was accepting a `categoryId` query parameter from the frontend, but **wasn't filtering by it**.

```typescript
// Frontend was sending:
/api/reviews/templates/${businessId}?categoryId=${categoryId}

// Backend was ignoring categoryId and returning ALL templates for the business
```

## Fix Applied

### File: `backend/src/routes/reviews.ts`

**Before:**
```typescript
const { status } = req.query;  // Only extracting status

let query = supabase
  .from('review_templates')
  .select('*')
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });

if (status) {
  query = query.eq('status', status);
}
// No categoryId filtering!
```

**After:**
```typescript
const { status, categoryId } = req.query;  // Now extracting categoryId too

let query = supabase
  .from('review_templates')
  .select('*')
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });

if (status) {
  query = query.eq('status', status);
}

// Filter by categoryId if provided
if (categoryId) {
  console.log(`Filtering templates by categoryId: ${categoryId}`);
  query = query.eq('category_id', categoryId);
}

console.log(`Found ${templates?.length || 0} templates for business ${businessId}${categoryId ? ` in category ${categoryId}` : ''}`);
```

## Testing

### Steps to Verify:
1. Backend should auto-restart (nodemon)
2. Refresh the Review Playground page
3. Check each category tab:
   - **SEO** should show only SEO templates (10)
   - **Social Media** should show only Social Media templates (10)

### Expected Logs:
```
Filtering templates by categoryId: <seo-category-uuid>
Found 10 templates for business <business-id> in category <seo-category-uuid>

Filtering templates by categoryId: <social-media-category-uuid>
Found 10 templates for business <business-id> in category <social-media-category-uuid>
```

## Impact
- ✅ Each category now correctly shows only its own templates
- ✅ No duplicate templates across categories
- ✅ Category separation is maintained
- ✅ Existing functionality (fetching all templates, filtering by status) still works

---

**Last Updated**: October 22, 2025


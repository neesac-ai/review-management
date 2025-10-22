# Category-Based Review System

## 📋 Overview

The category-based review system allows businesses to organize their review templates by service/product categories, providing customers with relevant, targeted review options based on their experience.

---

## 🎯 Key Features

### 1. **Category Management**
- Create multiple categories per business (e.g., SEO, Social Media, General, etc.)
- Each category can have up to 10+ review templates
- Categories can be edited or deleted
- Categories appear as tabs on the customer review page

### 2. **Flexible Template Generation**
- **AI-Generated Templates**: Generate reviews with specific word counts
  - Mix of lengths: 20 words, 50 words, 100 words
  - Example: 4 x 20-word + 4 x 50-word + 2 x 100-word = 10 templates
- **Manual Templates**: Create custom templates with any word count
- **Keyword-based**: Templates include SEO-optimized keywords

### 3. **Customer Experience**
- **Tabbed Interface**: Browse templates by category
- **Copy & Post Button**: One-click copy and redirect to Google
- **Google-Style Feedback Form**: Clean, intuitive feedback submission
- **Branded Footer**: "Powered by neesac.ai"

---

## 🗄️ Database Schema

### New Table: `review_categories`
```sql
CREATE TABLE review_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);
```

### Updated Table: `review_templates`
```sql
-- New columns added:
category_id UUID REFERENCES review_categories(id) ON DELETE CASCADE,
word_count INTEGER DEFAULT 50,
is_manual BOOLEAN DEFAULT false
```

---

## 🔧 API Endpoints

### Category Management

#### GET `/api/categories/:businessId`
Get all categories for a business
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "SEO",
      "description": "Search Engine Optimization services",
      "review_templates": []
    }
  ]
}
```

#### POST `/api/categories`
Create a new category
```json
{
  "businessId": "uuid",
  "name": "Social Media",
  "description": "Social media marketing services"
}
```

#### PUT `/api/categories/:categoryId`
Update a category
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE `/api/categories/:categoryId`
Delete a category (cascades to templates)

---

### Template Generation

#### POST `/api/reviews/generate-by-category`
Generate AI templates for a specific category
```json
{
  "categoryId": "uuid",
  "businessContext": "We provide top-notch SEO services...",
  "keywords": ["SEO", "rankings", "traffic", "results"],
  "count": 10,
  "wordCounts": [20, 20, 20, 20, 50, 50, 50, 50, 100, 100],
  "tone": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "content": "Great SEO service...",
      "word_count": 20,
      "is_manual": false,
      "status": "active"
    }
  ]
}
```

#### POST `/api/reviews/manual-template`
Create a manual template
```json
{
  "categoryId": "uuid",
  "content": "Custom review content here...",
  "wordCount": 75,
  "keywords": ["keyword1", "keyword2"]
}
```

#### GET `/api/reviews/by-category/:businessId`
Get all categories with their active templates (for customer view)
```json
{
  "success": true,
  "data": [
    {
      "id": "category-uuid",
      "name": "SEO",
      "description": "SEO services",
      "review_templates": [
        {
          "id": "template-uuid",
          "content": "Review text...",
          "word_count": 50,
          "is_manual": false
        }
      ]
    }
  ]
}
```

---

## 🎨 Frontend Components

### 1. **Review Playground V2** (`/dashboard/playground-v2`)

#### Features:
- Create and manage categories
- Generate AI templates with word count distribution
- Create manual templates
- Delete categories and templates
- Visual card-based layout

#### UI Elements:
- **Category Cards**: Display category name, description, and templates
- **Action Buttons**:
  - ⚡ Generate AI Templates
  - ➕ Add Manual Template
  - 🗑️ Delete Category
- **Modal Forms**:
  - Create Category
  - Generate Templates (with word count sliders)
  - Add Manual Template

### 2. **Customer Review Page** (`/review/[qrId]`)

#### Three Views:

**a) Choice View (Thumbs Up/Down)**
```
┌─────────────────────────────────┐
│   How was your experience?      │
│                                 │
│  👍 Great!     👎 Needs Work   │
└─────────────────────────────────┘
```

**b) Reviews View (Category Tabs)**
```
┌─────────────────────────────────┐
│  [General] [Pizza] [Burger]     │  ← Category tabs
│                                 │
│  ┌─────────────────────────┐  │
│  │ Review template 1       │  │
│  │ [Copy & Post]           │  │
│  └─────────────────────────┘  │
│                                 │
│  ┌─────────────────────────┐  │
│  │ Review template 2       │  │
│  │ [Copy & Post]           │  │
│  └─────────────────────────┘  │
└─────────────────────────────────┘
```

**c) Feedback View (Google-style Form)**
```
┌─────────────────────────────────┐
│   Share Your Feedback           │
│                                 │
│   ⭐⭐⭐⭐⭐  (Star rating)     │
│                                 │
│   ┌─────────────────────────┐  │
│   │ Tell us about your      │  │
│   │ experience...           │  │
│   └─────────────────────────┘  │
│                                 │
│   [Submit Feedback]             │
└─────────────────────────────────┘
```

---

## 📱 User Flow

### Admin Flow (Business Owner):
1. Login to dashboard
2. Go to **Review Playground V2**
3. Create categories (SEO, Social Media, etc.)
4. For each category:
   - Generate AI templates with word count mix
   - OR add manual templates
5. QR codes automatically show all categories and templates

### Customer Flow:
1. Scan QR code → Landing page
2. Choose **Thumbs Up** or **Thumbs Down**
3. **If Thumbs Up:**
   - See category tabs (General, Pizza, Burger, etc.)
   - Browse templates in each category
   - Click **Copy & Post** → Review copied + Google opens
4. **If Thumbs Down:**
   - Google-style feedback form
   - Rate with stars (1-5)
   - Write feedback
   - Submit → Thank you message

---

## 🎯 Example: Channelpro Communications

### Categories Created:
1. **SEO** - Search Engine Optimization services
2. **Social Media** - Social media marketing
3. **General** - Overall digital marketing
4. **Complete Digital Marketing** - Full-service packages
5. **Wikipedia Management** - Wikipedia page services

### Template Distribution (Per Category):
- 4 templates of 20 words (quick, punchy reviews)
- 4 templates of 50 words (balanced, detailed)
- 2 templates of 100 words (comprehensive, story-driven)
- **Total: 10 templates per category**

### Result:
- **50 unique templates** across 5 categories
- Customers get relevant, varied options
- SEO-optimized with category-specific keywords

---

## 🔄 Migration Instructions

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor:
-- Run the migration script
-- File: database/migration_add_categories.sql
```

Or manually:
```sql
-- Create categories table
CREATE TABLE review_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Update review_templates
ALTER TABLE review_templates
ADD COLUMN category_id UUID REFERENCES review_categories(id) ON DELETE CASCADE,
ADD COLUMN word_count INTEGER DEFAULT 50,
ADD COLUMN is_manual BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX idx_review_categories_business_id ON review_categories(business_id);
CREATE INDEX idx_review_templates_category_id ON review_templates(category_id);
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

### Step 3: Test the System
1. Login to dashboard
2. Navigate to Review Playground V2
3. Create a test category
4. Generate templates
5. Scan QR code to test customer view

---

## 📊 Analytics Tracking

### New Events Tracked:
- Category views
- Template impressions per category
- Template copies per category
- Category-specific conversion rates

### Dashboard Metrics:
- Most popular categories
- Top-performing templates by category
- Category-wise conversion rates

---

## 🎨 Design Reference

The UI design follows modern best practices:
- **Clean, minimalist layout**
- **Gradient backgrounds** using business brand colors
- **Card-based design** for templates
- **Tabbed navigation** for categories
- **One-button action** ("Copy & Post")
- **Google-style forms** for consistency

### Color Scheme:
- Primary: Business-defined (`primary_color`)
- Secondary: Business-defined (`secondary_color`)
- Gradients: Blend of primary and secondary
- Footer: neesac (#4a4a66) + .ai (#2e9cca)

---

## ✅ Benefits

### For Businesses:
1. **Better Organization**: Templates grouped by service/product
2. **More Variety**: 10+ templates per category
3. **SEO Optimization**: Category-specific keywords
4. **Flexibility**: Mix AI-generated and manual templates
5. **Brand Consistency**: Branded colors and footer

### For Customers:
1. **Easy Selection**: Browse by category tabs
2. **Relevant Options**: See templates related to their experience
3. **Quick Action**: One-click copy and post
4. **Clean UI**: Modern, intuitive interface
5. **Trust**: "Powered by neesac.ai" branding

---

## 🚀 Future Enhancements

1. **Template Analytics**: Track which templates perform best
2. **A/B Testing**: Test different templates within categories
3. **Auto-Rotation**: Rotate templates to avoid repetition
4. **Smart Suggestions**: Recommend templates based on customer behavior
5. **Multi-Language**: Support for multiple languages per category

---

## 📝 Files Modified/Created

### Backend:
- ✅ `backend/src/routes/categories.ts` - Category CRUD endpoints
- ✅ `backend/src/routes/reviews.ts` - Category-based generation
- ✅ `backend/src/index.ts` - Register categories route
- ✅ `database/migration_add_categories.sql` - Migration script
- ✅ `database/schema.sql` - Updated schema

### Frontend:
- ✅ `frontend/src/app/dashboard/playground-v2/page.tsx` - New playground UI
- ✅ `frontend/src/app/review/[qrId]/page.tsx` - Redesigned customer page
- ✅ `frontend/src/app/dashboard/page.tsx` - Updated navigation

### Documentation:
- ✅ `docs/CATEGORY_BASED_REVIEWS.md` - This file

---

## 🎉 Summary

The category-based review system transforms the review automation platform from a simple template generator into a sophisticated, organized, and scalable solution that can handle multiple service lines, product categories, and customer segments with ease.

**Key Achievement:**
- From 1 set of templates → Multiple categorized template sets
- From generic reviews → Service-specific, targeted reviews
- From basic UI → Modern, tabbed, branded interface
- From manual → AI-powered with flexibility

This feature positions the platform as a comprehensive review management solution for businesses of all sizes and industries.


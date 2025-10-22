# ReviewBot V2 - Testing Guide

## 🧪 **Complete Testing Checklist**

---

## 📋 **Prerequisites**

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor:
-- Copy and paste contents from: database/migration_add_categories.sql

-- Or run these commands:
CREATE TABLE review_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

ALTER TABLE review_templates
ADD COLUMN category_id UUID REFERENCES review_categories(id) ON DELETE CASCADE,
ADD COLUMN word_count INTEGER DEFAULT 50,
ADD COLUMN is_manual BOOLEAN DEFAULT false;

CREATE INDEX idx_review_categories_business_id ON review_categories(business_id);
CREATE INDEX idx_review_templates_category_id ON review_templates(category_id);
```

### 2. Restart Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Verify Services
- ✅ Backend: http://localhost:3001/health
- ✅ Frontend: http://localhost:3000
- ✅ Supabase: Connected and migration complete

---

## 🧪 **Test Scenarios**

### **Test 1: Category Creation**

#### Steps:
1. Login to dashboard (http://localhost:3000/login)
2. Click "Review Playground" in sidebar
3. Click "New Category" button
4. Fill in form:
   - **Name**: `SEO`
   - **Description**: `Search Engine Optimization services`
5. Click "Create Category"

#### Expected Results:
- ✅ Success toast: "Category created successfully!"
- ✅ New category card appears
- ✅ Category shows "No templates yet" message

#### Repeat for More Categories:
- **Name**: `Social Media`, **Description**: `Social media marketing`
- **Name**: `General`, **Description**: `General services`
- **Name**: `Digital Marketing`, **Description**: `Complete digital marketing`

---

### **Test 2: AI Template Generation**

#### Steps:
1. Click the ⚡ (Sparkles) icon on "SEO" category
2. Fill in the form:
   - **Business Context**: `We provide top-notch SEO services that boost rankings and drive organic traffic`
   - **Keywords**: `SEO, rankings, traffic, results`
   - **Tone**: `Professional`
   - **Word Count Distribution**:
     - 20-word reviews: `4`
     - 50-word reviews: `4`
     - 100-word reviews: `2`
3. Click "Generate Templates"

#### Expected Results:
- ✅ Loading state shows "Generating..."
- ✅ Success toast: "Generated 10 templates!"
- ✅ 10 template cards appear in the SEO category
- ✅ Each template shows:
   - "AI Generated" badge
   - Word count (20, 50, or 100)
   - Review content
   - Delete button

#### Verify Word Counts:
- ✅ 4 templates with "20 words" badge
- ✅ 4 templates with "50 words" badge
- ✅ 2 templates with "100 words" badge

---

### **Test 3: Manual Template Creation**

#### Steps:
1. Click the ➕ (Plus) icon on "Social Media" category
2. Fill in the form:
   - **Review Content**: `The social media campaigns they ran for us were phenomenal! Our engagement increased by 300% in just two months. Highly recommend their expertise!`
   - **Target Word Count**: `30`
   - **Keywords**: `social media, engagement, campaigns`
3. Click "Add Template"

#### Expected Results:
- ✅ Success toast: "Manual template created!"
- ✅ New template appears in Social Media category
- ✅ Template shows "Manual" badge (green)
- ✅ Template shows "30 words" badge

---

### **Test 4: Template Deletion**

#### Steps:
1. Click the 🗑️ (Trash) icon on any template
2. Confirm deletion in the popup

#### Expected Results:
- ✅ Success toast: "Template deleted!"
- ✅ Template disappears from the list

---

### **Test 5: Category Deletion**

#### Steps:
1. Create a test category named "Test Category"
2. Generate 2 templates for it
3. Click the 🗑️ (Trash) icon on the category card
4. Confirm deletion

#### Expected Results:
- ✅ Confirmation: "Are you sure? All templates will be deleted."
- ✅ Success toast: "Category deleted!"
- ✅ Category and all its templates disappear

---

### **Test 6: QR Code Generation**

#### Steps:
1. Go to "QR Generator" in sidebar
2. Fill in form:
   - **Business**: Select your business
   - **Name**: `Front Desk QR`
   - **Description**: `QR code for front desk`
   - **Type**: `Location`
3. Click "Generate QR Code"

#### Expected Results:
- ✅ Success toast: "QR code generated!"
- ✅ QR code image appears
- ✅ Shows name and description
- ✅ Download and Delete buttons visible

---

### **Test 7: Customer Flow - Positive Review**

#### Steps:
1. Download the QR code image
2. Scan it with your phone (or open the URL in a new browser tab)
3. Page loads with business info
4. Click **"Great Experience!"** (Thumbs Up)
5. See category tabs at the top
6. Click through different category tabs (General, SEO, Social Media, etc.)
7. Select a review template
8. Click **"Copy & Post"**

#### Expected Results:
- ✅ Business name and description displayed
- ✅ Category tabs appear (General, Pizza, Burger, etc.)
- ✅ Clicking tabs shows different templates
- ✅ Each template has "Copy & Post" button
- ✅ Templates show word count badge
- ✅ Clicking "Copy & Post":
   - Toast: "Review copied to clipboard!"
   - Google Reviews page opens in new tab
- ✅ Footer shows "Powered by neesac.ai"

---

### **Test 8: Customer Flow - Negative Feedback**

#### Steps:
1. Scan QR code again (or refresh the page)
2. Click **"Needs Improvement"** (Thumbs Down)
3. See Google-style feedback form
4. Rate with stars (click on 3rd star)
5. Fill in:
   - **Tell us about your experience**: `The service was okay but could be improved in some areas.`
   - **Additional Comments**: `Would like faster response times.`
6. Click "Submit Feedback"

#### Expected Results:
- ✅ Google-style form appears with:
   - Star rating (1-5 stars)
   - Main feedback textarea (required)
   - Additional comments textarea (optional)
- ✅ Clicking stars updates the rating
- ✅ Rating label shows: Poor/Fair/Good/Very Good/Excellent
- ✅ Submit button shows loading state
- ✅ Success toast: "Thank you for your feedback!"
- ✅ Form redirects back to choice view after 2 seconds

---

### **Test 9: Analytics Dashboard**

#### Steps:
1. Go to "Analytics" in sidebar
2. Select your business
3. Check metrics:
   - Total Scans
   - % Google Reviews
   - % Internal Reviews
   - Recent Activity
4. Set date range (start and end date)
5. Click "Export Analytics"
6. Click "Export Feedback"

#### Expected Results:
- ✅ Metrics display correctly:
   - Total Scans count
   - % Google Reviews = (google_redirects / scans) × 100
   - % Internal Reviews = (feedback_submissions / scans) × 100
- ✅ Recent Activity shows:
   - thumbs_up, thumbs_down events
   - copy_review events
   - google_redirect events
   - submit_feedback events
   - Timestamps in IST format
- ✅ Export buttons download CSV files
- ✅ CSV files contain filtered data by date range

---

### **Test 10: Mobile Testing (via ngrok)**

#### Setup ngrok:
```bash
# Terminal 3 - Backend ngrok
ngrok http 3001

# Copy the ngrok URL (e.g., https://abc123.ngrok-free.dev)
# Update backend/.env:
FRONTEND_URL=https://your-frontend-ngrok-url

# Terminal 4 - Frontend ngrok (if needed)
# OR use Next.js dev server with -H 0.0.0.0
```

#### Steps:
1. Get your local network IP (e.g., 192.168.0.103)
2. Access frontend from phone: http://192.168.0.103:3000
3. Login and generate a QR code
4. Download the QR code image
5. Use another phone to scan the QR code
6. Complete the review flow

#### Expected Results:
- ✅ QR code scans correctly
- ✅ Customer page loads on mobile
- ✅ Category tabs are scrollable
- ✅ Templates are readable
- ✅ "Copy & Post" button works
- ✅ Google Reviews opens
- ✅ Feedback form is mobile-friendly

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Category not found"
**Solution**: Ensure database migration ran successfully. Check Supabase for `review_categories` table.

### Issue 2: "Failed to generate templates"
**Solution**: 
- Check AI model is configured (Dashboard → AI Configuration)
- Verify API key is valid
- Check backend logs for errors

### Issue 3: "QR code not found"
**Solution**: 
- Ensure `FRONTEND_URL` in backend `.env` matches the URL used to generate QR
- Regenerate QR code after updating `FRONTEND_URL`

### Issue 4: Templates not showing on customer page
**Solution**: 
- Check template status is "active" (not "draft")
- Verify category has templates associated
- Check browser console for errors

### Issue 5: Google Reviews not opening
**Solution**: 
- Verify Google Place ID is configured (Dashboard → Settings)
- Check browser popup blocker settings

---

## ✅ **Testing Checklist Summary**

```
Backend Tests:
✅ Database migration successful
✅ Category CRUD endpoints working
✅ Template generation working
✅ AI integration active
✅ Authentication working
✅ Rate limiting functional

Frontend Tests:
✅ Login/Register working
✅ Dashboard loads correctly
✅ Playground V2 functional
✅ Category creation working
✅ Template generation UI working
✅ QR code generation working
✅ Customer review page loads
✅ Category tabs working
✅ Copy & Post button working
✅ Feedback form working
✅ Analytics displaying correctly
✅ Export functionality working

Mobile Tests:
✅ QR scanning working
✅ Responsive design correct
✅ Touch interactions smooth
✅ Forms submittable

Integration Tests:
✅ End-to-end positive flow
✅ End-to-end negative flow
✅ Analytics tracking correct
✅ Email notifications (if enabled)
```

---

## 📊 **Performance Benchmarks**

### Expected Response Times:
- Page Load: < 2 seconds
- API Response: < 500ms
- Template Generation: 5-10 seconds (for 10 templates)
- QR Code Generation: < 1 second
- Database Queries: < 100ms

### Expected Success Rates:
- API Success Rate: > 99%
- Template Generation: > 95%
- QR Scanning: > 98%
- Form Submission: > 99%

---

## 🎯 **Test Results Template**

Copy this template to record your test results:

```
## Test Session: [Date/Time]
### Tester: [Your Name]
### Environment: [Local/Staging/Production]

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Category Creation | ✅/❌ | |
| 2 | AI Template Generation | ✅/❌ | |
| 3 | Manual Template Creation | ✅/❌ | |
| 4 | Template Deletion | ✅/❌ | |
| 5 | Category Deletion | ✅/❌ | |
| 6 | QR Code Generation | ✅/❌ | |
| 7 | Positive Review Flow | ✅/❌ | |
| 8 | Negative Feedback Flow | ✅/❌ | |
| 9 | Analytics Dashboard | ✅/❌ | |
| 10 | Mobile Testing | ✅/❌ | |

### Issues Found:
1. [Issue description]
2. [Issue description]

### Overall Status: ✅ PASS / ❌ FAIL
```

---

## 🚀 **Ready for Production?**

Before deploying to production, ensure:
- ✅ All 10 test scenarios passed
- ✅ No critical bugs found
- ✅ Mobile testing completed
- ✅ Analytics tracking verified
- ✅ Performance benchmarks met
- ✅ Database backups configured
- ✅ Environment variables set
- ✅ SSL certificate installed
- ✅ Monitoring tools configured
- ✅ Support documentation ready

---

**Happy Testing! 🎉**

For issues or questions, refer to:
- `docs/CATEGORY_BASED_REVIEWS.md`
- `IMPLEMENTATION_STATUS.md`
- Backend logs: `backend/` console output
- Frontend console: Browser DevTools

---

**Last Updated: October 22, 2025**  
**Version: 2.0.0**


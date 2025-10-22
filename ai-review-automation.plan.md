# AI Review Automation Platform

## Architecture Overview

**Frontend**: React/Next.js with responsive design

**Backend**: Node.js/Express with TypeScript

**Database**: Supabase (PostgreSQL with built-in auth and real-time features)

**AI**: Multi-model support - Groq, OpenRouter, Gemini, OpenAI, Claude (configurable per client)

**Hosting**: Hostinger VPS (full-stack deployment with Nginx, PM2) + Supabase (database + auth)

## Design System

**Brand Identity:**
- Application Name: **ReviewBot**
- Logo: "neesac" in `#4a4a66`, ".ai" in `#2e9cca`

**Color Palette:**
- Primary Blue: `#2e9cca`
- Dark Gray/Purple: `#4a4a66`
- Heading Text: `#1f2937`
- Paragraph Text: `#6b7280`
- Body Background: `#f8fafc`
- Header Gradient: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`

**Component Styles:**
- Buttons: `background: #2e9cca; color: white; border: 1px solid #2e9cca; border-radius: 0.375rem;`
- Cards: White background, rounded corners, subtle shadow
- Input Fields: White background, light gray borders
- Success Actions: Green buttons (`#10b981`)
- Warning Actions: Orange buttons (`#f97316`)
- Neutral Actions: Gray buttons (`#6b7280`)

---

## Core Features & Implementation

### 1. Database Schema

**Tables**:
- `clients` - Business clients using the platform
- `businesses` - Individual business locations (multi-location support)
- `review_templates` - AI-generated approved reviews per business
- `qr_codes` - Generated QR codes (types: business-wide, location-specific, transaction-specific)
- `feedback` - Customer feedback submissions
- `analytics` - Tracking metrics (scans, conversions, ratings)

**Key Fields**:
- `qr_codes.type`: 'business' | 'location' | 'transaction'
- `qr_codes.metadata`: JSON field for transaction IDs, location IDs, etc.
- `review_templates.seo_keywords`: Array of keywords used for generation
- `review_templates.status`: 'draft' | 'approved' | 'active'

### 2. Customer-Facing Flow

#### QR Code Scan → Landing Page
- Route: `/review/:qrCodeId`
- Fetch business info and branding from QR code ID
- Display business logo, name, and simple UI
- Two large buttons: 👍 Thumbs Up | 👎 Thumbs Down

#### Positive Review Path (Thumbs Up)
1. Click thumbs up → Show modal/overlay
2. Modal displays:
   - Pre-selected 5-star rating (editable)
   - AI-generated review text (randomly selected from approved templates)
   - "Copy Review" button (copies to clipboard with visual confirmation)
   - "Edit Review" option (allows minor customization)
   - "Open Google Reviews" button
3. On "Open Google Reviews":
   - Open Google review URL in new tab: `https://search.google.com/local/writereview?placeid={PLACE_ID}`
   - Show instructions overlay: "Paste your review and submit!"
4. Track conversion in analytics

#### Negative Review Path (Thumbs Down)
1. Click thumbs down → Redirect to internal portal page
2. Portal displays:
   - Star rating selector (3 stars pre-filled)
   - AI-generated constructive feedback template
   - Text area for additional comments
   - Submit button
3. Store feedback in database
4. Email notification to business owner
5. Thank you page with "We'll improve!" message

### 3. Admin Dashboard (Client Portal)

#### Authentication
- Email/password login (JWT tokens)
- Role-based access: Super Admin, Business Owner, Manager
- Multi-business support per account

#### Dashboard Sections

**A. Review Playground** (AI Review Generator)
- Form inputs:
  - Business context/description
  - SEO keywords (comma-separated)
  - Number of reviews to generate (1-20)
  - Tone selector: Professional, Casual, Enthusiastic
  - Review length: Short (50-100 words), Medium (100-150), Long (150-200)
- "Generate Reviews" button → API call to AI model
- Display generated reviews in cards
- Each card has:
  - Review text
  - SEO score indicator
  - Keyword density visualization
  - Approve/Reject/Edit buttons
- Approved reviews → Move to Active Templates

**B. Review Management**
- List all review templates (tabs: Active, Draft, Archived)
- Bulk actions: Activate, Deactivate, Delete
- Analytics per template: Times shown, times copied, conversion rate

**C. QR Code Generator**
- Select QR type: Business-wide, Location-specific, Transaction-based
- Customization: Logo overlay, color scheme, size
- Generate & download QR code (PNG, SVG)
- Bulk generation for transactions (CSV upload)
- QR analytics: Scans, conversion rate, rating distribution

**D. Feedback Dashboard**
- View negative feedback submissions
- Filter by date, location, rating
- Response management (mark as resolved, add internal notes)
- Export to CSV

**E. Analytics & Reporting**
- Metrics:
  - Total scans vs conversions
  - Positive vs negative split
  - Average ratings (Google path vs Internal)
  - Peak engagement times
  - Location-wise performance
- Charts: Line graphs, pie charts, heatmaps
- Date range selector

**F. Business Settings**
- Google Place ID configuration
- Business branding: Logo, colors, fonts
- Email notification preferences
- Custom thank you messages
- Multi-location management

### 4. AI Review Generation System

#### Backend API Endpoint: `/api/reviews/generate`

**Input**:
```json
{
  "businessContext": "Italian restaurant, family-owned, pasta specialty",
  "keywords": ["authentic pasta", "family atmosphere", "homemade sauce"],
  "count": 10,
  "tone": "enthusiastic",
  "length": "medium"
}
```

**AI Prompt Engineering**:
```
You are an expert review writer. Generate {count} authentic Google reviews for:
Business: {businessContext}
Keywords to include naturally: {keywords}
Tone: {tone}
Length: {length} words

Requirements:
- SEO optimized with keywords naturally integrated
- Authentic, human-like language (avoid generic phrases)
- Specific details that show genuine experience
- Vary sentence structure and vocabulary
- Include emotional connection
- 5-star worthy content

Format: JSON array of review objects with "text" and "keywords_used" fields.
```

**Post-Processing**:
- SEO scoring algorithm (keyword density, readability, uniqueness)
- Duplicate detection (compare against existing templates)
- Character count validation (Google limit: 4096 chars)
- Sentiment analysis (ensure positive tone)

### 5. Technical Implementation Details

#### Frontend Components
```
/components
  /customer
    - QRLanding.tsx (main scan page)
    - ThumbsSelector.tsx
    - ReviewModal.tsx (positive path)
    - FeedbackForm.tsx (negative path)
  /admin
    - ReviewPlayground.tsx
    - QRGenerator.tsx
    - AnalyticsDashboard.tsx
    - TemplateManager.tsx
  /shared
    - StarRating.tsx
    - CopyButton.tsx
    - BrandingWrapper.tsx
```

#### Backend API Routes
```
/api/auth
  POST /login
  POST /register
  POST /refresh-token

/api/reviews
  POST /generate (AI generation)
  GET /templates/:businessId
  POST /templates (save/approve)
  PUT /templates/:id
  DELETE /templates/:id

/api/qr
  POST /generate
  GET /:qrCodeId (fetch business info)
  GET /analytics/:qrCodeId

/api/feedback
  POST /submit
  GET /list/:businessId
  PUT /:id/resolve

/api/analytics
  GET /dashboard/:businessId
  GET /export/:businessId
```

#### Database Indexes
- `qr_codes.code` (unique, for fast lookups)
- `feedback.business_id, created_at` (for dashboard queries)
- `review_templates.business_id, status` (active template filtering)

### 6. SEO Optimization Strategy

**Review Generation Focuses On**:
1. **Keyword Integration**: Natural placement of target keywords (2-3% density)
2. **Local SEO**: Include location mentions, neighborhood references
3. **Long-tail Keywords**: Specific phrases users search for
4. **Semantic Variations**: Synonyms and related terms
5. **User Intent Matching**: Address common customer questions
6. **Readability**: Flesch reading ease score > 60

**SEO Scoring Algorithm**:
- Keyword presence: 30 points
- Keyword density (optimal 2-3%): 20 points
- Length optimization (100-150 words): 15 points
- Readability score: 20 points
- Unique content (vs templates): 15 points
- Total: /100 points

### 7. Security & Compliance

- **Rate Limiting**: Prevent QR code abuse (max 5 submissions/IP/day)
- **CAPTCHA**: For negative reviews to prevent spam
- **Data Privacy**: GDPR-compliant (optional customer email, data deletion)
- **Input Sanitization**: Prevent XSS attacks on user inputs
- **Google ToS Compliance**: Clearly state reviews are user-generated with AI suggestions

### 8. Deployment & Environment

**Environment Variables**:
```
DATABASE_URL
OPENAI_API_KEY / ANTHROPIC_API_KEY
JWT_SECRET
SMTP_HOST, SMTP_USER, SMTP_PASS (for notifications)
FRONTEND_URL
GOOGLE_ANALYTICS_ID
```

**Deployment Steps**:
1. Set up PostgreSQL database (Railway/Supabase)
2. Deploy backend API (Railway/Render with auto-scaling)
3. Deploy frontend (Vercel with preview deployments)
4. Configure custom domain + SSL
5. Set up monitoring (Sentry for errors, analytics)

### 9. Future Enhancements

- WhatsApp/SMS notifications for feedback
- Multi-language support
- A/B testing for review templates
- Integration with other review platforms (Yelp, TripAdvisor)
- AI-powered response suggestions for negative feedback
- Voice-to-text review generation
- NFC tag support alongside QR codes

---

## File Structure

```
/frontend
  /src
    /pages
      - index.tsx (landing)
      - review/[qrId].tsx (customer flow)
      - admin/dashboard.tsx
      - admin/playground.tsx
      - admin/qr-generator.tsx
    /components (as outlined above)
    /lib
      - api.ts (axios client)
      - auth.ts
    /styles (using Tailwind CSS)

/backend
  /src
    /routes (API endpoints)
    /controllers (business logic)
    /models (database models)
    /services
      - aiService.ts (AI review generation)
      - qrService.ts (QR code generation)
      - seoService.ts (SEO scoring)
    /middleware (auth, validation)
    /utils
  /prisma or /migrations (database schema)

/shared
  - types.ts (TypeScript interfaces shared between FE/BE)
```

---

## Development Phases

**Phase 1 - Foundation** (Week 1-2)
- Database schema & setup
- Authentication system
- Basic frontend scaffold with routing

**Phase 2 - Customer Flow** (Week 2-3)
- QR landing page implementation
- Thumbs up/down logic
- Google review modal with copy functionality
- Internal feedback form

**Phase 3 - AI Integration** (Week 3-4)
- AI review generation API
- SEO optimization algorithm
- Review playground UI
- Template management

**Phase 4 - Admin Features** (Week 4-5)
- QR code generator
- Analytics dashboard
- Feedback management
- Business settings

**Phase 5 - Polish & Deploy** (Week 5-6)
- Branding customization
- Mobile responsiveness
- Testing & bug fixes
- Production deployment
- Documentation

---

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand (state), React Query
- **Backend**: Node.js + Express + TypeScript OR Python + FastAPI
- **Database**: PostgreSQL + Prisma ORM (Node) or SQLAlchemy (Python)
- **AI**: OpenAI GPT-4 API or Anthropic Claude API
- **QR Generation**: `qrcode` library with custom branding
- **Authentication**: JWT + bcrypt
- **Email**: SendGrid or Resend
- **Deployment**: Vercel + Railway/Render

### To-dos

- [x] Initialize project structure with Next.js frontend and Node.js/Python backend, configure TypeScript, set up monorepo structure
- [x] Design and implement PostgreSQL database schema (clients, businesses, review_templates, qr_codes, feedback, analytics tables)
- [x] Implement authentication system with JWT, login/register endpoints, role-based access control
- [x] Build customer-facing QR landing page with thumbs up/down selection, review modal with copy functionality, internal feedback form
- [x] Integrate AI API (OpenAI/Claude) for review generation, implement SEO scoring algorithm, create review generation service
- [x] Build admin review playground UI for keyword input, AI generation, template approval workflow
- [ ] Implement QR code generation system with three types (business/location/transaction), branding customization, bulk generation
- [ ] Build analytics dashboard with metrics, charts, feedback management, export functionality
- [ ] Implement business settings for branding customization (logo, colors), Google Place ID configuration, email preferences
- [ ] Deploy frontend to Vercel, backend to Railway/Render, configure environment variables, set up domain and SSL

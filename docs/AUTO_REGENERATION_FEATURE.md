# Auto-Regeneration Feature Documentation

## Overview
The auto-regeneration feature ensures that customers always have fresh, unique review templates available while maintaining a constant number of templates (default: 10) per category.

## How It Works

### 1. Template Usage Tracking
- When a customer clicks "Copy & Post" on any review template, the system tracks this action
- The used template is immediately deleted from the database
- This prevents the same review from being posted multiple times

### 2. Auto-Regeneration Process
- As soon as a template is deleted, the auto-regeneration process kicks in
- The system generates a new unique review template for the same category
- The new template uses the same word count and category context
- The total number of templates remains constant (always 10 per category)

### 3. AI-Powered Generation
- Uses the business's configured AI model and API keys
- Generates content based on the category's keywords and business context
- Creates unique variations to avoid duplicate content
- Maintains the same word count as the deleted template

## Technical Implementation

### Backend Components

#### 1. Template Auto-Regeneration Service
**File**: `backend/src/services/templateAutoRegenerationService.ts`

**Key Methods**:
- `deleteAndRegenerateTemplate()` - Handles deletion and regeneration
- `checkAndRegenerateIfNeeded()` - Ensures category has enough templates
- `regenerateTemplatesForCategory()` - Generates multiple templates

#### 2. QR Tracking Endpoint
**File**: `backend/src/routes/qr.ts`

**Updated Features**:
- Accepts `templateId` parameter in copy_review events
- Automatically deletes used templates
- Triggers auto-regeneration process
- Maintains analytics tracking

#### 3. AI Service Integration
- Uses existing AI service for content generation
- Supports all configured AI providers (OpenAI, Anthropic, Groq, Google)
- Maintains business context and category-specific keywords

### Frontend Components

#### 1. Copy & Post Handler
**File**: `frontend/src/app/review/[qrId]/page.tsx`

**Updated Features**:
- Passes `templateId` when tracking copy events
- Refreshes categories after successful copy
- Includes delay to allow auto-regeneration to complete

#### 2. Template Display
- Templates are refreshed automatically after use
- New templates appear seamlessly
- No interruption to user experience

## Database Schema

### Analytics Table
```sql
-- Tracks template usage with templateId
metadata: {
  templateId: "uuid",
  timestamp: "ISO string"
}
```

### Review Templates Table
- Templates are deleted when used
- New templates are generated with same structure
- Maintains category relationships

## Configuration

### AI Model Requirements
- Business must have active AI configuration
- API keys must be valid and accessible
- Model must support text generation

### Category Setup
- Categories must have keywords and descriptions
- Business context must be available
- Word count distribution should be configured

## Benefits

### 1. Content Freshness
- Customers always see new, unique reviews
- Prevents duplicate content across multiple customers
- Maintains authenticity and credibility

### 2. Constant Availability
- Always maintains 10 templates per category
- No empty categories or missing content
- Seamless user experience

### 3. AI-Powered Quality
- Uses business-specific context
- Maintains category relevance
- Generates professional content

### 4. Analytics Tracking
- Tracks which templates are used
- Monitors auto-regeneration success
- Provides insights into popular content

## Error Handling

### 1. AI Generation Failures
- Logs errors but doesn't fail main request
- Continues with existing templates
- Retries regeneration in background

### 2. Database Issues
- Graceful degradation if deletion fails
- Continues with existing template count
- Logs issues for monitoring

### 3. Network Problems
- Frontend handles refresh failures
- Continues with current template set
- User experience remains smooth

## Monitoring

### 1. Console Logging
- Tracks template deletion events
- Monitors auto-regeneration success
- Logs AI generation requests

### 2. Analytics
- Tracks template usage patterns
- Monitors regeneration frequency
- Provides business insights

### 3. Error Tracking
- Logs failed regenerations
- Tracks AI service issues
- Monitors database operations

## Usage Flow

### 1. Customer Experience
1. Customer scans QR code
2. Clicks "Great Experience!"
3. Sees available review templates
4. Clicks "Copy & Post" on preferred template
5. Template is copied and deleted
6. New template is auto-generated
7. Customer sees updated template list

### 2. System Process
1. Track copy_review event with templateId
2. Delete used template from database
3. Trigger auto-regeneration service
4. Generate new template with AI
5. Save new template to database
6. Refresh frontend template list

## Configuration Options

### Template Count
- Default: 10 templates per category
- Configurable per business
- Maintained automatically

### Word Count Distribution
- Maintains original word count of deleted template
- Supports various word count ranges
- AI generates appropriate length content

### AI Model Selection
- Uses business-configured AI model
- Supports multiple providers
- Maintains consistency across regenerations

## Future Enhancements

### 1. Smart Regeneration
- Analyze popular template patterns
- Generate similar high-performing content
- Optimize for conversion rates

### 2. A/B Testing
- Test different template variations
- Track performance metrics
- Optimize content strategy

### 3. Content Analytics
- Monitor template usage patterns
- Identify most effective content
- Provide business insights

---

**This feature ensures that your review system always provides fresh, unique content while maintaining a professional and seamless customer experience.**


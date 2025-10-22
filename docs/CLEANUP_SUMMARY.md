# Database Cleanup Summary

## Changes Made

### 1. **Fixed TypeScript Type Error**
- **File**: `shared/types.ts`
- **Change**: Added `model?: string` to `AIGenerationRequest` interface
- **Reason**: Backend needs to pass the specific model name (e.g., `llama-3.3-70b-versatile`) from the database to the AI service

### 2. **Updated Review Generation Route**
- **File**: `backend/src/routes/reviews.ts`
- **Change**: Now passes both `aiModel` (provider) and `model` (specific model name) to AI service
- **Example**:
  ```typescript
  const request: AIGenerationRequest = {
    // ... other fields
    aiModel: aiConfig.provider,  // 'groq', 'openai', etc.
    model: aiConfig.model         // 'llama-3.3-70b-versatile', 'gpt-4', etc.
  };
  ```

### 3. **Removed Unused `ai_models` Table**

#### **Why Remove It?**
- Initially created with hardcoded AI models
- We switched to **dynamic model fetching** from providers (OpenAI, Anthropic, Groq, Google)
- The `ai_model_configs` table is sufficient for storing per-business configurations
- Keeping both tables would cause confusion about which is the source of truth

#### **Migration Created**
- **File**: `database/migration_drop_ai_models_table.sql`
- **Action**: Drops the `ai_models` table

#### **Schema Updated**
- **File**: `database/schema.sql`
- Removed `CREATE TABLE ai_models` definition
- Removed `INSERT INTO ai_models` seed data
- Added comments explaining the change

---

## Tables Overview

### **Remaining AI-Related Tables**

| Table | Purpose | Example Data |
|-------|---------|--------------|
| `ai_model_configs` | Stores per-business AI configurations | `{ business_id, provider: 'groq', model: 'llama-3.3-70b-versatile', api_key: '***', is_active: true }` |

### **Removed Tables**

| Table | Original Purpose | Why Removed |
|-------|------------------|-------------|
| `ai_models` | Listed available AI models with static data | Replaced by dynamic fetching from provider APIs |

---

## How It Works Now

### **1. AI Configuration (Per Business)**
```
Frontend (AI Config Page)
  ↓
Select Provider (Groq, OpenAI, etc.)
  ↓
Fetch Available Models (Real-time API call to provider)
  ↓
User selects model & enters API key
  ↓
Save to `ai_model_configs` table
```

### **2. Review Generation**
```
Frontend (Review Playground)
  ↓
Request to generate reviews
  ↓
Backend fetches active config from `ai_model_configs`
  ↓
Pass provider + model to AI service
  ↓
AI service uses correct provider API with correct model
  ↓
Generate reviews
```

---

## Migration Instructions

### **To Apply the Migration:**

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Run the migration**:
   ```sql
   -- Copy contents from: database/migration_drop_ai_models_table.sql
   DROP TABLE IF EXISTS ai_models CASCADE;
   ```

3. **Verify**:
   ```sql
   -- Should NOT show ai_models in the list
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### **Expected Tables After Migration:**
- ✅ `analytics`
- ✅ `businesses`
- ✅ `clients`
- ✅ `feedback`
- ✅ `qr_codes`
- ✅ `review_categories` *(new)*
- ✅ `review_templates`
- ✅ `users`
- ✅ `ai_model_configs` *(the one we keep)*
- ❌ `ai_models` *(removed)*

---

## Benefits

1. **Single Source of Truth**: Only `ai_model_configs` stores AI settings
2. **Real-time Model Support**: Always up-to-date with provider offerings
3. **Reduced Confusion**: Developers know exactly where to look for AI configs
4. **Flexibility**: Clients can use any model supported by their chosen provider
5. **No Manual Updates**: No need to manually add new models to the database

---

## Testing

After restarting the backend, test the complete flow:

1. **Configure AI** (Dashboard → AI Configuration)
   - Select provider: Groq
   - Select model: llama-3.3-70b-versatile
   - Enter API key
   - Test → Should succeed
   - Save Configuration

2. **Generate Reviews** (Dashboard → Review Playground)
   - Create category (e.g., "SEO")
   - Generate templates (e.g., 4×20, 4×50, 2×100)
   - Should generate 10 unique reviews using Groq/Llama 3.3

3. **Check Logs**:
   ```
   ✓ AI Config from database: { provider: 'groq', model: 'llama-3.3-70b-versatile' }
   ✓ Using AI Provider: groq, Model: llama-3.3-70b-versatile
   ✓ Total reviews generated: 10
   ```

---

**Last Updated**: October 22, 2025


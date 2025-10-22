# Dynamic AI Model Fetching

## Overview

The ReviewBot platform now supports **dynamic AI model fetching** from all supported providers (OpenAI, Anthropic, Groq, Google). This ensures that you always have access to the latest models without needing code updates.

## Features

### ✅ Real-Time Model Discovery
- Fetches available models directly from provider APIs
- Automatically updates when new models are released
- No code changes needed to support new models

### ✅ Intelligent Caching
- Models are cached for 1 hour to reduce API calls
- Automatic fallback to known models if API fails
- Optimized performance with minimal latency

### ✅ Provider Support

#### **OpenAI**
- Fetches all GPT models via `/v1/models` API
- Filters chat completion models automatically
- Includes: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo variants

#### **Anthropic (Claude)**
- Pre-configured with latest Claude models
- Includes: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- Context window information included

#### **Groq**
- Real-time fetching via `/openai/v1/models` API
- Includes: Llama 3.3 70B, Llama 3.1 variants, Mixtral, Gemma
- Context window and performance data

#### **Google (Gemini)**
- Fetches from Google's Generative AI API
- Includes: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- Large context windows (up to 1M tokens)

## How It Works

### Backend Architecture

```typescript
// Service: modelDiscoveryService.ts
class ModelDiscoveryService {
  // Fetch models with API key
  fetchModelsForProvider(provider, apiKey)
  
  // Get fallback models (no API key needed)
  getAllAvailableModels()
  
  // Provider-specific fetchers
  fetchOpenAIModels(apiKey)
  fetchAnthropicModels(apiKey)
  fetchGroqModels(apiKey)
  fetchGoogleModels(apiKey)
}
```

### API Endpoints

#### `POST /api/ai-config/discover`
Fetch models for a specific provider with optional API key.

**Request:**
```json
{
  "provider": "groq",
  "apiKey": "your-api-key" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "groq",
    "models": [
      {
        "id": "llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B Versatile",
        "provider": "groq",
        "context_length": 32768
      }
    ]
  }
}
```

#### `GET /api/ai-config/discover/all`
Get fallback models for all providers (no API keys required).

**Response:**
```json
{
  "success": true,
  "data": {
    "openai": [...],
    "anthropic": [...],
    "groq": [...],
    "google": [...]
  }
}
```

### Frontend Integration

The AI Configuration page automatically:

1. **Loads fallback models** on page load
2. **Fetches real-time models** when API key is entered
3. **Updates dropdown** with latest models
4. **Shows context length** for each model
5. **Handles errors gracefully** with fallback data

### User Flow

```
1. User selects provider (e.g., Groq)
   ↓
2. User enters API key
   ↓
3. On blur/tab: Frontend calls /api/ai-config/discover
   ↓
4. Backend fetches latest models from Groq API
   ↓
5. Models dropdown updates with real-time data
   ↓
6. User selects model and saves configuration
```

## Usage Example

### 1. Navigate to AI Configuration
```
Dashboard → AI Configuration
```

### 2. Select Provider
Choose from: OpenAI, Anthropic, Groq, or Google

### 3. Enter API Key
- Type your API key
- Press **Tab** or click outside the field
- System automatically fetches available models

### 4. Select Model
- Choose from dynamically loaded models
- See context length information
- Save configuration

### 5. Test Configuration
- Click "Test Configuration"
- System validates API key and model
- Get instant feedback

## Benefits

### 🚀 **Always Up-to-Date**
- No code deployments needed for new models
- Automatic access to latest AI models
- Future-proof architecture

### 🔒 **Secure**
- API keys never stored in code
- Client-specific configurations
- Encrypted storage in database

### ⚡ **Performance**
- 1-hour intelligent caching
- Minimal API calls
- Fast model selection

### 🛡️ **Resilient**
- Fallback models if API fails
- Graceful error handling
- No downtime from provider changes

## Fallback Models

If real-time fetching fails, the system uses these pre-configured models:

### OpenAI
- gpt-4-turbo
- gpt-4
- gpt-3.5-turbo
- gpt-3.5-turbo-16k

### Anthropic
- claude-3-5-sonnet-20241022
- claude-3-5-haiku-20241022
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

### Groq
- llama-3.3-70b-versatile
- llama-3.1-70b-versatile
- llama-3.1-8b-instant
- mixtral-8x7b-32768
- gemma2-9b-it

### Google
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-pro

## API Key Sources

### OpenAI
https://platform.openai.com/api-keys

### Anthropic
https://console.anthropic.com/

### Groq
https://console.groq.com/

### Google Gemini
https://makersuite.google.com/app/apikey

## Troubleshooting

### Models Not Loading?
1. **Check API key** - Ensure it's valid and has proper permissions
2. **Check network** - Verify API endpoint is accessible
3. **Check fallbacks** - System should show fallback models
4. **Check console** - Look for error messages in browser console

### Wrong Models Shown?
1. **Clear cache** - Cache duration is 1 hour
2. **Re-enter API key** - Triggers fresh fetch
3. **Refresh page** - Reloads fallback models

### Test Configuration Fails?
1. **Verify API key** - Must be valid for selected provider
2. **Check model name** - Must match provider's model ID
3. **Check rate limits** - Provider may have rate limits
4. **Check backend logs** - Review error messages

## Development

### Adding a New Provider

1. **Add provider to modelDiscoveryService.ts**
```typescript
async fetchNewProviderModels(apiKey: string): Promise<AIModelInfo[]> {
  // Implement provider-specific logic
}
```

2. **Add fallback models**
```typescript
private getNewProviderFallbackModels(): AIModelInfo[] {
  return [/* fallback models */];
}
```

3. **Update switch statement**
```typescript
case 'newprovider':
  models = await this.fetchNewProviderModels(apiKey);
  break;
```

4. **Add to frontend AI_PROVIDERS array**
```typescript
{ value: 'newprovider', label: 'New Provider' }
```

### Testing

```bash
# Test OpenAI model fetching
curl -X POST http://localhost:3001/api/ai-config/discover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","apiKey":"YOUR_OPENAI_KEY"}'

# Test fallback models
curl -X GET http://localhost:3001/api/ai-config/discover/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Future Enhancements

- [ ] Model pricing information
- [ ] Model performance benchmarks
- [ ] Model comparison tool
- [ ] Recommended model suggestions
- [ ] Usage analytics per model
- [ ] Cost tracking per model

## Summary

Dynamic model fetching ensures that ReviewBot stays current with the latest AI models from all providers without requiring code updates. The system is resilient, performant, and user-friendly, providing a seamless experience for configuring AI models.


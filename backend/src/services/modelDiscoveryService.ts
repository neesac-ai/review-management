import axios from 'axios';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
  pricing?: {
    input?: number;
    output?: number;
  };
}

class ModelDiscoveryService {
  private cache: Map<string, { models: AIModelInfo[], timestamp: number }> = new Map();
  private CACHE_DURATION = 3600000; // 1 hour in milliseconds

  /**
   * Fetch available models from OpenAI
   */
  async fetchOpenAIModels(apiKey: string): Promise<AIModelInfo[]> {
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      // Filter to only chat completion models
      const chatModels = response.data.data
        .filter((model: any) => 
          model.id.includes('gpt') && 
          !model.id.includes('instruct') &&
          !model.id.includes('search')
        )
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: 'openai'
        }))
        .sort((a: any, b: any) => b.id.localeCompare(a.id)); // Latest models first

      return chatModels;
    } catch (error: any) {
      console.error('Failed to fetch OpenAI models:', error.response?.data || error.message);
      // Return fallback models if API fails
      return this.getOpenAIFallbackModels();
    }
  }

  /**
   * Fetch available models from Anthropic
   */
  async fetchAnthropicModels(apiKey: string): Promise<AIModelInfo[]> {
    // Anthropic doesn't have a models endpoint, so we return known models
    // These are updated as of latest API documentation
    return [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)', provider: 'anthropic', context_length: 200000 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Latest)', provider: 'anthropic', context_length: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', context_length: 200000 },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', context_length: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', context_length: 200000 }
    ];
  }

  /**
   * Fetch available models from Groq
   */
  async fetchGroqModels(apiKey: string): Promise<AIModelInfo[]> {
    try {
      const response = await axios.get('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const models = response.data.data
        .filter((model: any) => model.id && !model.id.includes('whisper'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: 'groq',
          context_length: model.context_window
        }))
        .sort((a: any, b: any) => b.id.localeCompare(a.id));

      return models;
    } catch (error: any) {
      console.error('Failed to fetch Groq models:', error.response?.data || error.message);
      // Return fallback models if API fails
      return this.getGroqFallbackModels();
    }
  }

  /**
   * Fetch available models from Google (Gemini)
   */
  async fetchGoogleModels(apiKey: string): Promise<AIModelInfo[]> {
    try {
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      const models = response.data.models
        .filter((model: any) => 
          model.supportedGenerationMethods?.includes('generateContent') &&
          model.name.includes('gemini')
        )
        .map((model: any) => ({
          id: model.name.replace('models/', ''),
          name: model.displayName || model.name.replace('models/', ''),
          provider: 'google',
          context_length: model.inputTokenLimit
        }));

      return models;
    } catch (error: any) {
      console.error('Failed to fetch Google models:', error.response?.data || error.message);
      // Return fallback models if API fails
      return this.getGoogleFallbackModels();
    }
  }

  /**
   * Fetch models from any provider with caching
   */
  async fetchModelsForProvider(provider: string, apiKey: string): Promise<AIModelInfo[]> {
    // Check cache first
    const cached = this.cache.get(`${provider}-${apiKey.substring(0, 10)}`);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.models;
    }

    let models: AIModelInfo[] = [];

    switch (provider) {
      case 'openai':
        models = await this.fetchOpenAIModels(apiKey);
        break;
      case 'anthropic':
        models = await this.fetchAnthropicModels(apiKey);
        break;
      case 'groq':
        models = await this.fetchGroqModels(apiKey);
        break;
      case 'google':
        models = await this.fetchGoogleModels(apiKey);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Cache the results
    this.cache.set(`${provider}-${apiKey.substring(0, 10)}`, {
      models,
      timestamp: Date.now()
    });

    return models;
  }

  /**
   * Get all available models without API key (returns fallback models)
   */
  async getAllAvailableModels(): Promise<Record<string, AIModelInfo[]>> {
    return {
      openai: this.getOpenAIFallbackModels(),
      anthropic: await this.fetchAnthropicModels(''), // Doesn't need API key
      groq: this.getGroqFallbackModels(),
      google: this.getGoogleFallbackModels()
    };
  }

  /**
   * Fallback models for OpenAI
   */
  private getOpenAIFallbackModels(): AIModelInfo[] {
    return [
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', context_length: 128000 },
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', context_length: 8192 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', context_length: 16385 },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', provider: 'openai', context_length: 16385 }
    ];
  }

  /**
   * Fallback models for Groq
   */
  private getGroqFallbackModels(): AIModelInfo[] {
    return [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', context_length: 32768 },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', provider: 'groq', context_length: 32768 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', context_length: 8192 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', context_length: 32768 },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', provider: 'groq', context_length: 8192 }
    ];
  }

  /**
   * Fallback models for Google
   */
  private getGoogleFallbackModels(): AIModelInfo[] {
    return [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', context_length: 1000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', context_length: 1000000 },
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', context_length: 32768 }
    ];
  }

  /**
   * Clear cache for a specific provider
   */
  clearCache(provider?: string) {
    if (provider) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(provider));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}

export default new ModelDiscoveryService();


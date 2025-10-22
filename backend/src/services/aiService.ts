import axios from 'axios';
import { AIGenerationRequest, AIGenerationResponse } from '../../../shared/types';

interface AIModel {
  name: string;
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
}

class AIService {
  private models: Record<string, AIModel> = {
    openai: {
      name: 'GPT-4',
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY!,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4'
    },
    anthropic: {
      name: 'Claude-3',
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY!,
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-sonnet-20240229'
    },
    groq: {
      name: 'Llama 2',
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY!,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama2-70b-4096'
    },
    gemini: {
      name: 'Gemini Pro',
      provider: 'google',
      apiKey: process.env.GEMINI_API_KEY!,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      model: 'gemini-pro'
    }
  };

  async generateReviews(request: any): Promise<AIGenerationResponse> {
    const modelKey = request.aiModel || 'openai';
    const aiModel = this.models[modelKey];

    if (!aiModel) {
      throw new Error(`AI model ${modelKey} not supported`);
    }

    // Check if API key is available (either from env or will be set by caller)
    const apiKey = aiModel.apiKey || process.env[`${modelKey.toUpperCase()}_API_KEY`];
    if (!apiKey) {
      throw new Error(`API key missing for ${modelKey}. Please configure an AI model.`);
    }

    // Update the model with the API key from environment (set by the route)
    aiModel.apiKey = apiKey;

    // If a custom model is specified in the request, use it
    if (request.model) {
      aiModel.model = request.model;
    }

    const prompt = this.buildPrompt(request);

    try {
      switch (aiModel.provider) {
        case 'openai':
          return await this.generateWithOpenAI(aiModel, prompt, request.count);
        case 'anthropic':
          return await this.generateWithAnthropic(aiModel, prompt, request.count);
        case 'groq':
          return await this.generateWithGroq(aiModel, prompt, request.count);
        case 'google':
          return await this.generateWithGemini(aiModel, prompt, request.count);
        default:
          throw new Error(`Unsupported AI provider: ${aiModel.provider}`);
      }
    } catch (error: any) {
      console.error(`AI generation failed with ${modelKey}:`, error.response?.data || error.message);
      throw new Error(`Failed to generate reviews: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
    }
  }

  private buildPrompt(request: AIGenerationRequest): string {
    const { businessContext, keywords, tone, length } = request;
    
    const wordCount = {
      short: '50-100',
      medium: '100-150',
      long: '150-200'
    }[length];

    return `You are an expert review writer specializing in SEO-optimized Google reviews. Generate ${request.count} authentic, human-like Google reviews for the following business:

Business Context: ${businessContext}
Keywords to include naturally: ${keywords.join(', ')}
Tone: ${tone}
Length: ${wordCount} words each

Requirements:
- SEO optimized with keywords naturally integrated (2-3% density)
- Authentic, human-like language (avoid generic phrases like "great service")
- Specific details that show genuine experience
- Vary sentence structure and vocabulary between reviews
- Include emotional connection and personal touches
- 5-star worthy content that sounds like real customers
- Each review should be unique and different
- Include local SEO elements when relevant
- Address common customer questions/concerns

Format your response as a JSON array where each object has:
- "text": the review content
- "keywords_used": array of keywords that were naturally included
- "seo_score": estimated SEO score (0-100)

Generate exactly ${request.count} unique reviews.`;
  }

  private async generateWithOpenAI(model: AIModel, prompt: string, count: number): Promise<AIGenerationResponse> {
    const response = await axios.post(model.endpoint, {
      model: model.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO review writer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    const reviews = JSON.parse(content);
    
    return { reviews };
  }

  private async generateWithAnthropic(model: AIModel, prompt: string, count: number): Promise<AIGenerationResponse> {
    const response = await axios.post(model.endpoint, {
      model: model.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, {
      headers: {
        'x-api-key': model.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const content = response.data.content[0].text;
    const reviews = JSON.parse(content);
    
    return { reviews };
  }

  private async generateWithGroq(model: AIModel, prompt: string, count: number): Promise<AIGenerationResponse> {
    const response = await axios.post(model.endpoint, {
      model: model.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO review writer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    const reviews = JSON.parse(content);
    
    return { reviews };
  }

  private async generateWithGemini(model: AIModel, prompt: string, count: number): Promise<AIGenerationResponse> {
    const response = await axios.post(`${model.endpoint}?key=${model.apiKey}`, {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2000
      }
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const reviews = JSON.parse(content);
    
    return { reviews };
  }

  // SEO scoring algorithm
  calculateSEOScore(text: string, keywords: string[]): number {
    let score = 0;
    const words = text.toLowerCase().split(' ');
    const totalWords = words.length;

    // Keyword presence (30 points)
    const keywordsFound = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    score += (keywordsFound.length / keywords.length) * 30;

    // Keyword density (20 points) - optimal 2-3%
    const keywordCount = keywordsFound.reduce((count, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      return count + (text.toLowerCase().match(regex) || []).length;
    }, 0);
    const density = (keywordCount / totalWords) * 100;
    if (density >= 2 && density <= 3) {
      score += 20;
    } else {
      score += Math.max(0, 20 - Math.abs(density - 2.5) * 4);
    }

    // Length optimization (15 points) - 100-150 words
    if (totalWords >= 100 && totalWords <= 150) {
      score += 15;
    } else {
      score += Math.max(0, 15 - Math.abs(totalWords - 125) * 0.1);
    }

    // Readability (20 points) - Flesch reading ease
    const readabilityScore = this.calculateReadability(text);
    score += (readabilityScore / 100) * 20;

    // Uniqueness (15 points) - based on common phrases
    const uniquenessScore = this.calculateUniqueness(text);
    score += uniquenessScore * 15;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) count++;
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }

  private calculateUniqueness(text: string): number {
    const commonPhrases = [
      'great service', 'highly recommend', 'amazing experience',
      'will definitely return', 'excellent food', 'friendly staff',
      'great atmosphere', 'best place', 'love this place'
    ];

    const textLower = text.toLowerCase();
    const foundPhrases = commonPhrases.filter(phrase => textLower.includes(phrase));
    
    return Math.max(0, 1 - (foundPhrases.length / commonPhrases.length));
  }
}

export default new AIService();




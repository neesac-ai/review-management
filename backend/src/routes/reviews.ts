import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../index';
import { authenticate } from '../middleware/auth';
import { aiGenerationRateLimiter } from '../middleware/rateLimiter';
import aiService from '../services/aiService';
import { AIGenerationRequest } from '../../../shared/types';

const router = express.Router();

// Generate AI reviews
router.post('/generate', [
  authenticate,
  aiGenerationRateLimiter,
  body('businessContext').trim().isLength({ min: 10 }),
  body('keywords').isArray({ min: 1 }),
  body('count').isInt({ min: 1, max: 20 }),
  body('tone').isIn(['professional', 'casual', 'enthusiastic']),
  body('length').isIn(['short', 'medium', 'long']),
  body('aiModel').optional().isIn(['openai', 'anthropic', 'groq', 'gemini'])
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const request: AIGenerationRequest = req.body;
    const businessId = req.query.businessId as string;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID is required'
      });
    }

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Get AI configuration for this business (use the specified model or first active one)
    const aiConfigId = req.body.aiConfigId;
    let aiConfig;

    if (aiConfigId) {
      const { data, error } = await supabase
        .from('ai_model_configs')
        .select('*')
        .eq('id', aiConfigId)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single();
      
      aiConfig = data;
    } else {
      // Get first active AI config for this business
      const { data, error } = await supabase
        .from('ai_model_configs')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      aiConfig = data;
    }

    if (!aiConfig) {
      return res.status(400).json({
        success: false,
        error: 'No active AI model configured for this business. Please configure an AI model first.'
      });
    }

    // Temporarily set the API key for this generation
    const envKey = `${aiConfig.provider.toUpperCase()}_API_KEY`;
    const originalKey = process.env[envKey];
    process.env[envKey] = aiConfig.api_key;

    try {
      // Update the request with the configured model
      const updatedRequest = {
        ...request,
        aiModel: aiConfig.provider,
        model: aiConfig.model
      };

      // Generate reviews using AI
      const aiResponse = await aiService.generateReviews(updatedRequest);
      
      // Restore original API key
      if (originalKey) {
        process.env[envKey] = originalKey;
      } else {
        delete process.env[envKey];
      }

      // Calculate SEO scores for each review
      const reviewsWithScores = aiResponse.reviews.map(review => ({
        ...review,
        seo_score: aiService.calculateSEOScore(review.text, request.keywords)
      }));

      res.json({
        success: true,
        data: {
          reviews: reviewsWithScores,
          businessContext: request.businessContext,
          keywords: request.keywords,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (generationError: any) {
      // Restore original API key on error
      if (originalKey) {
        process.env[envKey] = originalKey;
      } else {
        delete process.env[envKey];
      }
      
      console.error('AI generation error:', generationError);
      throw generationError;
    }

  } catch (error: any) {
    console.error('Review generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reviews',
      details: error.message || 'Unknown error'
    });
  }
});

// Save approved review template
router.post('/templates', [
  authenticate,
  body('businessId').isUUID(),
  body('content').trim().isLength({ min: 50 }),
  body('seoKeywords').isArray({ min: 1 }),
  body('seoScore').isInt({ min: 0, max: 100 })
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { businessId, content, seoKeywords, seoScore } = req.body;

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Save template
    const { data: template, error: templateError } = await supabase
      .from('review_templates')
      .insert({
        business_id: businessId,
        content,
        seo_keywords: seoKeywords,
        seo_score: seoScore,
        status: 'active'  // Changed from 'approved' to 'active'
      })
      .select('*')
      .single();

    if (templateError) {
      throw templateError;
    }

    res.status(201).json({
      success: true,
      data: template,
      message: 'Review template saved successfully'
    });

  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save review template'
    });
  }
});

// Get review templates for business
router.get('/templates/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, categoryId } = req.query;

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

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

    const { data: templates, error } = await query;
    
    console.log(`Found ${templates?.length || 0} templates for business ${businessId}${categoryId ? ` in category ${categoryId}` : ''}`);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get review templates'
    });
  }
});

// Update template status
router.put('/templates/:id', [
  authenticate,
  body('status').isIn(['draft', 'approved', 'active', 'archived'])
], async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verify template belongs to user's business
    const { data: template, error: templateError } = await supabase
      .from('review_templates')
      .select(`
        id,
        business_id,
        businesses!inner(client_id)
      `)
      .eq('id', id)
      .eq('businesses.client_id', req.user!.id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Update template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('review_templates')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Template status updated successfully'
    });

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

// Delete template
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify template belongs to user's business
    const { data: template, error: templateError } = await supabase
      .from('review_templates')
      .select(`
        id,
        business_id,
        businesses!inner(client_id)
      `)
      .eq('id', id)
      .eq('businesses.client_id', req.user!.id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('review_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

// Generate unique review based on templates (AI-powered)
router.get('/generate-unique/:businessId', aiGenerationRateLimiter, async (req: any, res: any) => {
  try {
    const { businessId } = req.params;

    // Get business info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, description')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Get active templates
    const { data: templates, error: templatesError } = await supabase
      .from('review_templates')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active');

    if (templatesError) {
      throw templatesError;
    }

    if (!templates || templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active templates found. Please create review templates first.'
      });
    }

    // Get AI configuration
    const { data: aiConfigs, error: aiConfigError } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .limit(1);

    if (aiConfigError || !aiConfigs || aiConfigs.length === 0) {
      // Fallback: return random template
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      return res.json({
        success: true,
        data: { content: randomTemplate.content, method: 'template' }
      });
    }

    const aiConfig = aiConfigs[0];

    // Select 2-3 templates as examples
    const shuffled = [...templates].sort(() => 0.5 - Math.random());
    const exampleTemplates = shuffled.slice(0, Math.min(3, templates.length));

    // Create variation prompt
    const baseReview = exampleTemplates[0].content;
    const keywords = exampleTemplates[0].seo_keywords.slice(0, 5).join(', ');
    
    const prompt = `Rewrite this review with the same positive sentiment but completely different wording to make it unique and genuine:

"${baseReview}"

Requirements:
- Keep the same positive tone and rating (5 stars)
- Include these keywords naturally: ${keywords}
- Change the sentence structure and phrasing completely
- Make it sound authentic and personal (150-200 words)
- DO NOT copy any phrases from the original
- Write as if a real customer wrote it

Return ONLY the rewritten review, nothing else.`;

    // Set API key
    const envKey = `${aiConfig.provider.toUpperCase()}_API_KEY`;
    const originalKey = process.env[envKey];
    process.env[envKey] = aiConfig.api_key;

    try {
      const aiResponse = await aiService.generateReviews({
        businessName: business.name,
        businessDescription: business.description || '',
        keywords: exampleTemplates[0].seo_keywords.slice(0, 5),
        count: 1,
        tone: 'professional',
        includeEmoji: false,
        aiModel: aiConfig.provider,
        model: aiConfig.model,
        customPrompt: prompt
      });

      // Restore key
      if (originalKey) process.env[envKey] = originalKey;
      else delete process.env[envKey];

      if (aiResponse.reviews && aiResponse.reviews.length > 0) {
        const review: any = aiResponse.reviews[0];
        res.json({
          success: true,
          data: { content: review.text || review.content }
        });
      } else {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        res.json({
          success: true,
          data: { content: randomTemplate.content }
        });
      }

    } catch (aiError) {
      if (originalKey) process.env[envKey] = originalKey;
      else delete process.env[envKey];
      
      console.error('AI generation error, using template:', aiError);
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      res.json({
        success: true,
        data: { content: randomTemplate.content }
      });
    }

  } catch (error: any) {
    console.error('Generate unique review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate unique review'
    });
  }
});

// Get random active template for customer
router.get('/random/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get random active template
    const { data: templates, error } = await supabase
      .from('review_templates')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('times_shown', { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!templates || templates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active review templates found'
      });
    }

    const template = templates[0];

    // Increment times shown
    await supabase
      .from('review_templates')
      .update({ times_shown: template.times_shown + 1 })
      .eq('id', template.id);

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Get random template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get review template'
    });
  }
});

// Generate reviews for a specific category with word count
router.post('/generate-by-category', [
  authenticate,
  aiGenerationRateLimiter,
  body('categoryId').isUUID(),
  body('businessContext').trim().isLength({ min: 10 }),
  body('keywords').isArray({ min: 1 }),
  body('count').isInt({ min: 1, max: 20 }),
  body('wordCounts').isArray(), // Array of word counts [10, 20, 50, 100]
  body('tone').isIn(['professional', 'casual', 'enthusiastic']),
  body('aiModel').optional().isIn(['openai', 'anthropic', 'groq', 'gemini'])
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { categoryId, businessContext, keywords, count, wordCounts, tone, aiModel } = req.body;

    // Debug logging
    console.log('=== Generate by Category Request ===');
    console.log('Category ID:', categoryId);
    console.log('Word Counts:', wordCounts);
    console.log('Count:', count);
    console.log('Keywords:', keywords);
    console.log('Tone:', tone);
    console.log('===================================');

    // Verify category belongs to user's business
    const { data: category, error: categoryError } = await supabase
      .from('review_categories')
      .select('id, business_id, businesses!inner(client_id)')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    if ((category.businesses as any).client_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get AI configuration
    const { data: aiConfig } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('business_id', category.business_id)
      .eq('is_active', true)
      .single();

    console.log('AI Config from database:', aiConfig);

    if (!aiConfig) {
      return res.status(400).json({
        success: false,
        error: 'No AI model configured. Please configure an AI model first.'
      });
    }

    // Set API key for the configured provider
    if (aiConfig.provider === 'openai') {
      process.env.OPENAI_API_KEY = aiConfig.api_key;
    } else if (aiConfig.provider === 'anthropic') {
      process.env.ANTHROPIC_API_KEY = aiConfig.api_key;
    } else if (aiConfig.provider === 'groq') {
      process.env.GROQ_API_KEY = aiConfig.api_key;
    } else if (aiConfig.provider === 'google') {
      process.env.GOOGLE_API_KEY = aiConfig.api_key;
    }

    console.log(`Using AI Provider: ${aiConfig.provider}, Model: ${aiConfig.model}`);

    // Generate reviews for each word count with variations
    const allReviews = [];
    const variations = [
      'focusing on the results and outcomes',
      'emphasizing the customer service experience',
      'highlighting the expertise and professionalism',
      'describing the process and journey',
      'focusing on value for money',
      'emphasizing speed and efficiency',
      'highlighting innovation and creativity',
      'focusing on the team and people',
      'describing specific achievements',
      'emphasizing long-term partnership'
    ];

    for (let i = 0; i < wordCounts.length; i++) {
      const wordCount = wordCounts[i];
      const variation = variations[i % variations.length];
      const lengthMap: any = {
        10: 'very_short',
        20: 'short',
        50: 'medium',
        100: 'long'
      };
      const length = lengthMap[wordCount] || 'medium';

      const request: AIGenerationRequest = {
        businessContext: `${businessContext}. Generate a UNIQUE review with approximately ${wordCount} words, ${variation}. Make it different from other reviews by using varied sentence structures and perspectives.`,
        keywords,
        count: 1,
        tone,
        length,
        aiModel: aiConfig.provider, // Pass the provider (groq, openai, etc.)
        model: aiConfig.model // Pass the actual model name from database (e.g., llama-3.3-70b-versatile)
      };

      try {
        console.log(`Generating review ${i + 1}/${wordCounts.length} with wordCount: ${wordCount}, variation: ${variation}, provider: ${aiConfig.provider}`);
        const response = await aiService.generateReviews(request);
        console.log(`Response for ${wordCount} words:`, response);
        
        if (response.reviews && response.reviews.length > 0) {
          console.log(`✓ Got ${response.reviews.length} review(s) for ${wordCount} words`);
          allReviews.push(...response.reviews.map((r: any) => ({
            text: r.text || r.content || '',
            keywords_used: r.keywords_used || [],
            seo_score: r.seo_score || 0,
            wordCount
          })));
        } else {
          console.error(`✗ No reviews in response for ${wordCount} words. Response:`, JSON.stringify(response));
        }
      } catch (error: any) {
        console.error(`✗ Failed to generate review for word count ${wordCount}:`, error.message || error);
        console.error('Full error:', error);
      }
    }

    // Debug: Check what we generated
    console.log('=== Generation Results ===');
    console.log('Total reviews generated:', allReviews.length);
    console.log('Reviews by word count:');
    allReviews.forEach((r: any, i: number) => {
      console.log(`  ${i + 1}. Word count: ${r.wordCount}, Length: ${r.text.length} chars, First 50 chars: "${r.text.substring(0, 50)}..."`);
    });
    console.log('=========================');

    // Save templates
    const templates = allReviews.map((review: any) => ({
      business_id: category.business_id,
      category_id: categoryId,
      content: review.text,
      seo_keywords: review.keywords_used || keywords,
      seo_score: review.seo_score || 0,
      word_count: review.wordCount,
      is_manual: false,
      status: 'active'
    }));

    const { data: savedTemplates, error: saveError } = await supabase
      .from('review_templates')
      .insert(templates)
      .select();

    if (saveError) {
      throw saveError;
    }

    res.json({
      success: true,
      data: savedTemplates
    });
  } catch (error: any) {
    console.error('Generate reviews by category error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate reviews'
    });
  }
});

// Create manual review template
router.post('/manual-template', [
  authenticate,
  body('categoryId').isUUID(),
  body('content').trim().isLength({ min: 10 }),
  body('wordCount').isInt({ min: 10, max: 200 }),
  body('keywords').optional().isArray()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { categoryId, content, wordCount, keywords } = req.body;

    // Verify category belongs to user's business
    const { data: category, error: categoryError } = await supabase
      .from('review_categories')
      .select('id, business_id, businesses!inner(client_id)')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    if ((category.businesses as any).client_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Create manual template
    const { data: template, error } = await supabase
      .from('review_templates')
      .insert({
        business_id: category.business_id,
        category_id: categoryId,
        content,
        word_count: wordCount,
        seo_keywords: keywords || [],
        is_manual: true,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Create manual template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual template'
    });
  }
});

// Get templates by category (for customer view)
router.get('/by-category/:businessId', async (req: any, res: any) => {
  try {
    const { businessId } = req.params;

    // Get all categories with their active templates
    const { data: categories, error } = await supabase
      .from('review_categories')
      .select(`
        id,
        name,
        description,
        review_templates!inner(
          id,
          content,
          word_count,
          is_manual,
          times_shown,
          times_copied
        )
      `)
      .eq('business_id', businessId)
      .eq('review_templates.status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Get templates by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

export default router;


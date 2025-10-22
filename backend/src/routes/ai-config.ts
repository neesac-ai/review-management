import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { supabase } from '../index';
import modelDiscoveryService from '../services/modelDiscoveryService';

const router = express.Router();

// Get available AI models from providers (with optional API key for real-time fetching)
router.post('/discover', [
  authenticate,
  body('provider').isIn(['openai', 'anthropic', 'groq', 'google']),
  body('apiKey').optional().trim().isLength({ min: 10 })
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

    const { provider, apiKey } = req.body;

    let models;
    if (apiKey) {
      // Fetch real-time models with provided API key
      models = await modelDiscoveryService.fetchModelsForProvider(provider, apiKey);
    } else {
      // Return fallback models without API key
      const allModels = await modelDiscoveryService.getAllAvailableModels();
      models = allModels[provider] || [];
    }

    res.json({
      success: true,
      data: {
        provider,
        models
      }
    });

  } catch (error: any) {
    console.error('Model discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover models',
      details: error.message
    });
  }
});

// Get all available AI models (fallback models for all providers)
router.get('/discover/all', authenticate, async (req: any, res: any) => {
  try {
    const allModels = await modelDiscoveryService.getAllAvailableModels();

    res.json({
      success: true,
      data: allModels
    });

  } catch (error: any) {
    console.error('Model discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover models',
      details: error.message
    });
  }
});

// Get AI model configurations for a business
router.get('/models/:businessId', authenticate, async (req: any, res: any) => {
  try {
    const { businessId } = req.params;

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

    // Get AI configurations for this business
    const { data: aiConfigs, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: aiConfigs || []
    });

  } catch (error) {
    console.error('Get AI configs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI configurations'
    });
  }
});

// Add/Update AI model configuration
router.post('/models', [
  authenticate,
  body('businessId').isUUID(),
  body('modelName').trim().isLength({ min: 1 }),
  body('provider').isIn(['openai', 'anthropic', 'groq', 'google']),
  body('apiKey').trim().isLength({ min: 10 }),
  body('model').trim().isLength({ min: 1 }),
  body('isActive').optional().isBoolean()
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

    const { businessId, modelName, provider, apiKey, model, isActive = true } = req.body;

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

    // Check if configuration already exists
    const { data: existingConfig } = await supabase
      .from('ai_model_configs')
      .select('id')
      .eq('business_id', businessId)
      .eq('provider', provider)
      .eq('model', model)
      .single();

    let aiConfig;
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('ai_model_configs')
        .update({
          model_name: modelName,
          api_key: apiKey,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select('*')
        .single();

      if (error) throw error;
      aiConfig = data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('ai_model_configs')
        .insert({
          business_id: businessId,
          model_name: modelName,
          provider,
          api_key: apiKey,
          model,
          is_active: isActive
        })
        .select('*')
        .single();

      if (error) throw error;
      aiConfig = data;
    }

    res.status(201).json({
      success: true,
      data: aiConfig,
      message: 'AI model configuration saved successfully'
    });

  } catch (error) {
    console.error('Save AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save AI configuration'
    });
  }
});

// Delete AI model configuration
router.delete('/models/:configId', authenticate, async (req: any, res: any) => {
  try {
    const { configId } = req.params;

    // Verify configuration belongs to user's business
    const { data: config, error: configError } = await supabase
      .from('ai_model_configs')
      .select(`
        id,
        business_id,
        businesses!inner(client_id)
      `)
      .eq('id', configId)
      .eq('businesses.client_id', req.user!.id)
      .single();

    if (configError || !config) {
      return res.status(404).json({
        success: false,
        error: 'AI configuration not found'
      });
    }

    // Delete configuration
    const { error: deleteError } = await supabase
      .from('ai_model_configs')
      .delete()
      .eq('id', configId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'AI configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI configuration'
    });
  }
});

// Test AI model configuration
router.post('/test', [
  authenticate,
  body('provider').isIn(['openai', 'anthropic', 'groq', 'google']),
  body('apiKey').trim().isLength({ min: 10 }),
  body('model').trim().isLength({ min: 1 })
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

    const { provider, apiKey, model } = req.body;

    console.log(`Testing AI configuration: ${provider} - ${model}`);

    // Test with a direct API call instead of using the service
    const axios = require('axios');

    try {
      let response;
      const testPrompt = 'Say "Configuration test successful" if you can read this.';

      switch (provider) {
        case 'openai':
          response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          break;

        case 'anthropic':
          response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 50,
            messages: [{ role: 'user', content: testPrompt }]
          }, {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            }
          });
          break;

        case 'groq':
          response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 50
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          break;

        case 'google':
          response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: [{
                parts: [{ text: testPrompt }]
              }],
              generationConfig: {
                maxOutputTokens: 50
              }
            }
          );
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      console.log(`✅ Test successful for ${provider} - ${model}`);

      res.json({
        success: true,
        data: {
          message: 'AI model configuration is working correctly',
          provider,
          model
        }
      });

    } catch (testError: any) {
      console.error(`❌ Test failed for ${provider} - ${model}:`, testError.response?.data || testError.message);

      res.status(400).json({
        success: false,
        error: 'AI model test failed',
        details: testError.response?.data?.error?.message || testError.message || 'Unknown error'
      });
    }

  } catch (error: any) {
    console.error('Test AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI configuration',
      details: error.message
    });
  }
});

export default router;

import { supabase } from '../index';
import aiService from './aiService';

export class TemplateAutoRegenerationService {
  /**
   * Regenerate template from existing template data
   */
  async regenerateTemplateFromData(templateData: any, businessId: string): Promise<void> {
    try {
      console.log(`Auto-regenerating template for business ${businessId} using template data`);
      console.log('Template data:', JSON.stringify(templateData, null, 2));

      const category = (templateData as any).review_categories;
      const wordCount = templateData.word_count;

      // Get AI configuration for the business
      const { data: aiConfig } = await supabase
        .from('ai_model_configs')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single();

      if (!aiConfig) {
        console.error('No AI configuration found for auto-regeneration');
        return;
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

      // Get business context
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('name, description')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Business lookup error:', businessError);
        return;
      }

      if (!business) {
        console.error('Business not found for auto-regeneration');
        return;
      }

      console.log('Business found:', business);

      // Create business context
      const businessContext = `${business.name} - ${business.description || 'Professional services'}`;

      // Generate keywords based on category
      const keywords = this.generateKeywordsForCategory(category.name, category.description);

      // Generate a single new review with the same word count
      const request = {
        businessContext: `${businessContext}. Generate a UNIQUE review with approximately ${wordCount} words, focusing on ${category.name} services. Make it different from other reviews by using varied sentence structures and perspectives.`,
        keywords,
        count: 1,
        tone: 'professional' as const,
        length: wordCount,
        aiModel: aiConfig.provider,
        model: aiConfig.model
      };

      console.log('Auto-generating new template with request:', request);

      const aiResponse = await aiService.generateReviews(request);
      console.log('AI Response for auto-regeneration:', JSON.stringify(aiResponse, null, 2));

      if (aiResponse.reviews && aiResponse.reviews.length > 0) {
        const newReview = aiResponse.reviews[0];
        console.log('New review generated:', newReview);

        // Save the new template
        const { error: insertError } = await supabase
          .from('review_templates')
          .insert({
            business_id: businessId,
            category_id: category.id,
            content: newReview.text,
            seo_keywords: keywords,
            seo_score: 85, // Default SEO score
            status: 'active',
            word_count: wordCount,
            is_manual: false
          });

        if (insertError) {
          console.error('Failed to insert auto-generated template:', insertError);
        } else {
          console.log(`Successfully auto-generated new template for category ${category.name} with ${wordCount} words`);
        }
      } else {
        console.error('AI generation failed for auto-regeneration: No reviews generated');
        console.error('AI Response structure:', JSON.stringify(aiResponse, null, 2));
      }

    } catch (error) {
      console.error('Auto-regeneration error:', error);
    }
  }

  /**
   * Delete a used template and auto-generate a new one to maintain constant count
   */
  async deleteAndRegenerateTemplate(templateId: string, businessId: string): Promise<void> {
    try {
      console.log(`Auto-regenerating template for business ${businessId} after deletion of template ${templateId}`);

      // Get the deleted template's category and details
      const { data: deletedTemplate, error: templateError } = await supabase
        .from('review_templates')
        .select(`
          id,
          category_id,
          word_count,
          review_categories!inner(
            id,
            name,
            description,
            business_id
          )
        `)
        .eq('id', templateId)
        .single();

      if (templateError || !deletedTemplate) {
        console.error('Could not find deleted template for regeneration:', templateError);
        return;
      }

      const category = (deletedTemplate as any).review_categories;
      const wordCount = deletedTemplate.word_count;

      // Get AI configuration for the business
      const { data: aiConfig } = await supabase
        .from('ai_model_configs')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single();

      if (!aiConfig) {
        console.error('No AI configuration found for auto-regeneration');
        return;
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

      // Get business context
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('name, description')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Business lookup error:', businessError);
        return;
      }

      if (!business) {
        console.error('Business not found for auto-regeneration');
        return;
      }

      console.log('Business found:', business);

      // Create business context
      const businessContext = `${business.name} - ${business.description || 'Professional services'}`;

      // Generate keywords based on category
      const keywords = this.generateKeywordsForCategory(category.name, category.description);

      // Generate a single new review with the same word count
      const request = {
        businessContext: `${businessContext}. Generate a UNIQUE review with approximately ${wordCount} words, focusing on ${category.name} services. Make it different from other reviews by using varied sentence structures and perspectives.`,
        keywords,
        count: 1,
        tone: 'professional' as const,
        length: wordCount,
        aiModel: aiConfig.provider,
        model: aiConfig.model
      };

      console.log('Auto-generating new template with request:', request);

      const aiResponse = await aiService.generateReviews(request);
      console.log('AI Response for auto-regeneration:', JSON.stringify(aiResponse, null, 2));

      if (aiResponse.reviews && aiResponse.reviews.length > 0) {
        const newReview = aiResponse.reviews[0];
        console.log('New review generated:', newReview);

        // Save the new template
        const { error: insertError } = await supabase
          .from('review_templates')
          .insert({
            business_id: businessId,
            category_id: category.id,
            content: newReview.text,
            seo_keywords: keywords,
            seo_score: 85, // Default SEO score
            status: 'active',
            word_count: wordCount,
            is_manual: false
          });

        if (insertError) {
          console.error('Failed to insert auto-generated template:', insertError);
        } else {
          console.log(`Successfully auto-generated new template for category ${category.name} with ${wordCount} words`);
        }
      } else {
        console.error('AI generation failed for auto-regeneration: No reviews generated');
        console.error('AI Response structure:', JSON.stringify(aiResponse, null, 2));
      }

    } catch (error) {
      console.error('Auto-regeneration error:', error);
    }
  }

  /**
   * Generate keywords based on category name and description
   */
  private generateKeywordsForCategory(categoryName: string, categoryDescription?: string): string[] {
    const baseKeywords = [
      'excellent service',
      'professional',
      'highly recommended',
      'great experience',
      'outstanding results'
    ];

    const categoryKeywords = categoryName.toLowerCase().split(' ').filter(word => word.length > 2);
    const descriptionKeywords = categoryDescription 
      ? categoryDescription.toLowerCase().split(' ').filter(word => word.length > 3)
      : [];

    return [...baseKeywords, ...categoryKeywords, ...descriptionKeywords].slice(0, 10);
  }

  /**
   * Check if a category needs template regeneration
   */
  async checkAndRegenerateIfNeeded(categoryId: string, businessId: string): Promise<void> {
    try {
      // Count active templates in the category
      const { count, error } = await supabase
        .from('review_templates')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('status', 'active');

      if (error) {
        console.error('Error checking template count:', error);
        return;
      }

      // If less than 10 templates, regenerate to maintain 10
      if (count && count < 10) {
        const needed = 10 - count;
        console.log(`Category ${categoryId} has ${count} templates, need to generate ${needed} more`);

        // Get category details
        const { data: category } = await supabase
          .from('review_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (category) {
          // Generate the needed templates
          await this.regenerateTemplatesForCategory(category, businessId, needed);
        }
      }
    } catch (error) {
      console.error('Error in checkAndRegenerateIfNeeded:', error);
    }
  }

  /**
   * Regenerate templates for a category
   */
  private async regenerateTemplatesForCategory(category: any, businessId: string, count: number): Promise<void> {
    try {
      // Get AI configuration
      const { data: aiConfig } = await supabase
        .from('ai_model_configs')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single();

      if (!aiConfig) {
        console.error('No AI configuration found for regeneration');
        return;
      }

      // Set API key
      if (aiConfig.provider === 'openai') {
        process.env.OPENAI_API_KEY = aiConfig.api_key;
      } else if (aiConfig.provider === 'anthropic') {
        process.env.ANTHROPIC_API_KEY = aiConfig.api_key;
      } else if (aiConfig.provider === 'groq') {
        process.env.GROQ_API_KEY = aiConfig.api_key;
      } else if (aiConfig.provider === 'google') {
        process.env.GOOGLE_API_KEY = aiConfig.api_key;
      }

      // Get business context
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('name, description')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Business lookup error:', businessError);
        return;
      }

      if (!business) {
        console.error('Business not found for auto-regeneration');
        return;
      }

      console.log('Business found:', business);

      const businessContext = `${business.name} - ${business.description || 'Professional services'}`;
      const keywords = this.generateKeywordsForCategory(category.name, category.description);

      // Generate templates with different word counts
      const wordCounts = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120];
      const templatesToGenerate = Math.min(count, wordCounts.length);

      for (let i = 0; i < templatesToGenerate; i++) {
        const wordCount = wordCounts[i % wordCounts.length];
        
        const request = {
          businessContext: `${businessContext}. Generate a UNIQUE review with approximately ${wordCount} words, focusing on ${category.name} services. Make it different from other reviews by using varied sentence structures and perspectives.`,
          keywords,
          count: 1,
          tone: 'professional' as const,
          length: wordCount,
          aiModel: aiConfig.provider,
          model: aiConfig.model
        };

        const aiResponse = await aiService.generateReviews(request);

        if (aiResponse.reviews && aiResponse.reviews.length > 0) {
          const newReview = aiResponse.reviews[0];

          await supabase
            .from('review_templates')
            .insert({
              business_id: businessId,
              category_id: category.id,
              content: newReview.text,
              seo_keywords: keywords,
              seo_score: 85,
              status: 'active',
              word_count: wordCount,
              is_manual: false
            });
        }
      }

      console.log(`Successfully regenerated ${templatesToGenerate} templates for category ${category.name}`);
    } catch (error) {
      console.error('Error regenerating templates:', error);
    }
  }
}

export default new TemplateAutoRegenerationService();
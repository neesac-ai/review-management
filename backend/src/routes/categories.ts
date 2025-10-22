import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../index';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get all categories for a business
router.get('/:businessId', authenticate, async (req: any, res: any) => {
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

    // Get categories with template count
    const { data: categories, error } = await supabase
      .from('review_categories')
      .select(`
        *,
        review_templates(count)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Create a new category
router.post('/', [
  authenticate,
  body('businessId').isUUID(),
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim()
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

    const { businessId, name, description } = req.body;

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

    // Create category
    const { data: category, error } = await supabase
      .from('review_categories')
      .insert({
        business_id: businessId,
        name,
        description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

// Update a category
router.put('/:categoryId', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim()
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

    const { categoryId } = req.params;
    const updateData: any = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    updateData.updated_at = new Date().toISOString();

    // Verify category belongs to user's business
    const { data: category, error: fetchError } = await supabase
      .from('review_categories')
      .select('id, business_id, businesses!inner(client_id)')
      .eq('id', categoryId)
      .single();

    if (fetchError || !category) {
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

    // Update category
    const { data: updatedCategory, error } = await supabase
      .from('review_categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

// Delete a category
router.delete('/:categoryId', authenticate, async (req: any, res: any) => {
  try {
    const { categoryId } = req.params;

    // Verify category belongs to user's business
    const { data: category, error: fetchError } = await supabase
      .from('review_categories')
      .select('id, business_id, businesses!inner(client_id)')
      .eq('id', categoryId)
      .single();

    if (fetchError || !category) {
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

    // Delete category (will cascade delete templates)
    const { error: deleteError } = await supabase
      .from('review_categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

export default router;


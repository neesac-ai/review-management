import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { supabase } from '../index';

const router = express.Router();

// Get user's businesses
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('client_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: businesses || []
    });

  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get businesses'
    });
  }
});

// Create new business
router.post('/', [
  authenticate,
  body('name').trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('googlePlaceId').optional().isString(),
  body('logoUrl').optional().isURL(),
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i)
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

    const { name, description, googlePlaceId, logoUrl, primaryColor, secondaryColor } = req.body;

    const { data: business, error } = await supabase
      .from('businesses')
      .insert({
        client_id: req.user!.id,
        name,
        description,
        google_place_id: googlePlaceId,
        logo_url: logoUrl,
        primary_color: primaryColor || '#2e9cca',
        secondary_color: secondaryColor || '#4a4a66'
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: business,
      message: 'Business created successfully'
    });

  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business'
    });
  }
});

// Get business by ID
router.get('/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (error || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });

  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business'
    });
  }
});

// Update business
router.put('/:businessId', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('google_place_id').optional().isString(),
  body('logo_url').optional(),
  body('primary_color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('secondary_color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('email_notifications').optional().isBoolean(),
  body('notification_email').optional().isEmail()
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

    const { businessId } = req.params;
    
    // Map the incoming data to database column names
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.google_place_id !== undefined) updateData.google_place_id = req.body.google_place_id;
    if (req.body.logo_url !== undefined) updateData.logo_url = req.body.logo_url;
    if (req.body.primary_color !== undefined) updateData.primary_color = req.body.primary_color;
    if (req.body.secondary_color !== undefined) updateData.secondary_color = req.body.secondary_color;
    if (req.body.email_notifications !== undefined) updateData.email_notifications = req.body.email_notifications;
    if (req.body.notification_email !== undefined) updateData.notification_email = req.body.notification_email;
    
    updateData.updated_at = new Date().toISOString();

    // Verify business belongs to user
    const { data: existingBusiness, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !existingBusiness) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Update business
    const { data: business, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      data: business,
      message: 'Business updated successfully'
    });

  } catch (error: any) {
    console.error('Update business error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business',
      details: error.message
    });
  }
});

// Delete business
router.delete('/:businessId', authenticate, async (req, res) => {
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

    // Delete business (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Business deleted successfully'
    });

  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete business'
    });
  }
});

// Get business settings
router.get('/:businessId/settings', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Verify business belongs to user
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        description,
        google_place_id,
        logo_url,
        primary_color,
        secondary_color,
        created_at,
        updated_at
      `)
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (error || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });

  } catch (error) {
    console.error('Get business settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business settings'
    });
  }
});

// Update business settings
router.put('/:businessId/settings', [
  authenticate,
  body('googlePlaceId').optional().isString(),
  body('logoUrl').optional().isURL(),
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i),
  body('emailNotifications').optional().isBoolean(),
  body('thankYouMessage').optional().trim()
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

    const { businessId } = req.params;
    const { googlePlaceId, logoUrl, primaryColor, secondaryColor, emailNotifications, thankYouMessage } = req.body;

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

    // Update business settings
    const updateData: any = {};
    if (googlePlaceId !== undefined) updateData.google_place_id = googlePlaceId;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;
    if (primaryColor !== undefined) updateData.primary_color = primaryColor;
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor;

    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedBusiness,
      message: 'Business settings updated successfully'
    });

  } catch (error) {
    console.error('Update business settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business settings'
    });
  }
});

export default router;



import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { qrScanRateLimiter } from '../middleware/rateLimiter';
import qrService from '../services/qrService';
import templateAutoRegenerationService from '../services/templateAutoRegenerationService';
import { supabase } from '../index';

const router = express.Router();

// Generate QR code
router.post('/generate', [
  authenticate,
  body('businessId').isUUID(),
  body('type').isIn(['business', 'location', 'transaction']),
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().isString(),
  body('metadata').optional().isObject(),
  body('customLogo').optional().isString(),
  body('colorScheme').optional().isObject()
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

    const { businessId, type, name, description, metadata, customLogo, colorScheme } = req.body;

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

    // Generate QR code
    const result = await qrService.generateQRCode({
      businessId,
      type,
      name,
      description,
      metadata,
      customLogo,
      colorScheme
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'QR code generated successfully'
    });

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

// Get QR code info (for customer scan)
router.get('/:qrCodeId', qrScanRateLimiter, async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCodeInfo = await qrService.getQRCodeInfo(qrCodeId);

    // Increment scan count
    await qrService.incrementScanCount(qrCodeId);

    // Log scan event
    await supabase
      .from('analytics')
      .insert({
        business_id: qrCodeInfo.business_id,
        qr_code_id: qrCodeInfo.id,
        event_type: 'scan',
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
      });

    res.json({
      success: true,
      data: qrCodeInfo
    });

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(404).json({
      success: false,
      error: 'QR code not found'
    });
  }
});

// Get QR codes for business
router.get('/business/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;

    const qrCodes = await qrService.getBusinessQRCodes(businessId, req.user!.id);

    res.json({
      success: true,
      data: qrCodes
    });

  } catch (error) {
    console.error('Get business QR codes error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get QR codes'
    });
  }
});

// Get QR code analytics
router.get('/analytics/:qrCodeId', authenticate, async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const analytics = await qrService.getQRAnalytics(qrCodeId, req.user!.id);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get QR analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics'
    });
  }
});

// Bulk generate QR codes
router.post('/bulk-generate', [
  authenticate,
  body('businessId').isUUID(),
  body('count').isInt({ min: 1, max: 1000 }),
  body('type').isIn(['transaction'])
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

    const { businessId, count, type } = req.body;

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

    const result = await qrService.bulkGenerateQRCodes(businessId, count, type);

    res.status(201).json({
      success: true,
      data: {
        qrCodes: result.qrCodes,
        csvData: result.csvData,
        count: result.qrCodes.length
      },
      message: 'Bulk QR codes generated successfully'
    });

  } catch (error) {
    console.error('Bulk QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk QR codes'
    });
  }
});

// Delete QR code
router.delete('/:qrCodeId', authenticate, async (req: any, res: any) => {
  try {
    const { qrCodeId } = req.params;

    // Verify QR code belongs to user's business
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        id,
        business_id,
        businesses!inner(client_id)
      `)
      .eq('id', qrCodeId)
      .single();

    if (qrError || !qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    if ((qrCode.businesses as any).client_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Delete QR code
    const { error: deleteError } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', qrCodeId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    });

  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete QR code'
    });
  }
});

// Track customer action
router.post('/:qrCodeId/track', [
  qrScanRateLimiter,
  body('action').isIn(['thumbs_up', 'thumbs_down', 'copy_review', 'submit_feedback', 'google_redirect']),
  body('metadata').optional().isObject(),
  body('reviewContent').optional().isString(),
  body('templateId').optional().isUUID()
], async (req: any, res: any) => {
  try {
    const { qrCodeId } = req.params;
    const { action, metadata, reviewContent, templateId } = req.body;

    // Get QR code info
    const qrCodeInfo = await qrService.getQRCodeInfo(qrCodeId);
    console.log('QR Code Info structure:', JSON.stringify(qrCodeInfo, null, 2));

    // Log event (handle google_redirect gracefully if enum not updated)
    let eventType = action;
    if (action === 'google_redirect') {
      // Fallback to copy_review if google_redirect enum doesn't exist
      eventType = 'copy_review';
    }

    const { error } = await supabase
      .from('analytics')
      .insert({
        business_id: qrCodeInfo.business_id,
        qr_code_id: qrCodeInfo.id,
        event_type: eventType,
        review_content: reviewContent || null,
        metadata: {
          ...metadata,
          templateId: templateId || null,
          originalAction: action, // Store original action in metadata
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      throw error;
    }

    // Handle template deletion and auto-regeneration for copy_review action
    if (action === 'copy_review' && templateId) {
      try {
        console.log(`Template ${templateId} was copied, deleting and regenerating...`);
        
        // Get template details before deletion for regeneration
        const { data: templateData, error: templateError } = await supabase
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

        if (templateError || !templateData) {
          console.error('Could not find template for regeneration:', templateError);
        } else {
          // Delete the used template
          const { error: deleteError } = await supabase
            .from('review_templates')
            .delete()
            .eq('id', templateId);

          if (deleteError) {
            console.error('Error deleting used template:', deleteError);
          } else {
            console.log(`Successfully deleted template ${templateId}`);
            
            // Trigger auto-regeneration with template data
            const businessId = qrCodeInfo.business_id || (qrCodeInfo.businesses as any)?.id;
            await templateAutoRegenerationService.regenerateTemplateFromData(templateData, businessId);
          }
        }
      } catch (regenerationError) {
        console.error('Error in template auto-regeneration:', regenerationError);
        // Don't fail the main request if regeneration fails
      }
    }

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error: any) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      details: error.message
    });
  }
});

export default router;



import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { supabase } from '../index';
import nodemailer from 'nodemailer';

const router = express.Router();

// Submit customer feedback
router.post('/submit', [
  body('qrCodeId').isString().notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('content').trim().isLength({ min: 1 }),
  body('additionalComments').optional().trim()
], async (req: any, res: any) => {
  try {
    console.log('Feedback submission request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { qrCodeId, rating, content, additionalComments } = req.body;

    // Get QR code info
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        id,
        business_id,
        businesses!inner(
          id,
          name,
          client_id,
          email_notifications,
          notification_email,
          clients!inner(email, name)
        )
      `)
      .eq('code', qrCodeId)
      .single();

    if (qrError || !qrCode) {
      console.error('QR code lookup error:', qrError);
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Type assertion for joined data
    const business = qrCode.businesses as any;

    // Save feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        business_id: qrCode.business_id,
        qr_code_id: qrCode.id,
        rating,
        content,
        additional_comments: additionalComments,
        status: 'new'
      })
      .select('*')
      .single();

    if (feedbackError) {
      console.error('Feedback insert error:', feedbackError);
      throw feedbackError;
    }

    // Send email notification to business owner (only if enabled)
    if (business?.email_notifications && business?.notification_email) {
      try {
        await sendFeedbackNotification(business, feedback);
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });

  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      details: error.message
    });
  }
});

// Get feedback for business
router.get('/business/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

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
      .from('feedback')
      .select(`
        *,
        qr_codes(
          code,
          type,
          metadata
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedback, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    res.json({
      success: true,
      data: {
        feedback: feedback || [],
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback'
    });
  }
});

// Update feedback status
router.put('/:feedbackId', [
  authenticate,
  body('status').isIn(['new', 'in_progress', 'resolved']),
  body('notes').optional().trim()
], async (req: any, res: any) => {
  try {
    const { feedbackId } = req.params;
    const { status, notes } = req.body;

    // Verify feedback belongs to user's business
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        id,
        business_id,
        businesses!inner(client_id)
      `)
      .eq('id', feedbackId)
      .eq('businesses.client_id', req.user!.id)
      .single();

    if (feedbackError || !feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Update feedback
    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', feedbackId)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback status updated successfully'
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
});

// Get feedback statistics
router.get('/stats/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

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
      .from('feedback')
      .select('rating, status, created_at')
      .eq('business_id', businessId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: feedback, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    const total = feedback?.length || 0;
    const averageRating = total > 0 
      ? feedback!.reduce((sum, f) => sum + f.rating, 0) / total 
      : 0;
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: feedback?.filter(f => f.rating === rating).length || 0
    }));

    const statusDistribution = ['new', 'in_progress', 'resolved'].map(status => ({
      status,
      count: feedback?.filter(f => f.status === status).length || 0
    }));

    res.json({
      success: true,
      data: {
        total,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        statusDistribution
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback statistics'
    });
  }
});

// Export feedback to CSV
router.get('/export/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

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
      .from('feedback')
      .select(`
        rating,
        content,
        additional_comments,
        status,
        created_at,
        resolved_at,
        qr_codes(
          code,
          type
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: feedback, error } = await query;

    if (error) {
      throw error;
    }

    // Generate CSV
    const csvHeader = 'Rating,Content,Additional Comments,Status,QR Code,QR Type,Created At,Resolved At\n';
    const csvRows = feedback?.map((f: any) => [
      f.rating,
      `"${f.content.replace(/"/g, '""')}"`,
      `"${(f.additional_comments || '').replace(/"/g, '""')}"`,
      f.status,
      f.qr_codes?.[0]?.code || f.qr_codes?.code || '',
      f.qr_codes?.[0]?.type || f.qr_codes?.type || '',
      f.created_at,
      f.resolved_at || ''
    ].join(',')) || [];

    const csvContent = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${businessId}-${Date.now()}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback'
    });
  }
});

// Email notification helper
async function sendFeedbackNotification(business: any, feedback: any) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: business.clients.email,
      subject: `New Feedback Received - ${business.name}`,
      html: `
        <h2>New Customer Feedback</h2>
        <p><strong>Business:</strong> ${business.name}</p>
        <p><strong>Rating:</strong> ${feedback.rating}/5 stars</p>
        <p><strong>Feedback:</strong></p>
        <p>${feedback.content}</p>
        ${feedback.additional_comments ? `<p><strong>Additional Comments:</strong></p><p>${feedback.additional_comments}</p>` : ''}
        <p><strong>Submitted:</strong> ${new Date(feedback.created_at).toLocaleString()}</p>
        <p>Please log in to your dashboard to view and respond to this feedback.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send feedback notification:', error);
  }
}

export default router;



import express from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../index';

const router = express.Router();

// Get comprehensive dashboard metrics
router.get('/dashboard/:businessId', authenticate, async (req: any, res: any) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Build date filter for analytics
    let analyticsQuery = supabase
      .from('analytics')
      .select('*')
      .eq('business_id', businessId);

    if (startDate) {
      analyticsQuery = analyticsQuery.gte('created_at', startDate);
    }
    if (endDate) {
      analyticsQuery = analyticsQuery.lte('created_at', endDate);
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await analyticsQuery;

    if (analyticsError) {
      throw analyticsError;
    }

    // Build date filter for feedback
    let feedbackQuery = supabase
      .from('feedback')
      .select('*')
      .eq('business_id', businessId);

    if (startDate) {
      feedbackQuery = feedbackQuery.gte('created_at', startDate);
    }
    if (endDate) {
      feedbackQuery = feedbackQuery.lte('created_at', endDate);
    }

    // Get feedback data (internal reviews)
    const { data: feedbackData, error: feedbackError } = await feedbackQuery;

    if (feedbackError) {
      throw feedbackError;
    }

    // Process metrics
    const events = analytics || [];
    const feedback = feedbackData || [];
    
    const totalScans = events.filter(e => e.event_type === 'scan').length;
    const thumbsUp = events.filter(e => e.event_type === 'thumbs_up').length;
    const thumbsDown = events.filter(e => e.event_type === 'thumbs_down').length;
    const copies = events.filter(e => e.event_type === 'copy_review').length;
    const feedbackSubmissions = events.filter(e => e.event_type === 'submit_feedback').length;

    // Calculate Google reviews - use google_redirect (when user clicks to open Google) as best proxy
    const googleRedirects = events.filter(e => e.event_type === 'google_redirect').length;
    const googleReviews = googleRedirects > 0 ? googleRedirects : copies; // Fallback to copies if no redirects tracked
    const internalReviews = feedback.length; // All feedback submissions
    const totalReviews = googleReviews + internalReviews;

    // Calculate average ratings
    const googleAvgRating = thumbsUp > 0 ? 5.0 : 0; // Thumbs up implies 5 stars
    const internalAvgRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      : 0;

    // Calculate conversion rates - using google_redirect as best available proxy
    const googleReviewRate = totalScans > 0 ? (googleReviews / totalScans) * 100 : 0;
    const internalReviewRate = totalScans > 0 ? (feedback.length / totalScans) * 100 : 0;
    const positiveRate = (thumbsUp + thumbsDown) > 0 ? (thumbsUp / (thumbsUp + thumbsDown)) * 100 : 0;

    // Get recent activity (combined analytics and feedback)
    const recentActivity = [
      ...events.map(e => ({
        type: e.event_type,
        timestamp: e.created_at,
        data: e
      })),
      ...feedback.map(f => ({
        type: 'submit_feedback',
        timestamp: f.created_at,
        data: f
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const metrics = {
      totalScans,
      thumbsUp,
      thumbsDown,
      copies,
      feedbackSubmissions,
      totalReviews,
      googleReviews,
      internalReviews,
      googleAvgRating: Math.round(googleAvgRating * 10) / 10,
      internalAvgRating: Math.round(internalAvgRating * 10) / 10,
      googleReviewRate: Math.round(googleReviewRate * 10) / 10,
      internalReviewRate: Math.round(internalReviewRate * 10) / 10,
      positiveRate: Math.round(positiveRate * 10) / 10,
      averageRating: totalReviews > 0
        ? Math.round(((googleReviews * googleAvgRating) + (internalReviews * internalAvgRating)) / totalReviews * 10) / 10
        : 0,
      recentActivity
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics',
      details: error.message
    });
  }
});

// Export analytics with date range filter
router.get('/export/:businessId', authenticate, async (req: any, res: any) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Get analytics data with QR code info
    let analyticsQuery = supabase
      .from('analytics')
      .select(`
        *,
        qr_codes(
          code,
          type,
          name
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (startDate) {
      analyticsQuery = analyticsQuery.gte('created_at', startDate as string);
    }
    if (endDate) {
      analyticsQuery = analyticsQuery.lte('created_at', endDate as string);
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery;

    if (analyticsError) {
      throw analyticsError;
    }

    if (format === 'csv') {
      // Generate CSV with review content
      const csvHeader = 'Event Type,QR Code Name,QR Code,QR Type,Review Content,Timestamp\n';
      const csvRows = analytics?.map((event: any) => [
        event.event_type,
        event.qr_codes?.name || '',
        event.qr_codes?.code || '',
        event.qr_codes?.type || '',
        `"${(event.review_content || '').replace(/"/g, '""')}"`,
        event.created_at
      ].join(',')) || [];

      const csvContent = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${business.name}-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: analytics
      });
    }

  } catch (error: any) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics',
      details: error.message
    });
  }
});

// Export feedback with date range filter
router.get('/export-feedback/:businessId', authenticate, async (req: any, res: any) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('client_id', req.user!.id)
      .single();

    if (businessError || !business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Get feedback data with QR code info
    let feedbackQuery = supabase
      .from('feedback')
      .select(`
        *,
        qr_codes(
          code,
          type,
          name
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (startDate) {
      feedbackQuery = feedbackQuery.gte('created_at', startDate as string);
    }
    if (endDate) {
      feedbackQuery = feedbackQuery.lte('created_at', endDate as string);
    }

    const { data: feedback, error: feedbackError } = await feedbackQuery;

    if (feedbackError) {
      throw feedbackError;
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Rating,Content,Additional Comments,Status,QR Code Name,QR Code,QR Type,Created At,Resolved At\n';
      const csvRows = feedback?.map((f: any) => [
        f.rating,
        `"${f.content.replace(/"/g, '""')}"`,
        `"${(f.additional_comments || '').replace(/"/g, '""')}"`,
        f.status,
        f.qr_codes?.name || '',
        f.qr_codes?.code || '',
        f.qr_codes?.type || '',
        f.created_at,
        f.resolved_at || ''
      ].join(',')) || [];

      const csvContent = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="feedback-${business.name}-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: feedback
      });
    }

  } catch (error: any) {
    console.error('Export feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback',
      details: error.message
    });
  }
});

export default router;

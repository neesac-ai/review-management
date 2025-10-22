import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../index';
import { QRCodeGenerationRequest } from '../../../shared/types';

class QRService {
  async generateQRCode(request: any): Promise<{ qrCodeId: string; qrCodeUrl: string; qrCodeDataUrl: string; qrCode: any }> {
    const { businessId, type, name, description, metadata, customLogo, colorScheme } = request;
    
    // Generate unique QR code ID
    const qrCodeId = uuidv4();
    
    // Generate QR code URL for frontend
    const qrCodeUrl = `${process.env.FRONTEND_URL}/review/${qrCodeId}`;
    
    // Create QR code data URL (image)
    const qrCodeDataUrl = await this.createQRCodeDataUrl(qrCodeUrl, customLogo, colorScheme);
    
    // Save QR code to database
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .insert({
        business_id: businessId,
        code: qrCodeId,
        type,
        name: name || `QR Code ${type}`,
        description: description || '',
        qr_image: qrCodeDataUrl,
        metadata: metadata || {}
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to save QR code: ${error.message}`);
    }

    return {
      qrCodeId,
      qrCodeUrl,
      qrCodeDataUrl,
      qrCode
    };
  }

  async getQRCodeInfo(qrCodeId: string): Promise<any> {
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        businesses!inner(
          id,
          name,
          description,
          logo_url,
          primary_color,
          secondary_color,
          google_place_id
        )
      `)
      .eq('code', qrCodeId)
      .single();

    if (error || !qrCode) {
      throw new Error('QR code not found');
    }

    return qrCode;
  }

  async incrementScanCount(qrCodeId: string): Promise<void> {
    // Get current scan count first
    const { data: qrCode, error: fetchError } = await supabase
      .from('qr_codes')
      .select('scan_count')
      .eq('code', qrCodeId)
      .single();

    if (fetchError || !qrCode) {
      console.error('Failed to fetch QR code:', fetchError);
      return;
    }

    // Increment and update
    const { error } = await supabase
      .from('qr_codes')
      .update({ scan_count: (qrCode.scan_count || 0) + 1 })
      .eq('code', qrCodeId);

    if (error) {
      console.error('Failed to increment scan count:', error);
    }
  }

  async getQRAnalytics(qrCodeId: string, businessId: string): Promise<any> {
    // Get QR code details
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', qrCodeId)
      .eq('business_id', businessId)
      .single();

    if (qrError || !qrCode) {
      throw new Error('QR code not found');
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('event_type, created_at')
      .eq('qr_code_id', qrCodeId);

    if (analyticsError) {
      throw new Error('Failed to get analytics data');
    }

    // Process analytics
    const events = analytics || [];
    const totalScans = events.filter(e => e.event_type === 'scan').length;
    const thumbsUp = events.filter(e => e.event_type === 'thumbs_up').length;
    const thumbsDown = events.filter(e => e.event_type === 'thumbs_down').length;
    const copies = events.filter(e => e.event_type === 'copy_review').length;

    const conversionRate = totalScans > 0 ? (copies / totalScans) * 100 : 0;

    return {
      qrCode,
      totalScans,
      thumbsUp,
      thumbsDown,
      copies,
      conversionRate,
      events: events.slice(-50) // Last 50 events
    };
  }

  async bulkGenerateQRCodes(businessId: string, count: number, type: 'transaction' = 'transaction'): Promise<{ qrCodes: any[]; csvData: string }> {
    const qrCodes = [];
    const csvRows = ['QR Code ID,QR Code URL,Transaction ID'];

    for (let i = 0; i < count; i++) {
      const qrCodeId = uuidv4();
      const transactionId = `TXN_${Date.now()}_${i}`;
      
      const qrCodeUrl = `${process.env.FRONTEND_URL}/review/${qrCodeId}`;
      
      // Save to database
      const { data: qrCode, error } = await supabase
        .from('qr_codes')
        .insert({
          business_id: businessId,
          code: qrCodeId,
          type,
          metadata: { transactionId }
        })
        .select('*')
        .single();

      if (error) {
        console.error(`Failed to create QR code ${i + 1}:`, error);
        continue;
      }

      qrCodes.push(qrCode);
      csvRows.push(`${qrCodeId},${qrCodeUrl},${transactionId}`);
    }

    const csvData = csvRows.join('\n');

    return { qrCodes, csvData };
  }

  private async createQRCodeDataUrl(url: string, customLogo?: string, colorScheme?: { primary: string; secondary: string }): Promise<string> {
    const options: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: colorScheme?.primary || '#2e9cca',
        light: colorScheme?.secondary || '#ffffff'
      },
      width: 300
    };
    
    try {
      const dataUrl = await QRCode.toDataURL(url, options);
      
      // If custom logo is provided, overlay it on the QR code
      if (customLogo) {
        return await this.addLogoToQRCode(dataUrl, customLogo);
      }
      
      return dataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  private async addLogoToQRCode(qrCodeDataUrl: string, logoUrl: string): Promise<string> {
    // This would require canvas manipulation
    // For now, return the basic QR code
    // TODO: Implement logo overlay functionality
    return qrCodeDataUrl;
  }

  async getBusinessQRCodes(businessId: string, userId: string): Promise<any[]> {
    // Verify business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('client_id', userId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    // Get QR codes for business
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get QR codes');
    }

    return qrCodes || [];
  }
}

export default new QRService();


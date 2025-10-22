/**
 * Get API URL - automatically works with both local and ngrok
 * 
 * When using ngrok with Next.js proxy:
 * - Returns empty string (uses relative URLs /api/...)
 * - Next.js proxy forwards to localhost:3001
 * - Works on both laptop and mobile!
 */
export function getAPIUrl(): string {
  // If we're in browser and using ngrok (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If accessing via ngrok, use relative URLs (proxy will handle it)
    if (hostname.includes('ngrok')) {
      return ''; // Use relative /api/... paths
    }
  }
  
  // Otherwise use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Build API endpoint URL
 */
export function apiUrl(endpoint: string): string {
  const baseUrl = getAPIUrl();
  
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If baseUrl is empty, return relative path
  if (!baseUrl) {
    return path;
  }
  
  // Otherwise return full URL
  return `${baseUrl}${path}`;
}


// Timezone utility functions

/**
 * Convert UTC timestamp to IST (Indian Standard Time)
 * IST is UTC+5:30
 */
export function convertToIST(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  
  return istDate.toISOString();
}

/**
 * Format IST timestamp for display
 */
export function formatISTTimestamp(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Get current IST timestamp
 */
export function getCurrentIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}


// Timezone utility functions for frontend

/**
 * Format UTC timestamp to IST for display
 */
export function formatToIST(utcTimestamp: string | Date): string {
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
 * Format date only in IST
 */
export function formatDateIST(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

/**
 * Format time only in IST
 */
export function formatTimeIST(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDateIST(date);
}


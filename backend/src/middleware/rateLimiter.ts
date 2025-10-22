import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// Rate limiter for general API calls
const generalRateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for QR code scans (more restrictive)
const qrScanLimiterInstance = new RateLimiterMemory({
  keyPrefix: 'qr_scan',
  points: 100, // 100 scans per IP per hour (more generous for testing)
  duration: 3600, // 1 hour
});

// Rate limiter for AI generation (expensive operations)
const aiGenerationLimiterInstance = new RateLimiterMemory({
  keyPrefix: 'ai_generation',
  points: 10, // 10 generations per hour
  duration: 3600, // 1 hour
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    await generalRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
    });
  }
};

export const qrScanRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    await qrScanLimiterInstance.consume(key);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'QR scan limit exceeded, please try again tomorrow',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
    });
  }
};

export const aiGenerationRateLimiter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const key = req.user?.id || req.ip || 'unknown';
    await aiGenerationLimiterInstance.consume(key);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      success: false,
      error: 'AI generation limit exceeded, please try again later',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
    });
  }
};




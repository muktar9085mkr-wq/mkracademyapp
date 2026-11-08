/**
 * MKR Academy - In-Memory Sliding Window Rate Limiter
 * Protects login, registration, payment, and sensitive endpoints against brute force and DDoS.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number; // e.g., 60 * 1000 for 1 minute
  maxRequests: number; // Maximum requests allowed per window
  message?: string;
  statusCode?: number;
  skipFailedRequests?: boolean;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests. Please wait a moment before trying again.',
    statusCode = 429
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically (every 2 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  // Ensure timer does not prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip'
    );

    const now = Date.now();
    let record = hits.get(clientIp);

    if (!record) {
      record = { timestamps: [] };
      hits.set(clientIp, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const currentCount = record.timestamps.length;

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1).toString());
    const resetTimeSeconds = Math.ceil((windowMs - (now - (record.timestamps[0] || now))) / 1000);
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds.toString());

    if (currentCount >= maxRequests) {
      res.setHeader('Retry-After', resetTimeSeconds.toString());
      res.status(statusCode).json({
        error: message,
        retryAfterSeconds: resetTimeSeconds,
        statusCode: 429
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured limiters for different endpoint sensitivities
export const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,
  message: 'General API request limit reached. Please try again shortly.'
});

export const createOrderLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Payment order creation rate limit reached. Please wait a minute before creating a new order.'
});

export const verifyPaymentLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many payment verification attempts. Please wait a minute.'
});

export const checkStatusLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
  message: 'Status check rate limit exceeded. Please wait a moment.'
});

export const adminApproveLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 15,
  message: 'Too many administrative approval actions in a short period. Please wait.'
});

export const downloadNoteLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Download request limit reached. Please wait a moment before downloading more notes.'
});

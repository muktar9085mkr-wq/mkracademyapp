/**
 * MKR Academy - Locked-Down CORS Middleware
 * Permits legitimate production origins and development hosts.
 * Rejects arbitrary external web domains.
 */

import { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGIN_PATTERNS = [
  // Production MKR Academy domains
  /^https?:\/\/(www\.)?mkracademy\.in$/,
  // Google AI Studio / Cloud Run preview domains
  /^https:\/\/[a-z0-9-]+\.run\.app$/,
  /^https:\/\/[a-z0-9-]+\.aistudio\.google\.com$/,
  /^https:\/\/aistudio\.google\.com$/,
  // Local development hosts
  /^http:\/\/localhost(:[0-9]+)?$/,
  /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  // Android WebView wrapper origins (e.g., custom capacitor/cordova or localhost)
  /^https?:\/\/localhost$/,
  /^null$/ // Android WebView local assets origin
];

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  // If no origin header is provided, it's a same-origin request or direct mobile call
  if (!origin) {
    next();
    return;
  }

  const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-razorpay-signature, x-cron-token, X-Requested-With, Accept'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  } else {
    // Explicitly reject unauthorized cross-origin requests
    if (req.method === 'OPTIONS') {
      res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
      return;
    }
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * MKR Academy - Production HTTP Security Headers & Transport Security (Improvement 18)
 * Configures Content-Security-Policy, HSTS, frame protection, and sniffing defense.
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  const proto = req.headers['x-forwarded-proto'];

  // 1. Enforce HTTPS in production
  if (isProd && proto && proto === 'http') {
    const secureUrl = `https://${req.headers.host}${req.url}`;
    res.redirect(301, secureUrl);
    return;
  }

  // 2. HTTP Strict Transport Security (HSTS)
  if (isProd || proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 3. MIME Sniffing Prevention
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. Clickjacking Protection
  // Use SAMEORIGIN by default; allows embedding in authorized AI Studio preview frames
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 5. Cross-Site Scripting (XSS) Legacy Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 6. Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 7. Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")');

  // 8. Content-Security-Policy (CSP) (Improvement 18)
  // Carefully configured to support:
  // - Razorpay Checkout gateway script & iframes
  // - Firebase Authentication & Cloud Firestore WebSocket streams
  // - Google Drive PDF embed previews
  // - Google Fonts & Images
  // - AI Studio preview iframe containers
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://apis.google.com https://*.firebaseio.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.razorpay.com https://lumberjack.razorpay.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com",
    "img-src 'self' data: blob: https://* http://*",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://drive.google.com https://*.run.app https://*.aistudio.google.com https://aistudio.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "media-src 'self' data: blob: https://*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
}

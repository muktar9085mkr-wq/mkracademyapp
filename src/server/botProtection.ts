/**
 * MKR Academy - CAPTCHA & Bot Protection Module (Improvement 11)
 * Combines zero-friction Honeypot traps, timestamp velocity checks,
 * and optional external reCAPTCHA/Turnstile verification.
 */

import { Request, Response, NextFunction } from 'express';

export interface BotProtectionOptions {
  allowEmptyHoneypotOnly?: boolean;
  minSubmissionTimeMs?: number; // Minimum time human takes to submit form
}

/**
 * Validates honeypot field and timestamp velocity
 */
export function botProtectionMiddleware(options: BotProtectionOptions = {}) {
  const {
    minSubmissionTimeMs = 600 // 600ms minimum threshold for human interaction
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // 1. Honeypot Trap check
    // Bots automatically populate every visible and hidden field in a form
    const honeypot = req.body?._mkr_hp_trap || req.body?.website_hp || req.body?.fax_hp;
    if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
      console.warn(`[BOT PROTECTION] Honeypot triggered by IP ${req.ip}. Trap value: "${honeypot}"`);
      res.status(400).json({
        error: 'Automated form submission rejected.',
        code: 'BOT_DETECTED'
      });
      return;
    }

    // 2. Submission Velocity / Timestamp check
    const clientTimestamp = Number(req.body?._mkr_form_ts);
    if (clientTimestamp && Number.isFinite(clientTimestamp)) {
      const durationMs = Date.now() - clientTimestamp;
      if (durationMs > 0 && durationMs < minSubmissionTimeMs) {
        console.warn(`[BOT PROTECTION] Submission velocity too fast (${durationMs}ms) from IP ${req.ip}`);
        res.status(400).json({
          error: 'Form submitted unnaturally fast. Please review your input and try again.',
          code: 'VELOCITY_REJECTED'
        });
        return;
      }
    }

    // 3. Optional Google reCAPTCHA v3 / Cloudflare Turnstile token verification
    const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (recaptchaSecret && captchaToken && typeof captchaToken === 'string') {
      // Async verify token with Google reCAPTCHA
      verifyRecaptchaToken(captchaToken, recaptchaSecret)
        .then((isValid) => {
          if (!isValid) {
            res.status(400).json({
              error: 'CAPTCHA verification failed. Please try again.',
              code: 'CAPTCHA_FAILED'
            });
            return;
          }
          next();
        })
        .catch((err) => {
          console.warn('reCAPTCHA verification error, failing open to avoid blocking student:', err);
          next();
        });
      return;
    }

    next();
  };
}

async function verifyRecaptchaToken(token: string, secret: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params
    });

    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success && (data.score === undefined || data.score >= 0.5));
  } catch (err) {
    console.error('Error contacting reCAPTCHA API:', err);
    return false;
  }
}

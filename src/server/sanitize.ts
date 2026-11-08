/**
 * MKR Academy - Input Sanitization & Validation Module
 * Defends against XSS, injection, buffer overflows, and malformed data.
 */

/**
 * Sanitizes generic text fields: strips HTML tags, script injection patterns, control characters,
 * trims leading/trailing whitespace, and enforces length boundaries.
 */
export function sanitizeText(input: any, maxLength = 250): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Strip null bytes and control characters (except newline and tab)
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Strip HTML / script tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  // Normalize whitespace and trim
  cleaned = cleaned.trim();
  // Enforce maximum length
  return cleaned.substring(0, maxLength);
}

/**
 * Validates and sanitizes alphanumeric IDs (e.g., Firestore document IDs, Razorpay IDs)
 */
export function sanitizeId(input: any, maxLength = 128): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  // Alphanumeric with hyphens and underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }
  return trimmed;
}

/**
 * Validates strictly 10-digit Indian mobile numbers starting with 6, 7, 8, or 9
 */
export function sanitizeIndianPhone(input: any): string | null {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

/**
 * Validates and sanitizes email addresses (RFC 5322 standard subset)
 */
export function sanitizeEmail(input: any): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > 150) return null;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Validates positive monetary amounts in paise (integers only)
 */
export function sanitizeAmountPaise(input: any): number | null {
  const num = Number(input);
  if (!Number.isInteger(num) || num <= 0 || num > 10000000) { // Up to ₹1,00,000
    return null;
  }
  return num;
}

/**
 * MKR Academy - Server-Side Firebase Authentication & Authorization Middleware
 * Verifies Firebase ID Tokens server-side, enforces RBAC, and prevents unauthorized requests.
 */

import { Request, Response, NextFunction } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, ADMIN_EMAIL } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface CachedTokenData {
  user: AuthenticatedUser;
  expiresAt: number;
}

// In-memory verification cache (5-minute TTL)
const tokenCache = new Map<string, CachedTokenData>();

/**
 * Server-side Firebase ID Token verification using Google Identity Toolkit API
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<AuthenticatedUser | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  const now = Date.now();
  const cached = tokenCache.get(idToken);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!apiKey) {
    console.error('Firebase API key missing on server for token verification');
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('Firebase token verification rejected by Google API:', response.status, err?.error?.message);
      return null;
    }

    const data = await response.json();
    const account = data.users?.[0];
    if (!account || !account.localId) {
      return null;
    }

    const verifiedUser: AuthenticatedUser = {
      uid: account.localId,
      email: account.email ? account.email.toLowerCase() : undefined,
      emailVerified: Boolean(account.emailVerified),
      displayName: account.displayName
    };

    // Cache valid token for 5 minutes (or until exp)
    tokenCache.set(idToken, {
      user: verifiedUser,
      expiresAt: now + 5 * 60 * 1000
    });

    return verifiedUser;
  } catch (error) {
    console.error('Network error during Firebase token verification:', error);
    return null;
  }
}

/**
 * Express middleware requiring any valid authenticated Firebase user
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Missing or malformed authorization header.',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseIdToken(token);

  if (!user) {
    res.status(401).json({
      error: 'Invalid, expired or revoked authentication token. Please sign in again.',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Optional authentication: attaches user to req.user if a valid token is provided
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = await verifyFirebaseIdToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

/**
 * Express middleware requiring confirmed Administrator privileges
 * Checks hardcoded superadmin email with email_verified, or admin record in Firestore
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Administrator authentication required.',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseIdToken(token);

  if (!user) {
    res.status(401).json({
      error: 'Invalid or expired administrator token.',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  // 1. Superadmin email check
  const isSuperadmin = (
    user.email &&
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  if (isSuperadmin) {
    req.user = user;
    next();
    return;
  }

  // 2. Authoritative database lookup in 'admins' collection
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) {
      req.user = user;
      next();
      return;
    }
  } catch (err) {
    console.warn('Error checking admin document in Firestore:', err);
  }

  res.status(403).json({
    error: 'Access denied: Administrator privileges required.',
    code: 'FORBIDDEN'
  });
}

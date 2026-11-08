/**
 * MKR Academy - Security Monitoring & Unusual Activity Detection (Audit Item 3)
 * Tracks anomalous security events, rate limit violations, honeypot hits,
 * signature tampering, and unauthorized admin endpoint probes.
 */

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SecurityAlert {
  id: string;
  type:
    | 'HONEYPOT_TRIGGERED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SIGNATURE_VERIFICATION_FAILED'
    | 'UNAUTHORIZED_ADMIN_ATTEMPT'
    | 'SUSPICIOUS_FILE_UPLOAD'
    | 'MALICIOUS_INPUT_BLOCKED'
    | 'IDOR_ACCESS_BLOCKED'
    | 'RAPID_FAILED_AUTH';
  severity: AlertSeverity;
  sourceIp: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// In-memory buffer of recent security alerts (keeps last 100 entries)
const recentAlerts: SecurityAlert[] = [];
const MAX_BUFFER_SIZE = 100;

export function recordSecurityAlert(
  type: SecurityAlert['type'],
  severity: AlertSeverity,
  sourceIp: string,
  details: string,
  metadata?: Record<string, any>
): SecurityAlert {
  const alert: SecurityAlert = {
    id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    severity,
    sourceIp: sourceIp || 'unknown',
    details,
    timestamp: new Date().toISOString(),
    metadata
  };

  recentAlerts.unshift(alert);
  if (recentAlerts.length > MAX_BUFFER_SIZE) {
    recentAlerts.pop();
  }

  const prefix = severity === 'CRITICAL' ? '🚨 [SECURITY CRITICAL]' : severity === 'WARNING' ? '⚠️ [SECURITY WARNING]' : 'ℹ️ [SECURITY INFO]';
  console.warn(`${prefix} ${type} from ${sourceIp}: ${details}`);

  return alert;
}

export function getRecentSecurityAlerts(limitCount: number = 50): SecurityAlert[] {
  return recentAlerts.slice(0, limitCount);
}

export function clearSecurityAlertsForTesting(): void {
  recentAlerts.length = 0;
}

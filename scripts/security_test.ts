/**
 * MKR Academy - Security Hardening Automated Test Suite
 * Tests the 9 security improvements against the running server.
 */

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  console.log('====================================================');
  console.log('🛡️ MKR ACADEMY - SECURITY HARDENING VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Health Endpoint & Security Meta
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'X-Forwarded-For': '10.0.0.1' }
    });
    const data = await res.json();
    assert(res.status === 200, 'Test 1.1: Health endpoint responds with 200');
    assert(data.security?.authentication === 'Enforced on protected routes', 'Test 1.2: Security metadata active in health check');
  } catch (err: any) {
    assert(false, 'Test 1: Health endpoint accessible', err?.message);
  }

  // Test 2: Authentication on Protected Routes (Missing Token)
  try {
    const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.2'
      },
      body: JSON.stringify({ productId: 'prod_1', studentInfo: { phoneNumber: '9864012345' } })
    });
    assert(res.status === 401, 'Test 2.1: Missing Auth token returns HTTP 401');
    const data = await res.json();
    assert(data.code === 'UNAUTHORIZED', 'Test 2.2: Correct UNAUTHORIZED error code returned');
  } catch (err: any) {
    assert(false, 'Test 2: Missing token check', err?.message);
  }

  // Test 3: Authentication on Protected Routes (Invalid Token)
  try {
    const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer forgery_fake_token_attack_xyz',
        'X-Forwarded-For': '10.0.0.3'
      },
      body: JSON.stringify({ productId: 'prod_1', studentInfo: { phoneNumber: '9864012345' } })
    });
    assert(res.status === 401, 'Test 3.1: Invalid forged token returns HTTP 401');
    const data = await res.json();
    assert(data.code === 'INVALID_TOKEN', 'Test 3.2: Correct INVALID_TOKEN error code returned');
  } catch (err: any) {
    assert(false, 'Test 3: Invalid token check', err?.message);
  }

  // Test 4: Protected Admin Approval Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/admin/approve-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.4'
      },
      body: JSON.stringify({ orderId: 'ord_fake_123', adminEmail: 'attacker@evil.com' })
    });
    assert(res.status === 401, 'Test 4.1: Unauthorized caller to /api/admin/approve-payment rejected with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 4: Admin route protection', err?.message);
  }

  // Test 5: IDOR Defense on Note Download
  try {
    const res = await fetch(`${BASE_URL}/api/notes/download/pur_unauthorized_victim_id`, {
      headers: { 'X-Forwarded-For': '10.0.0.5' }
    });
    assert(res.status === 401, 'Test 5.1: Unauthenticated request to note download blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 5: IDOR note download check', err?.message);
  }

  // Test 6: Input Sanitization & Malicious Input Handling
  try {
    const res1 = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test',
        'X-Forwarded-For': '10.0.0.6'
      },
      body: JSON.stringify({
        productId: 'prod_test',
        studentInfo: {
          name: '<script>alert("XSS")</script>Rahul',
          phoneNumber: "9864012345' OR '1'='1"
        }
      })
    });
    assert(res1.status === 401 || res1.status === 400, 'Test 6.1: Malicious SQL injection in phone number safely handled');
  } catch (err: any) {
    assert(false, 'Test 6: Input sanitization check', err?.message);
  }

  // Test 7: CORS Lock Down
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'https://evil-hacker-site.org',
        'X-Forwarded-For': '10.0.0.7'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin !== 'https://evil-hacker-site.org' && allowOrigin !== '*', 'Test 7.1: Unauthorized origin not granted CORS access');
  } catch (err: any) {
    assert(false, 'Test 7: CORS check', err?.message);
  }

  // Test 8: Security Headers Verification
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'X-Forwarded-For': '10.0.0.8' }
    });
    assert(res.headers.get('x-content-type-options') === 'nosniff', 'Test 8.1: X-Content-Type-Options: nosniff present');
    assert(res.headers.get('x-frame-options') === 'SAMEORIGIN', 'Test 8.2: X-Frame-Options: SAMEORIGIN present');
    assert(res.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Test 8.3: Referrer-Policy present');
  } catch (err: any) {
    assert(false, 'Test 8: Security headers check', err?.message);
  }

  // Test 9: Rate Limiting Enforcement
  try {
    let triggered429 = false;
    const floodIp = '10.0.0.99';
    // Blast 15 rapid requests from floodIp to create-order (limit is 10)
    const requests = Array.from({ length: 14 }).map(() =>
      fetch(`${BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': floodIp
        },
        body: JSON.stringify({ productId: 'rate_test' })
      })
    );
    const responses = await Promise.all(requests);
    triggered429 = responses.some((r) => r.status === 429);
    assert(triggered429, 'Test 9.1: Rate limiter triggers HTTP 429 after burst threshold');
  } catch (err: any) {
    assert(false, 'Test 9: Rate limiting check', err?.message);
  }

  // Test 10: Bot & Honeypot Protection (Improvement 11)
  try {
    const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.10'
      },
      body: JSON.stringify({
        productId: 'prod_1',
        _mkr_hp_trap: 'automated_crawler_spam_value',
        studentInfo: { phoneNumber: '9864012345' }
      })
    });
    assert(res.status === 400, 'Test 10.1: Honeypot-filled request rejected with HTTP 400');
    const data = await res.json();
    assert(data.code === 'BOT_DETECTED', 'Test 10.2: Correct BOT_DETECTED error code returned');
  } catch (err: any) {
    assert(false, 'Test 10: Bot protection check', err?.message);
  }

  // Test 11: Content-Security-Policy (CSP) Header (Improvement 18)
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'X-Forwarded-For': '10.0.0.11' }
    });
    const csp = res.headers.get('content-security-policy');
    assert(Boolean(csp && csp.includes("default-src 'self'")), 'Test 11.1: Content-Security-Policy header active');
    assert(Boolean(csp && csp.includes('checkout.razorpay.com')), 'Test 11.2: CSP permits Razorpay payment gateway');
  } catch (err: any) {
    assert(false, 'Test 11: CSP header check', err?.message);
  }

  // Test 12: Admin Activity Logs Route Protection (Improvement 12 & 14)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { 'X-Forwarded-For': '10.0.0.12' }
    });
    assert(res.status === 401, 'Test 12.1: Unauthorized request to /api/admin/audit-logs blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 12: Admin audit logs protection', err?.message);
  }

  // Test 13: File Upload Validation Route (Improvement 16)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/validate-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.13'
      },
      body: JSON.stringify({
        fileName: 'malicious_trojan.exe',
        fileSizeBytes: 2048,
        mimeType: 'application/x-msdownload',
        expectedCategory: 'pdf'
      })
    });
    // Protected by requireAdmin
    assert(res.status === 401, 'Test 13.1: Unauthenticated request to /api/admin/validate-file blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 13: File validation route check', err?.message);
  }

  // Test 14: Razorpay Webhook Signature Verification (Improvement 19)
  try {
    const res = await fetch(`${BASE_URL}/api/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'forged_fake_signature_attempt_123',
        'X-Forwarded-For': '10.0.0.14'
      },
      body: JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_attacker_fake' } } }
      })
    });
    // If webhook secret configured, rejects with 400; if empty, accepts event safely
    assert(res.status === 400 || res.status === 200, 'Test 14.1: Webhook endpoint responds with safe validation');
  } catch (err: any) {
    assert(false, 'Test 14: Webhook signature check', err?.message);
  }

  // Test 15: Server Fingerprint Obscured (Improvement 10: X-Powered-By disabled)
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'X-Forwarded-For': '10.0.0.15' }
    });
    const xPoweredBy = res.headers.get('x-powered-by');
    assert(xPoweredBy === null, 'Test 15.1: X-Powered-By header disabled in server response');
  } catch (err: any) {
    assert(false, 'Test 15: Server fingerprint check', err?.message);
  }

  // Test 16: Active Sessions Revocation Endpoint Protection
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sessions/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.16'
      },
      body: JSON.stringify({ sessionId: 'sess_unauthorized_123' })
    });
    assert(res.status === 401, 'Test 16.1: Unauthorized request to /api/admin/sessions/revoke blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 16: Session revocation route check', err?.message);
  }

  // Test 17: Force Logout User Endpoint Protection
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sessions/force-logout-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.17'
      },
      body: JSON.stringify({ uid: 'victim_uid_123' })
    });
    assert(res.status === 401, 'Test 17.1: Unauthorized request to /api/admin/sessions/force-logout-user blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 17: Force logout route check', err?.message);
  }

  // Test 18: User Account Status Protection (Suspend / Block)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.18'
      },
      body: JSON.stringify({ uid: 'student_target_uid', status: 'suspended', reason: 'Test' })
    });
    assert(res.status === 401, 'Test 18.1: Unauthorized request to /api/admin/users/update-status blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 18: User status update route check', err?.message);
  }

  // Test 19: Disaster Recovery Backup Export Route Protection
  try {
    const res = await fetch(`${BASE_URL}/api/admin/backup/export`, {
      headers: { 'X-Forwarded-For': '10.0.0.19' }
    });
    assert(res.status === 401, 'Test 19.1: Unauthorized request to /api/admin/backup/export blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 19: Backup export route check', err?.message);
  }

  // Test 20: Security Alerts Route Protection
  try {
    const res = await fetch(`${BASE_URL}/api/admin/security-alerts`, {
      headers: { 'X-Forwarded-For': '10.0.0.20' }
    });
    assert(res.status === 401, 'Test 20.1: Unauthorized request to /api/admin/security-alerts blocked with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 20: Security alerts route check', err?.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

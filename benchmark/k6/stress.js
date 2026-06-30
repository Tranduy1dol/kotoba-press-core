// =============================================================================
// Stress Test — kotoba-press-core
// =============================================================================
// Ramps virtual users from 0 → 50 → 200 → 0 to find the breaking point
// of the authenticated API endpoints.
//
// Usage:
//   k6 run benchmark/k6/stress.js
//   k6 run -e JWT_SECRET=my-secret -e BASE_URL=http://host:port benchmark/k6/stress.js
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:8080';
const JWT_SECRET = __ENV.JWT_SECRET || 'bench-secret-key-for-ci-testing';

// Seeded word IDs (ObjectId-like hex strings)
const WORD_IDS = [
  '000000000000000000000001',
  '000000000000000000000002',
  '000000000000000000000003',
  '000000000000000000000004',
  '000000000000000000000005',
];

// ---------------------------------------------------------------------------
// k6 Options
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up to 50 VUs
    { duration: '1m',  target: 50 },   // hold at 50 VUs
    { duration: '30s', target: 200 },  // ramp up to 200 VUs
    { duration: '1m',  target: 200 },  // hold at 200 VUs
    { duration: '30s', target: 0 },    // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95th percentile < 1s
    http_req_failed: ['rate<0.05'],    // error rate < 5%
  },
};

// ---------------------------------------------------------------------------
// JWT Helpers
// ---------------------------------------------------------------------------

/**
 * Base64url-encode a string (no padding, URL-safe alphabet).
 */
function base64urlEncode(str) {
  return encoding.b64encode(str, 'rawurl');
}

/**
 * Build a HS256-signed JWT from a claims object.
 */
function buildJWT(claims, secret) {
  const header  = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify(claims);

  const encodedHeader  = base64urlEncode(header);
  const encodedPayload = base64urlEncode(payload);

  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // HMAC-SHA256, output as base64 raw-url (no padding, URL-safe alphabet)
  const signature = crypto.hmac('sha256', secret, signingInput, 'base64rawurl');

  return `${signingInput}.${signature}`;
}

// ---------------------------------------------------------------------------
// Setup — runs once, returns data shared across VUs
// ---------------------------------------------------------------------------
export function setup() {
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    user_id: 'bench-user-id',
    role: 'user',
    exp: now + 86400, // 24 hours from now
    iat: now,
  };

  const token = buildJWT(claims, JWT_SECRET);

  // Sanity check: make sure the server is up before stressing it
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'setup: server is reachable': (r) => r.status === 200,
  });

  return { token };
}

// ---------------------------------------------------------------------------
// Default (VU) Function
// ---------------------------------------------------------------------------
export default function (data) {
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Distribute requests across three endpoint groups with equal probability
  const roll = Math.random();

  if (roll < 1 / 3) {
    // ---- GET /api/v1/words/:id ----
    const wordId = WORD_IDS[Math.floor(Math.random() * WORD_IDS.length)];
    const res = http.get(`${BASE_URL}/api/v1/words/${wordId}`, Object.assign(
      { tags: { name: 'GET /api/v1/words/:id' } },
      authHeaders,
    ));

    check(res, {
      'words/:id — status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'words/:id — not a server error': (r) => r.status < 500,
    });
  } else if (roll < 2 / 3) {
    // ---- GET /api/v1/grammar ----
    const res = http.get(`${BASE_URL}/api/v1/grammar`, Object.assign(
      { tags: { name: 'GET /api/v1/grammar' } },
      authHeaders,
    ));

    check(res, {
      'grammar — status is 200': (r) => r.status === 200,
      'grammar — not a server error': (r) => r.status < 500,
    });
  } else {
    // ---- GET /api/v1/words/search?q=食べる ----
    const res = http.get(`${BASE_URL}/api/v1/words/search?q=${encodeURIComponent('食べる')}`, Object.assign(
      { tags: { name: 'GET /api/v1/words/search' } },
      authHeaders,
    ));

    check(res, {
      'search — status is 200': (r) => r.status === 200,
      'search — not a server error': (r) => r.status < 500,
    });
  }

  // Slightly longer pause for stress tests to avoid purely synthetic spikes
  sleep(0.3);
}

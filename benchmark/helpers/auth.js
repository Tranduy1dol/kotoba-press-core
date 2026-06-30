import crypto from 'k6/crypto';
import encoding from 'k6/encoding';
import { check } from 'k6';
import http from 'k6/http';

/**
 * Base64url-encode a string (no padding).
 */
function base64urlEncode(str) {
  return encoding.b64encode(str, 'rawurl');
}

/**
 * Build a HS256-signed JWT from a claims object.
 */
export function buildJWT(claims, secret) {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify(claims);

  const encodedHeader = base64urlEncode(header);
  const encodedPayload = base64urlEncode(payload);

  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // HMAC-SHA256, output as base64 raw-url (no padding, URL-safe alphabet)
  const signature = crypto.hmac('sha256', secret, signingInput, 'base64rawurl');

  return `${signingInput}.${signature}`;
}

/**
 * Generate a JWT token for benchmarking.
 * @param {string} secret - The JWT secret key.
 * @param {string} userId - The simulated user ID.
 * @returns {string} The generated JWT token.
 */
export function generateAuthToken(secret, userId = 'bench-user-id') {
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    user_id: userId,
    role: 'user',
    exp: now + 86400, // 24 hours from now
    iat: now,
  };

  return buildJWT(claims, secret);
}

/**
 * Returns common HTTP headers for authenticated requests.
 * @param {string} token - The JWT token.
 * @returns {object} The headers object.
 */
export function getAuthHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Basic health check that aborts if the server is unreachable.
 * Usually called during the `setup()` function.
 * @param {string} baseUrl - The base URL of the API.
 */
export function checkServerReachability(baseUrl) {
  const res = http.get(`${baseUrl}/health`);
  const isHealthy = check(res, {
    'setup: server is reachable': (r) => r.status === 200,
  });

  if (!isHealthy) {
    throw new Error(`API is unreachable at ${baseUrl}/health. Setup aborted.`);
  }
}

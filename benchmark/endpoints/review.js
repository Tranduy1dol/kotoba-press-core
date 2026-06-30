import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JWT_SECRET, defaultThresholds, getRandomSrsId } from '../helpers/config.js';
import { customMetrics, recordMetrics } from '../helpers/metrics.js';
import { generateAuthToken, getAuthHeaders, checkServerReachability } from '../helpers/auth.js';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: defaultThresholds,
};

export function setup() {
  checkServerReachability(BASE_URL);
  const token = generateAuthToken(JWT_SECRET, 'review-tester');
  return { token };
}

export default function (data) {
  const authHeaders = getAuthHeaders(data.token);
  
  const roll = Math.random();
  let res;
  let success;

  if (roll < 0.4) {
    // Get due reviews
    res = http.get(`${BASE_URL}/api/v1/srs/due`, Object.assign(
      { tags: { name: 'GET /api/v1/srs/due' } },
      authHeaders
    ));
    success = check(res, {
      'due reviews status is 200': (r) => r.status === 200,
    });
  } else if (roll < 0.8) {
    // Submit review
    const srsId = getRandomSrsId();
    const payload = JSON.stringify({
      score: Math.floor(Math.random() * 5), // Random score 0-4
    });
    res = http.post(`${BASE_URL}/api/v1/srs/review/${srsId}`, payload, Object.assign(
      { tags: { name: 'POST /api/v1/srs/review/:id' } },
      authHeaders
    ));
    success = check(res, {
      'submit review status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  } else {
    // Get due count
    res = http.get(`${BASE_URL}/api/v1/srs/due/count`, Object.assign(
      { tags: { name: 'GET /api/v1/srs/due/count' } },
      authHeaders
    ));
    success = check(res, {
      'due count status is 200': (r) => r.status === 200,
    });
  }

  recordMetrics(res, customMetrics.reviewDuration, success);
}

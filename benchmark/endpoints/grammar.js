import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JWT_SECRET, defaultThresholds, getRandomGrammarId } from '../helpers/config.js';
import { customMetrics, recordMetrics } from '../helpers/metrics.js';
import { generateAuthToken, getAuthHeaders, checkServerReachability } from '../helpers/auth.js';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: defaultThresholds,
};

export function setup() {
  checkServerReachability(BASE_URL);
  const token = generateAuthToken(JWT_SECRET, 'grammar-tester');
  return { token };
}

export default function (data) {
  const authHeaders = getAuthHeaders(data.token);
  
  const roll = Math.random();
  let res;
  let success;

  if (roll < 0.5) {
    // List grammar
    res = http.get(`${BASE_URL}/api/v1/grammar`, Object.assign(
      { tags: { name: 'GET /api/v1/grammar' } },
      authHeaders
    ));
    success = check(res, {
      'list grammar status is 200': (r) => r.status === 200,
    });
  } else {
    // Get specific grammar
    const id = getRandomGrammarId();
    res = http.get(`${BASE_URL}/api/v1/grammar/${id}`, Object.assign(
      { tags: { name: 'GET /api/v1/grammar/:id' } },
      authHeaders
    ));
    success = check(res, {
      'grammar by id status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  }

  recordMetrics(res, customMetrics.grammarDuration, success);
}

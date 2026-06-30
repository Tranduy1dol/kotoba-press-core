import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JWT_SECRET, defaultThresholds, getRandomWordId } from '../helpers/config.js';
import { customMetrics, recordMetrics } from '../helpers/metrics.js';
import { generateAuthToken, getAuthHeaders, checkServerReachability } from '../helpers/auth.js';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: defaultThresholds,
};

export function setup() {
  checkServerReachability(BASE_URL);
  const token = generateAuthToken(JWT_SECRET, 'vocab-tester');
  return { token };
}

export default function (data) {
  const authHeaders = getAuthHeaders(data.token);
  
  // Randomly pick a vocabulary endpoint to test
  const roll = Math.random();
  let res;
  let success;

  if (roll < 0.33) {
    // 1. Search words
    const query = encodeURIComponent('食べる');
    res = http.get(`${BASE_URL}/api/v1/words/search?q=${query}`, Object.assign(
      { tags: { name: 'GET /api/v1/words/search' } },
      authHeaders
    ));
    success = check(res, {
      'search status is 200': (r) => r.status === 200,
    });
  } else if (roll < 0.66) {
    // 2. Browse by JLPT level
    const level = 5; // N5
    res = http.get(`${BASE_URL}/api/v1/words/jlpt/${level}`, Object.assign(
      { tags: { name: 'GET /api/v1/words/jlpt/:level' } },
      authHeaders
    ));
    success = check(res, {
      'jlpt status is 200': (r) => r.status === 200,
    });
  } else {
    // 3. Get word by ID
    const wordId = getRandomWordId();
    res = http.get(`${BASE_URL}/api/v1/words/${wordId}`, Object.assign(
      { tags: { name: 'GET /api/v1/words/:id' } },
      authHeaders
    ));
    success = check(res, {
      'word status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  }

  recordMetrics(res, customMetrics.vocabularyDuration, success);
}

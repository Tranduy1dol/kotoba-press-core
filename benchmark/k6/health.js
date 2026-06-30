// =============================================================================
// Health Endpoint Benchmark — kotoba-press-core
// =============================================================================
// Benchmarks the unauthenticated /health endpoint.
//
// Usage:
//   k6 run benchmark/k6/health.js                          # default: load scenario
//   k6 run -e K6_SCENARIO=smoke benchmark/k6/health.js     # smoke test
//   k6 run -e BASE_URL=http://host:port benchmark/k6/health.js
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const SCENARIO = __ENV.K6_SCENARIO || 'load';

const scenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 5,
    duration: '10s',
    tags: { scenario: 'smoke' },
  },
  load: {
    executor: 'constant-vus',
    vus: 50,
    duration: '30s',
    tags: { scenario: 'load' },
  },
};

// Validate the chosen scenario
if (!scenarios[SCENARIO]) {
  throw new Error(
    `Unknown K6_SCENARIO "${SCENARIO}". Valid values: ${Object.keys(scenarios).join(', ')}`,
  );
}

// ---------------------------------------------------------------------------
// k6 Options
// ---------------------------------------------------------------------------
export const options = {
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO],
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95th percentile < 200ms
    http_req_failed: ['rate<0.01'],   // error rate < 1%
  },
};

// ---------------------------------------------------------------------------
// Default (VU) Function
// ---------------------------------------------------------------------------
export default function () {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { name: 'health' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body contains status ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok';
      } catch (_) {
        return false;
      }
    },
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Small pause between iterations to avoid pure tight-loop hammering
  sleep(0.1);
}

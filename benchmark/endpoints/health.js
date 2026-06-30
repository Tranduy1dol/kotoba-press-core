import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultThresholds } from '../helpers/config.js';
import { customMetrics, recordMetrics } from '../helpers/metrics.js';

export const options = {
  vus: 10,
  duration: '10s',
  thresholds: defaultThresholds,
};

export default function () {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { name: 'GET /health' }
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  recordMetrics(res, customMetrics.healthDuration, success);

  sleep(1);
}

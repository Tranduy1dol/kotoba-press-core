export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const JWT_SECRET = __ENV.JWT_SECRET || 'bench-secret-key-for-ci-testing';

// Common Thresholds to reuse across scripts
export const defaultThresholds = {
  http_req_duration: ['p(95)<500'], // 95th percentile < 500ms
  http_req_failed: ['rate<0.01'],   // error rate < 1%
};

// Seeded IDs (similar to the old benchmarks)
export const WORD_IDS = [
  '000000000000000000000001',
  '000000000000000000000002',
  '000000000000000000000003',
  '000000000000000000000004',
  '000000000000000000000005',
];

export const SRS_IDS = [
  '000000000000000000000001',
  '000000000000000000000002',
];

export const GRAMMAR_IDS = [
  '000000000000000000000001',
];

export function getRandomWordId() {
  return WORD_IDS[Math.floor(Math.random() * WORD_IDS.length)];
}

export function getRandomSrsId() {
  return SRS_IDS[Math.floor(Math.random() * SRS_IDS.length)];
}

export function getRandomGrammarId() {
  return GRAMMAR_IDS[Math.floor(Math.random() * GRAMMAR_IDS.length)];
}

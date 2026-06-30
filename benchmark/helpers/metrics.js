import { Trend, Counter } from 'k6/metrics';

// Custom metrics to track specific operations
export const customMetrics = {
  healthDuration: new Trend('health_duration'),
  vocabularyDuration: new Trend('vocabulary_duration'),
  grammarDuration: new Trend('grammar_duration'),
  reviewDuration: new Trend('review_duration'),
  
  apiErrors: new Counter('api_errors'),
};

/**
 * Helper to record duration and errors based on response
 */
export function recordMetrics(res, durationMetric, checkResult) {
  if (durationMetric) {
    durationMetric.add(res.timings.duration);
  }
  if (!checkResult) {
    customMetrics.apiErrors.add(1);
  }
}

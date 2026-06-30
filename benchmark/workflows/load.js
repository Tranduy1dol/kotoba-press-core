import { setupScenario, runScenario } from './scenario.js';
import { defaultThresholds } from '../helpers/config.js';

export const options = {
  // Load test: measure performance under normal expected production load
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 for 2 mins
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 for 2 mins
    { duration: '30s', target: 200 }, // Ramp up to 200 users
    { duration: '2m', target: 200 },  // Stay at 200 for 2 mins
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: defaultThresholds,
};

export function setup() {
  return setupScenario();
}

export default function (data) {
  runScenario(data);
}

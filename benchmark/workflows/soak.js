import { setupScenario, runScenario } from './scenario.js';

export const options = {
  // Soak test: detect memory leaks and resource exhaustion over time
  stages: [
    { duration: '5m', target: 100 }, // Ramp up to 100 VUs
    { duration: '50m', target: 100 }, // Hold for 50 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0
  ],
};

export function setup() {
  return setupScenario();
}

export default function (data) {
  runScenario(data);
}

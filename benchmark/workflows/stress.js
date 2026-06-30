import { setupScenario, runScenario } from './scenario.js';

export const options = {
  // Stress test: determine maximum capacity and saturation point
  stages: [
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 400 },
    { duration: '1m', target: 800 },
    { duration: '2m', target: 1200 }, // Hold at peak
    { duration: '1m', target: 0 },    // Scale down
  ],
  // No strict thresholds for stress test since we expect it to eventually fail/degrade
};

export function setup() {
  return setupScenario();
}

export default function (data) {
  runScenario(data);
}

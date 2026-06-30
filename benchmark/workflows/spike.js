import { setupScenario, runScenario } from './scenario.js';

export const options = {
  // Spike test: simulate sudden burst of traffic
  stages: [
    { duration: '10s', target: 0 },   // Start from 0
    { duration: '10s', target: 500 }, // Spike to 500 VUs in 10s
    { duration: '1m', target: 500 },  // Hold for 1 minute
    { duration: '10s', target: 0 },   // Scale back to 0
  ],
};

export function setup() {
  return setupScenario();
}

export default function (data) {
  runScenario(data);
}

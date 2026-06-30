import { setupScenario, runScenario } from './scenario.js';
import { defaultThresholds } from '../helpers/config.js';

export const options = {
  // Empty options allows overriding via CLI (e.g. k6 run -u 50 -d 30s)
  thresholds: defaultThresholds,
};

export function setup() {
  return setupScenario();
}

export default function (data) {
  runScenario(data);
}

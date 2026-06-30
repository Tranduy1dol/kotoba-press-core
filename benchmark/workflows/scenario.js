import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JWT_SECRET, getRandomWordId, getRandomSrsId } from '../helpers/config.js';
import { generateAuthToken, getAuthHeaders, checkServerReachability } from '../helpers/auth.js';

export function setupScenario() {
  checkServerReachability(BASE_URL);
  const token = generateAuthToken(JWT_SECRET, 'realistic-user');
  return { token };
}

export function runScenario(data) {
  const authHeaders = getAuthHeaders(data.token);
  
  // Decide whether this iteration is an anonymous user or authenticated learner
  const roll = Math.random();
  
  if (roll < 0.3) {
    // 30% Anonymous User Workflow
    
    // 1. Check health
    http.get(`${BASE_URL}/health`, { tags: { name: 'Workflow: Anon /health' } });
    sleep(1);
    
    // 2. Fetch vocabulary
    http.get(`${BASE_URL}/api/v1/words/jlpt/5`, { tags: { name: 'Workflow: Anon /api/v1/words/jlpt/5' } });
    sleep(1);
    
    // 3. Search vocabulary
    const query = encodeURIComponent('食べる');
    http.get(`${BASE_URL}/api/v1/words/search?q=${query}`, { tags: { name: 'Workflow: Anon search' } });
    sleep(1);
    
    // 4. Fetch grammar
    http.get(`${BASE_URL}/api/v1/grammar`, { tags: { name: 'Workflow: Anon /api/v1/grammar' } });
    
  } else {
    // 70% Authenticated Learner Workflow
    
    // 1. Fetch today's reviews
    const dueRes = http.get(`${BASE_URL}/api/v1/srs/due`, Object.assign(
      { tags: { name: 'Workflow: Auth /api/v1/srs/due' } },
      authHeaders
    ));
    sleep(1);
    
    // 2. Search vocabulary (user looking up a word)
    const query = encodeURIComponent('走る');
    http.get(`${BASE_URL}/api/v1/words/search?q=${query}`, Object.assign(
      { tags: { name: 'Workflow: Auth search' } },
      authHeaders
    ));
    sleep(1);
    
    // 3. Submit one review
    const srsId = getRandomSrsId();
    const payload = JSON.stringify({ score: 3 });
    http.post(`${BASE_URL}/api/v1/srs/review/${srsId}`, payload, Object.assign(
      { tags: { name: 'Workflow: Auth submit review' } },
      authHeaders
    ));
    sleep(1);
    
    // 4. Fetch progress (due count)
    http.get(`${BASE_URL}/api/v1/srs/due/count`, Object.assign(
      { tags: { name: 'Workflow: Auth /api/v1/srs/due/count' } },
      authHeaders
    ));
    sleep(1);
    
    // 5. Fetch next vocabulary (new words)
    http.get(`${BASE_URL}/api/v1/srs/new/5`, Object.assign(
      { tags: { name: 'Workflow: Auth /api/v1/srs/new/5' } },
      authHeaders
    ));
  }

  // End of workflow think time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

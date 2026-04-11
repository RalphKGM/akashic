import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAiRetryDelayMs,
  isRetryableAiError,
  normalizeAiRequestError,
} from '../utils/aiRequest.js';

test('getAiRetryDelayMs applies exponential backoff', () => {
  assert.equal(getAiRetryDelayMs(0, 750), 750);
  assert.equal(getAiRetryDelayMs(1, 750), 1500);
  assert.equal(getAiRetryDelayMs(2, 750), 3000);
});

test('isRetryableAiError accepts retryable status codes and aborts', () => {
  assert.equal(isRetryableAiError({ status: 429 }), true);
  assert.equal(isRetryableAiError({ status: 503 }), true);
  assert.equal(isRetryableAiError({ name: 'AbortError' }), true);
  assert.equal(isRetryableAiError({ name: 'TypeError' }), true);
  assert.equal(isRetryableAiError({ status: 400 }), false);
});

test('normalizeAiRequestError converts aborts into timeout errors', () => {
  const normalized = normalizeAiRequestError({ name: 'AbortError' }, 30000);

  assert.equal(normalized.message, 'GitHub Models request timed out after 30000ms');
  assert.equal(normalized.status, 504);
  assert.equal(normalized.code, 'AI_REQUEST_TIMEOUT');
});

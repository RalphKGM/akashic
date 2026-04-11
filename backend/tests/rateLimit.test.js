import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimit } from '../middleware/rateLimit.js';

const createMockResponse = () => {
  const headers = {};

  return {
    statusCode: 200,
    body: null,
    headers,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

test('rate limiter blocks requests after the configured limit', () => {
  const middleware = createRateLimit({
    bucket: 'test-rate-limit',
    maxRequests: 2,
    windowMs: 10_000,
  });

  const req = {
    headers: {
      authorization: 'Bearer test-token',
    },
    ip: '127.0.0.1',
  };

  const firstRes = createMockResponse();
  let firstNextCalled = false;
  middleware(req, firstRes, () => {
    firstNextCalled = true;
  });
  assert.equal(firstNextCalled, true);

  const secondRes = createMockResponse();
  let secondNextCalled = false;
  middleware(req, secondRes, () => {
    secondNextCalled = true;
  });
  assert.equal(secondNextCalled, true);

  const blockedRes = createMockResponse();
  let blockedNextCalled = false;
  middleware(req, blockedRes, () => {
    blockedNextCalled = true;
  });

  assert.equal(blockedNextCalled, false);
  assert.equal(blockedRes.statusCode, 429);
  assert.equal(blockedRes.body.code, 'RATE_LIMITED');
});

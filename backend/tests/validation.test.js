import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureArray,
  ensureNonEmptyString,
  ensureUuid,
  isUuid,
} from '../utils/validation.js';

test('isUuid recognizes UUID values', () => {
  assert.equal(isUuid('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isUuid('not-a-uuid'), false);
});

test('ensureUuid throws on invalid ids', () => {
  assert.throws(() => ensureUuid('abc', 'Photo ID'), /Photo ID must be a valid UUID/);
});

test('ensureNonEmptyString trims and returns content', () => {
  assert.equal(ensureNonEmptyString('  hello ', 'Name'), 'hello');
  assert.throws(() => ensureNonEmptyString('   ', 'Name'), /Name is required/);
});

test('ensureArray only accepts arrays', () => {
  assert.deepEqual(ensureArray([1, 2], 'photoIds'), [1, 2]);
  assert.throws(() => ensureArray('x', 'photoIds'), /photoIds must be an array/);
});

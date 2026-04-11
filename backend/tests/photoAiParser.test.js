import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSection,
  normalizeCategory,
  parsePhotoDescription,
} from '../utils/photoAiParser.js';

test('extractSection returns trimmed section content', () => {
  const content = `
[LITERAL]
literal text

[DESCRIPTIVE]
descriptive text
`;

  assert.equal(extractSection(content, 'LITERAL', ['DESCRIPTIVE']), 'literal text');
  assert.equal(extractSection(content, 'DESCRIPTIVE', []), 'descriptive text');
});

test('normalizeCategory reduces multi-value output to a supported single category', () => {
  assert.equal(normalizeCategory('people, travel'), 'people');
  assert.equal(normalizeCategory('none'), null);
  assert.equal(normalizeCategory('animals'), 'animals');
});

test('parsePhotoDescription extracts all supported fields', () => {
  const content = `
[LITERAL]
A dog sits by a gate.

[DESCRIPTIVE]
The photo feels like a casual afternoon at home.

[TAGS]
dog, gate, outdoor

[CATEGORY]
animals
`;

  assert.deepEqual(parsePhotoDescription(content), {
    literal: 'A dog sits by a gate.',
    descriptive: 'The photo feels like a casual afternoon at home.',
    tags: 'dog, gate, outdoor',
    category: 'animals',
  });
});

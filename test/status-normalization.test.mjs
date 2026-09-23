import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeStatus, normalizeStatusLabel } from '../src/web/utils/status.js';

test('normalizeStatus handles mixed status values consistently', () => {
  assert.equal(normalizeStatus('berjalan'), 'Ongoing');
  assert.equal(normalizeStatus('ongoing'), 'Ongoing');
  assert.equal(normalizeStatus('publishing'), 'Ongoing');
  assert.equal(normalizeStatus('tamat'), 'Completed');
  assert.equal(normalizeStatus('completed'), 'Completed');
  assert.equal(normalizeStatus('finished'), 'Completed');
  assert.equal(normalizeStatus('hiatus'), 'Hiatus');
  assert.equal(normalizeStatus('on hold'), 'Hiatus');
  assert.equal(normalizeStatus('cancelled'), 'Cancelled');
  assert.equal(normalizeStatus('dropped'), 'Cancelled');
  assert.equal(normalizeStatus(''), 'Unknown');
  assert.equal(normalizeStatus(undefined), 'Unknown');
});

test('normalizeStatusLabel maps canonical state to display label', () => {
  assert.equal(normalizeStatusLabel('Ongoing'), 'Ongoing');
  assert.equal(normalizeStatusLabel('Completed'), 'Completed');
  assert.equal(normalizeStatusLabel('Hiatus'), 'Hiatus');
  assert.equal(normalizeStatusLabel('Cancelled'), 'Cancelled');
  assert.equal(normalizeStatusLabel('Unknown'), 'Unknown');
  assert.equal(normalizeStatusLabel('berjalan'), 'Ongoing');
});

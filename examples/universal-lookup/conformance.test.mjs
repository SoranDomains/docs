import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scValToNative, xdr } from '@stellar/stellar-sdk';
import { decodeDestinationXdr, nativeJson, normalizeName } from './decode.mjs';
import { decodeNameStatusXdr, decodeBatchNamesXdr } from './decode-reads.mjs';

const readVectors = JSON.parse(readFileSync(new URL('../../reference/vectors/lookup-read-extensions-v1.json', import.meta.url)));
function decodeRead(entry) {
  return entry.type === 'NameStatus'
    ? decodeNameStatusXdr(entry.xdrBase64, entry.expectedName)
    : decodeBatchNamesXdr(entry.xdrBase64, entry.expectedCount);
}
for (const entry of readVectors.valid) test(`read extension: ${entry.id}`, () => {
  assert.deepEqual(nativeJson(decodeRead(entry)), entry.expectedNative);
});
for (const entry of readVectors.invalid) test(`reject malformed read: ${entry.id}`, () => {
  assert.throws(() => decodeRead(entry));
});

const vectors = JSON.parse(readFileSync(new URL('../../reference/vectors/lookup-returns-v1.json', import.meta.url)));
for (const entry of vectors.valid) test(`raw SDK decoding: ${entry.id}`, () => {
  const value = xdr.ScVal.fromXDR(entry.xdrBase64, 'base64');
  assert.deepEqual(nativeJson(scValToNative(value)), entry.expectedNative);
  if (entry.returnType === 'PaymentDestination') assert.deepEqual(nativeJson(decodeDestinationXdr(entry.xdrBase64)), entry.expectedNative);
});
for (const entry of vectors.invalid) test(`reject malformed destination: ${entry.id}`, () => {
  assert.throws(() => decodeDestinationXdr(entry.xdrBase64));
});
for (const input of [' Alice.Nova ', '\tAlice.Nova\n', 'alice.nova', 'a-b.nova']) test(`normalize ${JSON.stringify(input)}`, () => {
  assert.equal(normalizeName(input), input.trim().toLowerCase());
});
for (const input of ['alice', 'a..nova', 'a.nova.extra', '-alice.nova', 'alice-.nova', 'a_b.nova', 'ali ce.nova', 'alice.nova.', 'Kate.nova', 'alíce.nova', 'a'.repeat(64) + '.nova', 'https://alice.nova']) test(`reject name ${JSON.stringify(input)}`, () => assert.throws(() => normalizeName(input)));
test('maximum ASCII labels are accepted without changing their bytes', () => {
  const name = `${'a'.repeat(63)}.${'b'.repeat(63)}`; assert.equal(normalizeName(name), name);
});

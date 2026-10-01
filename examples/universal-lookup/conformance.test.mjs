import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
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
for (const input of [' Alice.Nova ', '\tAlice.Nova\n', 'alice.nova', 'a-b.nova', ' Pay.Alice.Nova ', 'pay.alice.nova']) test(`normalize ${JSON.stringify(input)}`, () => {
  assert.equal(normalizeName(input), input.trim().toLowerCase());
});
for (const input of ['alice', 'a..nova', 'more.pay.alice.nova', '-alice.nova', 'alice-.nova', 'a_b.nova', 'ali ce.nova', 'alice.nova.', 'Kate.nova', 'alíce.nova', 'a'.repeat(64) + '.nova', 'https://alice.nova']) test(`reject name ${JSON.stringify(input)}`, () => assert.throws(() => normalizeName(input)));
test('maximum ASCII labels are accepted without changing their bytes', () => {
  const name = `${'a'.repeat(63)}.${'b'.repeat(63)}`; assert.equal(normalizeName(name), name);
});
test('maximum three-label name has 191 bytes; longer labels and deeper nesting fail', () => {
  const name = `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}`;
  assert.equal(name.length, 191);
  assert.equal(normalizeName(name), name);
  assert.throws(() => normalizeName(`a${name}`));
  assert.throws(() => normalizeName(`d.${name}`));
});

// Additive-interface checks leave the published historical fixtures unchanged.
const val = (value, type) => nativeToScVal(value, { type });
const map = entries => xdr.ScVal.scvMap(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => new xdr.ScMapEntry({ key: val(key, 'symbol'), val: value })));
const variant = (tag, ...args) => xdr.ScVal.scvVec([val(tag, 'symbol'), ...args]);
function childStatus(tag, expiresAt = 2000000000n, nodeHex = 'b1cfe04e492112fa2b939b25b7c69d5ad7b87606d00c48490a6a35fd579408da') {
  const record = map({
    expires_at: val(expiresAt, 'u64'), generation: val(3n, 'u64'),
    holder: val('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 'address'),
    node: val(Buffer.from(nodeHex, 'hex'), 'bytes'),
    registrar: val('CDSORANQAJK35UV2HR63CMB6M5NYISHMUBTB6EQY2CZ3Y7HJDIOHRJWA', 'address'),
  });
  return map({ ledger: val(5000000, 'u32'), name: val('pay.alice.nova', 'string'), state: variant(tag, record), timestamp: val(1900000000n, 'u64') }).toXDR('base64');
}
for (const tag of ['Active', 'Suspended']) test(`decode child ${tag} with right-to-left namehash`, () => {
  assert.equal(decodeNameStatusXdr(childStatus(tag), 'pay.alice.nova').state[0], tag);
});
test('suspended child still requires a matching namehash and unexpired lifetime', () => {
  assert.throws(() => decodeNameStatusXdr(childStatus('Suspended', 2000000000n, '00'.repeat(32)), 'pay.alice.nova'));
  assert.throws(() => decodeNameStatusXdr(childStatus('Suspended', 1899999999n), 'pay.alice.nova'));
  assert.equal(decodeNameStatusXdr(childStatus('Suspended', 1900000000n), 'pay.alice.nova').state[0], 'Suspended');
});
function namesBatch(count, name) {
  return map({ ledger: val(5000000, 'u32'), results: xdr.ScVal.scvVec(Array.from({length: count}, () => variant('Name', val(name, 'string')))), timestamp: val(1900000000n, 'u64') }).toXDR('base64');
}
test('decode 32 maximum-length child names without the old XDR length ceiling', () => {
  const name = `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}`;
  const encoded = namesBatch(32, name);
  assert.ok(encoded.length > 8192);
  assert.equal(decodeBatchNamesXdr(encoded, 32, 32).results.length, 32);
  assert.throws(() => decodeBatchNamesXdr(encoded, 32, 16));
});
test('batch decoder enforces the caller-selected method limit and exact result count', () => {
  const encoded = namesBatch(16, 'pay.alice.nova');
  assert.equal(decodeBatchNamesXdr(encoded, 16, 16).results.length, 16);
  assert.throws(() => decodeBatchNamesXdr(namesBatch(17, 'pay.alice.nova'), 17, 16));
  assert.throws(() => decodeBatchNamesXdr(encoded, 15, 16));
  assert.throws(() => decodeBatchNamesXdr(encoded, 16, 33));
});

import { Address, hash, scValToNative, StrKey, xdr } from '@stellar/stellar-sdk';
import { normalizeName } from './decode.mjs';
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const utf8 = value => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(value);
function parse(base64) {
  requireValue(typeof base64 === 'string' && base64.length <= 8192, 'Invalid XDR');
  const value = xdr.ScVal.fromXDR(base64, 'base64');
  requireValue(value.toXDR('base64') === base64, 'Noncanonical XDR'); return value;
}
function symbol(value) { requireValue(value?.type === 'scvSymbol', 'Expected Symbol'); return utf8(value.sym.bytes); }
function fields(value, expected) {
  requireValue(value?.type === 'scvMap' && Array.isArray(value.value), 'Expected map');
  const keys = value.value.map(entry => symbol(entry.key));
  requireValue(keys.length === expected.length && keys.every((key, i) => key === expected[i]), 'Invalid map fields');
  return Object.fromEntries(value.value.map((entry, i) => [keys[i], entry.val]));
}
function variant(value) {
  requireValue(value?.type === 'scvVec' && Array.isArray(value.value) && value.value.length > 0, 'Expected enum');
  return [symbol(value.value[0]), value.value.slice(1)];
}
function integer(value, type) { requireValue(value?.type === type, `Expected ${type}`); return scValToNative(value); }
function name(value) {
  requireValue(value?.type === 'scvString', 'Expected name String');
  const text = utf8(value.str.bytes); requireValue(normalizeName(text) === text, 'Noncanonical name'); return text;
}
function address(value, contractOnly = false) {
  requireValue(value?.type === 'scvAddress', 'Expected Address');
  const text = Address.fromScVal(value).toString();
  requireValue(StrKey.isValidContract(text) || (!contractOnly && StrKey.isValidEd25519PublicKey(text)), 'Invalid address type');
}
function node(name) {
  const [label, namespace] = name.split('.'), enc = new TextEncoder();
  const child = (parent, label) => hash(Uint8Array.from([...parent, ...hash(enc.encode(label))]));
  return child(child(new Uint8Array(32), namespace), label);
}

/** Validate a NameStatus return against the requested canonical name. This is
 * data validation only; the caller checks RPC success, restoration and anchors. */
export function decodeNameStatusXdr(base64, expectedName) {
  requireValue(typeof expectedName === 'string' && normalizeName(expectedName) === expectedName, 'Expected canonical request');
  const value = parse(base64), r = fields(value, ['ledger', 'name', 'state', 'timestamp']);
  integer(r.ledger, 'scvU32'); const timestamp = integer(r.timestamp, 'scvU64');
  requireValue(name(r.name) === expectedName, 'Name mismatch');
  const [tag, args] = variant(r.state);
  if (['NamespaceMissing', 'RegistrarMissing', 'Unregistered'].includes(tag)) requireValue(args.length === 0, 'Unexpected state payload');
  else if (tag === 'Active' || tag === 'Expired') {
    requireValue(args.length === 1, 'Missing record');
    const record = fields(args[0], ['expires_at', 'generation', 'holder', 'node', 'registrar']);
    const expires = integer(record.expires_at, 'scvU64'); integer(record.generation, 'scvU64');
    address(record.holder); address(record.registrar, true);
    requireValue(record.node.type === 'scvBytes', 'Expected node bytes');
    const bytes = scValToNative(record.node), expected = node(expectedName);
    requireValue(bytes.length === 32 && bytes.every((byte, i) => byte === expected[i]), 'Node mismatch');
    requireValue((expires === 0n || timestamp <= expires) === (tag === 'Active'), 'Inconsistent expiry');
  } else throw new Error('Unknown name state');
  return scValToNative(value);
}

/** Validate one batch return. Preserve the caller's input order when attaching
 * identities; results themselves are not an address-ownership inventory. */
export function decodeBatchNamesXdr(base64, expectedCount) {
  requireValue(Number.isInteger(expectedCount) && expectedCount >= 0 && expectedCount <= 2, 'Invalid batch count');
  const value = parse(base64), r = fields(value, ['ledger', 'results', 'timestamp']);
  integer(r.ledger, 'scvU32'); integer(r.timestamp, 'scvU64');
  requireValue(r.results.type === 'scvVec' && Array.isArray(r.results.value) && r.results.value.length === expectedCount, 'Result count mismatch');
  for (const result of r.results.value) {
    const [tag, args] = variant(result);
    if (tag === 'None') requireValue(args.length === 0, 'Unexpected None payload');
    else if (tag === 'Name') { requireValue(args.length === 1, 'Expected name'); name(args[0]); }
    else if (tag === 'Failed') { requireValue(args.length === 1, 'Expected error'); requireValue(integer(args[0], 'scvU32') > 0, 'Invalid error code'); }
    else throw new Error('Unknown batch result');
  }
  return scValToNative(value);
}

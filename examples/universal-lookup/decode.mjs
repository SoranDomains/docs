import { Address, StrKey, scValToNative, xdr } from '@stellar/stellar-sdk';

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
const utf8 = bytes => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
function symbol(value) {
  requireValue(value?.type === 'scvSymbol', 'Expected an XDR Symbol');
  return utf8(value.sym.bytes);
}
function fields(value, expected) {
  requireValue(value?.type === 'scvMap' && Array.isArray(value.value), 'Expected a field map');
  const keys = value.value.map(entry => symbol(entry.key));
  requireValue(keys.length === expected.length && keys.every((key, i) => key === expected[i]), 'Unexpected, duplicate or unordered fields');
  return Object.fromEntries(value.value.map((entry, i) => [keys[i], entry.val]));
}
function address(value, classicOnly = false) {
  requireValue(value?.type === 'scvAddress', 'Expected an XDR Address');
  const result = Address.fromScVal(value).toString();
  requireValue(StrKey.isValidEd25519PublicKey(result) || (!classicOnly && StrKey.isValidContract(result)), 'Unsupported address type');
  return result;
}
function variant(value) {
  requireValue(value?.type === 'scvVec' && Array.isArray(value.value) && value.value.length > 0, 'Expected an enum vector');
  return [symbol(value.value[0]), value.value.slice(1)];
}
function memo(value, receivingAddress) {
  const [tag, args] = variant(value);
  if (tag === 'None') { requireValue(args.length === 0, 'None cannot carry a value'); return; }
  requireValue(StrKey.isValidEd25519PublicKey(receivingAddress), 'A memo requires a classic G address');
  requireValue(args.length === 1, 'Memo must have one value');
  if (tag === 'Id') { requireValue(args[0].type === 'scvU64', 'Memo ID must be XDR u64'); return; }
  if (tag === 'Text') {
    requireValue(args[0].type === 'scvString', 'Memo text must be an XDR String');
    const bytes = args[0].str.bytes;
    requireValue(bytes.length >= 1 && bytes.length <= 28, 'Memo text must contain 1–28 UTF-8 bytes');
    utf8(bytes); return;
  }
  if (tag === 'Hash') {
    requireValue(args[0].type === 'scvBytes' && args[0].value.value.length === 32, 'Memo hash must contain 32 bytes'); return;
  }
  throw new Error('Unknown memo variant');
}

/** Validate PaymentDestination at the XDR boundary, then preserve its native
 * decoded shape. This function performs no lookup and sends no payment. */
export function decodeDestinationXdr(base64) {
  requireValue(typeof base64 === 'string' && base64.length <= 4096, 'Invalid return XDR');
  const value = xdr.ScVal.fromXDR(base64, 'base64');
  requireValue(value.toXDR('base64') === base64, 'Noncanonical return XDR');
  const [tag, args] = variant(value);
  requireValue(args.length === 1, 'Destination must have one value');
  if (tag === 'Direct') {
    const p = fields(args[0], ['address', 'memo']);
    memo(p.memo, address(p.address));
  } else if (tag === 'Muxed') {
    const p = fields(args[0], ['account', 'id']);
    address(p.account, true);
    requireValue(p.id.type === 'scvU64', 'Muxed routing ID must be XDR u64');
  } else throw new Error('Unknown destination variant');
  return scValToNative(value);
}

/** UI input normalization only. Never apply this to addresses or memo text. */
export function normalizeName(input) {
  requireValue(typeof input === 'string', 'Name must be text');
  const trimmed = input.trim();
  // Reject Unicode before case conversion: do not fold lookalikes into ASCII.
  requireValue(!/[^\x00-\x7f]/.test(trimmed), 'Use ASCII name characters');
  const canonical = trimmed.toLowerCase();
  const labels = canonical.split('.');
  requireValue(labels.length === 2 && labels.every(label => label.length >= 1 && label.length <= 63 && /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/.test(label)), 'Use name.namespace with 1–63 characters per label');
  return canonical;
}

/** Portable JSON encoding for native bigint and byte-array values in vectors. */
export function nativeJson(value) {
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (value instanceof Uint8Array) return { $bytes: Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('') };
  if (Array.isArray(value)) return value.map(nativeJson);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, nativeJson(item)]));
  return value;
}

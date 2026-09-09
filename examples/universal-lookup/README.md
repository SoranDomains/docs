# Universal Lookup decoder examples

This example uses Stellar SDK 17.0.1 directly. It requires no Soran SDK, API key,
wallet connection or database. Node 22.12 or newer is required.

```sh
npm ci
npm test
```

`decode.mjs` exports:

- `decodeDestinationXdr(base64)`: validate a `PaymentDestination` ScVal and
  return its native array/object shape, preserving bigint IDs and memo bytes.
- `normalizeName(input)`: trim outer whitespace, reject non-ASCII name
  characters, lowercase and validate `name.namespace`.
- `nativeJson(value)`: encode bigint and byte arrays for fixture comparison.

The fixtures are in `../../reference/vectors/lookup-returns-v1.json`. Valid
cases contain exact base64 XDR and expected decoded output. Invalid cases
must fail payment-destination validation. The fixture format represents
bigint as `{"$bigint":"77"}` and bytes as `{"$bytes":"0001..."}`; actual SDK
values are bigint and Uint8Array.

These are synthetic ABI fixtures encoded from the deployed testnet Lookup
spec. They do not attest a live name, payment destination or transaction.
The decoder validates returned data; it does not perform a lookup, check
contract provenance, sign or send a payment. Check the RPC simulation outcome,
restoration requirements and your deployment configuration before decoding.

See [the guide](https://docs.soran.domains/reference/lookup-decoding) for raw
shapes, generated TypeScript bindings and examples.

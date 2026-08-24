# Soran documentation

Public documentation for [Soran](https://github.com/SoranDomains) — the Soroban name service on Stellar. Built with [Mintlify](https://mintlify.com): pages are MDX, navigation lives in `docs.json`.

## Map

| Section | For |
| --- | --- |
| Get started / Concepts | Anyone — what Soran is, ownership guarantees, the claim window, the trust model |
| SDK | Wallets & apps integrating [`@sorandomains/sdk`](https://www.npmjs.com/package/@sorandomains/sdk) |
| HTTP API | Backends using the public `/v1` read surface |
| Running a namespace | Businesses operating a namespace via the console |

## Related repositories

- [`SoranDomains/sdk`](https://github.com/SoranDomains/sdk) — standalone home of the SDK, published as [`@sorandomains/sdk` on npm](https://www.npmjs.com/package/@sorandomains/sdk) — trustless resolution for wallets
- `SoranDomains/soran` — the platform monorepo (private): contracts, API/indexer, web console

## Local preview

```bash
npm i -g mint
mint dev
```

Pushes to `main` deploy automatically once the Mintlify GitHub app is installed for this repo.

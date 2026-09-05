# Documentation project instructions

## About this project

- Public documentation for **Soran**, a Soroban (Stellar) name service — built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter (`title`, `description`); navigation lives in `docs.json`
- Ground truth is the platform code (private monorepo `SoranDomains/soran`) and the SDK (`SoranDomains/sdk`) — never document behavior you haven't verified there

## Terminology

- **namespace** — the top-level name a business owns (`yourbrand`); **name** — an issued name under it (`alice.yourbrand`)
- **claim window** — the public, timelocked objection window a namespace claim passes through; claims **award** (never "mint")
- **ownership guarantees** — permanent / reclaimable / timed (never "tiers" or "plans")
- **holder** — the address that owns a name under its namespace policy; **recipient** — its effective payment destination, which may differ; **operator roles** — owner / admin / issuer
- Say "self-custody namespace" vs "platform-operated namespace" — detection is by key, never by label

## Style preferences

- Active voice, second person ("you"); sentence case headings; one idea per sentence
- Bold for UI elements: click **Settings**; code formatting for names, commands, endpoints
- Mintlify components sparingly: `Note`, `Warning`, `CardGroup`, `Steps`

## Content boundaries

- Integrator- and tenant-facing content **only** — this repo is public
- Never include: internal audit artifacts or finding IDs, operational runbooks, security-posture details, private-repo file paths, or invented pricing numbers (subscription prices are operator-set)
- Billing and the marketplace are **optional deployment features** — always say "when enabled on a deployment"
- Testnet contract IDs are fine (they are public on chain)

## Release accuracy

- Keep deployed contracts, published SDK packages and hosted app/API cutovers separate. Only mark each live with verified evidence.
- Keep the public deployment manifest and address table aligned; identify historical deployments explicitly.
- Memos are optional and stored atomically with addresses in each native Resolver. Universal Lookup is the shared read entry point.
- Never infer permanent ownership from zero expiry, or frozen holder records from Resolver assurance.
- Never claim absent, cold or failed reads establish a memo-free destination.
- Run the documentation validation before proposing a change; review SDK examples against the matching package version.

# Soran documentation

Public [Soran](https://github.com/SoranDomains) documentation built with Mintlify. Pages use MDX; navigation lives in `docs.json`.

- `reference/release-status.mdx` lists the current testnet addresses, package versions, endpoints and fees.
- `reference/deployments/testnet.json` records public contract IDs, hashes and confirmed deployment transactions.
- Concepts explain optional on-chain memos, namespace fees, ownership and governance.
- SDK/API pages distinguish current contract reads from indexed discovery and history.
- `reference/lookup-decoding.mdx` documents exact JavaScript return shapes. The standalone example in `examples/universal-lookup` checks portable XDR fixtures using Stellar SDK.

## Validate and preview

Use Node 22 LTS. CI installs the exact lockfile and runs the same validator.

```bash
npm ci
npm run validate
npx mint dev
```

Review changes against the matching implementation and public deployment evidence before merging. Never publish predicted addresses as live or convert a roadmap decision into an available feature. SDK source is at [SoranDomains/sdk](https://github.com/SoranDomains/sdk).

Main-branch changes may trigger the configured documentation site deployment. Use a reviewed branch/PR for changes.

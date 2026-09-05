# Soran documentation

Public [Soran](https://github.com/SoranDomains) documentation built with Mintlify. Pages use MDX; navigation lives in `docs.json`.

- `reference/release-status.mdx` separates verified contracts, package publication and hosted service cutovers.
- `reference/deployments/testnet.json` records public contract IDs, hashes and confirmed deployment transactions.
- Concepts explain optional on-chain memos, namespace fees, ownership and governance.
- SDK/API pages distinguish current contract reads from indexed discovery and history.

## Validate and preview

```bash
npm ci
npm run validate
npx mint dev
```

Review changes against the matching implementation and public deployment evidence before merging. Never publish predicted addresses as live or convert a roadmap decision into an available feature. SDK source is at [SoranDomains/sdk](https://github.com/SoranDomains/sdk).

Main-branch changes may trigger the configured documentation site deployment. Use a reviewed branch/PR for changes.

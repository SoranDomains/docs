# Soran documentation

Public [Soran](https://github.com/SoranDomains) documentation built with Mintlify. Pages use MDX; navigation lives in `docs.json`.

- `reference/release-status.mdx` lists the current testnet addresses, package versions, endpoints and fees.
- `reference/deployments/testnet.json` records public contract IDs, hashes and confirmed deployment transactions.
- Concepts explain optional on-chain memos, namespace fees, ownership and governance.
- SDK/API pages distinguish current contract reads from indexed discovery and history.
- `reference/lookup-decoding.mdx` documents exact JavaScript return shapes. The standalone example in `examples/universal-lookup` checks portable XDR fixtures using Stellar SDK.

## Validate and preview

Use Node 22 LTS (22.12 or newer). CI installs the exact lockfile and runs the same validator. The Mintlify CLI requires an LTS Node release.

```bash
npm ci
npm run validate
npx mint dev
```

Review changes against the matching implementation and public deployment evidence before merging. Never publish predicted addresses as live or convert a roadmap decision into an available feature. SDK source is at [SoranDomains/sdk](https://github.com/SoranDomains/sdk).

Main-branch changes may trigger the configured documentation site deployment. Use a reviewed branch/PR for changes.

## Information architecture and illustrations

The sidebar groups pages into **Learn**, **Use Soran**, **Build**, **Protocol**, and **Resources**. Existing page routes stay stable. New capability pages separate concepts, holder tasks, namespace settings, and integration references.

The illustrations in `images/` use flat vector shapes, clear typography, and restrained colour to explain the naming system. Each has light and dark SVG variants, plus separate mobile compositions. The profile illustration includes an original generated portrait of a fictional person. Import `Illustration` from `/snippets/illustration.jsx` and provide `name`, meaningful `alt`, and an optional `caption`. Use `priority` only for the first illustration on a page. Fixed aspect ratios reserve layout space; lower illustrations load lazily.

`npm run validate` checks referenced images and snippets, as well as MDX compilation, links, navigation, versions and deployment data. `style.css` uses documented Mintlify layout hooks; check the homepage and a guide on desktop/mobile in both themes after changing it.

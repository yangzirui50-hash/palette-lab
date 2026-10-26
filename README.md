# Palette Lab

AI-assisted color-system workspace for turning image inspiration into editable, testable and exportable design decisions.

## Status

Phase 0 — professional project foundation.

## V1 direction

- Local image palette extraction
- Web/UI and Art/Poster domain profiles
- Editable color roles and palette variants
- Scenario previews and usage checks
- CSS, JSON and PNG export
- Offline-capable core workflow

Later phases add multimodal analysis, Unsplash inspiration, palette audits and multi-image consistency.

## Stack

React · TypeScript · Vite · Canvas/Web Worker · Zod · Hono · Cloudflare Workers

## Documentation

- `docs/PRODUCT.md`: product promise, scope and acceptance criteria
- `docs/ARCHITECTURE.md`: system boundaries, records and provider contracts
- `docs/ROADMAP.md`: phased delivery plan
- `docs/STATUS.md`: current implementation and verification state
- `docs/CHANGELOG.md`: dated project changes
- `docs/DECISIONS.md`: architecture decision records
- `docs/DESIGN_SYSTEM.md`: theme/domain tokens and visual invariants
- `CONTRIBUTING.md`: delivery and documentation synchronization rules

## Development

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

`npm run dev` starts the lightweight frontend preview. Use `npm run dev:full` when developing the Cloudflare Worker and online APIs.

## Quality checks

```bash
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

## Publishing discipline

Each completed phase is reviewed, committed and pushed to `main`. Secrets and local environment files must never be committed.

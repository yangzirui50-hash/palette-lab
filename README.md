# Palette Lab

AI-assisted color-system workspace for turning image inspiration into editable, testable and exportable design decisions.

## Status

The local workspace includes image import, role editing, Web/Art previews, exports, deterministic multi-image comparison/unification, independent local palettes and dual-mode spatial analysis. The color engine uses hue-safe clustering, confidence-aware assignment and 512-pixel analysis with eight-neighbor continuity.

The November 1 baseline passed 72 unit tests, 25 browser workflows and the opt-in 50-image benchmark. See `docs/STATUS.md` for current verification and remaining work, and `docs/REVIEWS/2026-11-02-github-sync.md` for the conversation-to-commit reconciliation.

## V1 direction

- Local image palette extraction
- Web/UI and Art/Poster domain profiles
- Editable color roles and palette variants
- Scenario previews and usage checks
- CSS, JSON and PNG export
- Offline-capable core workflow

Multimodal analysis and deterministic multi-image consistency are implemented. Real Unsplash access, palette audits and ambient background customization remain separate acceptance stages.

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
- `docs/AMBIENT_MODE.md`: future image-driven ambient customization contract
- `docs/AI_ANALYSIS.md`: AI provider, request, report and secret-management contracts
- `docs/SPATIAL_ANALYSIS.md`: global/local palettes, region/distribution modes and metric definitions
- `docs/TEST_PLAN.md`: layered acceptance plan and outstanding coverage
- `docs/TEST_CORPUS.md`: fixture provenance, benchmark scope and generalization limits
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

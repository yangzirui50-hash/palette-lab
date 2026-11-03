# Palette Lab — Delivery Roadmap

## Phase 0 — Foundation

- Freeze product and domain contracts
- Establish React/TypeScript/Vite project
- Configure Git, GitHub, secret exclusions and CI
- Establish test and deployment boundaries

## Phase 1 — Local color workspace (V1)

- Image import and local processing
- Palette extraction and color-role editing
- Web/UI and Art/Poster profiles
- Variants, locking, previews and checks
- CSS, JSON and PNG exports
- Desktop multi-pane and mobile task-based responsive workspaces
- Touch-friendly image import, previews and exports
- Unit and workflow tests

## Phase 2 — Multimodal analysis (V1.5)

- Protected Hono API
- Structured visual evidence and uncertainty
- Actionable, domain-aware recommendations
- User correction before dependent analysis
- AI failure fallback and cost controls

## Phase 3 — Inspiration and audit (V2)

- Unsplash search with attribution and hotlinking
- AI-assisted reference comparison
- Palette version diffs
- Grayscale and color-vision simulations
- Create/Audit workflows

## Phase 4 — Visual systems (V3)

- Multi-image consistency
- Worldbuilding domain profile
- Character, faction and regional palette roles
- Ambient background mode with constrained image-derived tokens
- Shareable visual-system documentation

## Phase 5 — Installable platforms

- PWA installation and offline application shell
- Tauri desktop packaging for Windows, macOS and Linux
- Capacitor mobile packaging when native integrations are required
- Platform-specific signing, store and real-device validation

## Delivery discipline

Every phase requires a working build, relevant tests, a Git commit, a remote backup and an explicit review before scope expands.

## Current precision stage (2026-11-03)

Implement pipeline correctness and independent contrast-based focus first. Next obtain a two-reviewer focus annotation pilot, freeze standards, then run held-out qualification. Scale toward 100 controlled +400 development +500 held-out unique images only after failure classes and provenance are established. See `ATTENTION_EVALUATION.md`; a thousand uploads alone is not an accuracy acceptance gate.

## Daily-use priority order after the November 3 review

The owner confirmed daily usability first, with portfolio value retained. The following order supersedes the earlier focus-first next action:

1. Trust repair: contrast/role selection, page-scoped manual preservation and sampled source-color fidelity are implemented in the first three units.
2. Shared analysis entry and versioned preprocessing across single/series modes, with partial batch success, are implemented in the third unit.
3. Implemented in the fourth unit: validated local project recovery/backups, revision-checked saving, bounded undo/redo and report snapshots. Read before mounting/writing, preserve live work on storage failure, protect concurrent-window records and derive view URLs from Files.
4. Next: nearby preview/export and phone navigation, local-color application, explicit HEX editing and usable palette-card output. Keep measured source shares distinct from added/manual candidates, and keep validation delivery/cache costs visible.
5. Quality calibration on difficult real imagery, followed by a small independently labeled focus pilot and held-out evaluation before the 1000-image scale run.
6. Portfolio case-study evidence and further platform/provider/visual expansion only after the daily workflow is reliable.

Each delivery unit has its own regression evidence. The fourth passes 188 unit tests and 52 regular browser workflows; its image algorithm is unchanged from the third unit's separate 50/30-image run. Review positive/negative failure classes and worst per-image deltas; averages and upload counts do not replace independent algorithm qualification. Completing these repairs does not mark task layout, local-color delivery or human-focus qualification complete.

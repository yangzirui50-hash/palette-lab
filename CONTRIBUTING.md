# Contributing to Palette Lab

## Delivery workflow

1. Confirm the phase and acceptance criteria before changing code.
2. Implement a coherent, reviewable unit of work.
3. Add or update relevant tests.
4. Update documentation in the same commit as the related code.
5. Run `npm run lint`, `npm test` and `npm run build`.
6. Commit with a specific message and push the remote backup.

## Documentation synchronization

The following changes require documentation updates:

| Change | Required documentation |
|---|---|
| Scope or acceptance criteria | `docs/PRODUCT.md` |
| Architecture, data contracts or providers | `docs/ARCHITECTURE.md` |
| Delivery order or phase scope | `docs/ROADMAP.md` |
| Significant technical decision | `docs/DECISIONS.md` |
| Implemented, verified or deferred behavior | `docs/STATUS.md` |
| Any user-visible or engineering milestone | `docs/CHANGELOG.md` |
| Commands or development workflow | `README.md` and this file |

`docs/STATUS.md` must describe what is actually implemented and verified, never planned work as completed work. Update its date and next action on every phase change.

## Secrets and fixtures

Never commit API keys, tokens, real `.env` files or `.dev.vars`. Use the provided example files. Test fixtures must not contain private user images or unlicensed reference assets.

## Commits and backups

Keep commits scoped to understandable milestones. Do not mix unrelated feature work with documentation-only changes. A task is not considered backed up until the remote push succeeds.

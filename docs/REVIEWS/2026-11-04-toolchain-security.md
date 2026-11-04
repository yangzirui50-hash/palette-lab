# Development-tool security compatibility review — 2026-11-04

## Problem and selected repair

The existing audit gate reported moderate [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) in minimatch versions below 11.0.1. The old ESLint 9 consumer used the CommonJS callable API, so a blanket minimatch 11 override on that graph was not an acceptable fix. The repair upgrades ESLint to 10.14.0, @eslint/js to 10.0.1, typescript-eslint to 8.72.1 and eslint-plugin-react-hooks to 7.1.1, with reviewed minimatch 11.0.4 override. New consumers use the modern named interface; real lint exercises those paths. The Node requirement is ^20.19.0 || ^22.13.0 || >=24. Upstream patch context: [minimatch 11.0.1](https://github.com/isaacs/minimatch/releases/tag/v11.0.1).

The lock graph was resolved and installed in a separate C-drive copy, never in the original shared D-drive dependencies. Old npm 10 resolution failed on the anchored old peer graph and then hit an internal resolver error with a fresh lock. The preserved failure logs were not hidden. An isolated, SHA-512-verified official npm 12 tool resolved the fresh lock without force or legacy-peer flags; npm 10 subsequently consumed that lock with a successful clean installation and audit. No global package manager was installed or changed. Normal CI keeps npm ci and npm audit active.

The refreshed graph changes 132 package locations and removes 52; this is not merely four lockfile lines. All nine direct runtime packages and all transitive runtime versions remain unchanged. The resulting graph has 473 dependency entries and one minimatch entry at 11.0.4. The four direct development upgrades and their transitive changes are fully represented in package-lock.json. Keep the override reviewed and remove it after upstream dependency ranges reach the patched major.

## Lint compatibility decisions

The newer lint tooling detects seven existing synchronous state resets in effects and five caught-error translations. Twelve narrowly scoped directives retain existing behavior with a reason at each site. Reset effects react to changed external source/project/search identity, cancel work and clear transient status once; their dependencies do not derive from the cleared state. The viewport effect reads the browser only when subscribing, preserving SSR-safe initialization. These choices may retain a finite additional render and are not a claim of optimal React lifecycle design.

Caught-error boundaries deliberately emit sanitized messages rather than attach raw imported data or upstream transport details as causes. They preserve retry/error classifications. No executable behavior is changed by the lint review. All global recommended lint checks remain enabled; the audit gate is not weakened.

## Verification

On the isolated clean dependency tree: npm 10 clean installation, zero-vulnerability npm audit, lint, 253 unit tests in 30 files, seven pilot CLI/server checks, environment safety, type/production build and 80 regular browser workflows all pass; four opt-in suites are skipped. The C development worktree now links to that validated C dependency directory. The old D target remains intact. Remote Linux CI and production deployment are separate publication checks, recorded in STATUS.

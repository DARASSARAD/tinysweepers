# Milestone progress

## P0 — completed 2026-10-01

- Vite, strict TypeScript, PixiJS v8, Vitest, ESLint, Git, and lockfile installed.
- Original animated sweeper sprite, pointer interaction, viewport layout, full-window floor, and visibility pause implemented.
- Local, Poki, and CrazyGames build targets configured. No SDK integration yet.
- Build, three responsive-layout tests, lint, external URL scanning, and ZIP packaging pass.
- Dev preview opened in the in-app browser; console warnings/errors list was empty.

## P1 — completed 2026-10-01

- Level validation, incremental exposure, exclusive reservations, crate lanes, occupied docks, and win/lose transitions implemented.
- Deterministic bot phases tested with real delivery timing. Waiting crates wake from exposure changes.

## P2–P4 — playable slice

- Shared cube/bot/crate atlas, board mosaic, pooled animated bots and particles, lane controls, and five charging docks.
- Shared rendering is fully playable with validated starter levels.
- Local win/retry/next flow, pause, safe storage, sound toggle, and color-symbol mode added.
- Browser deliveries, waiting-crate wakeups, dock release, and pause verified. Responsive fit tested in phone and landscape dimensions.

## P7 — completed 2026-10-01

- 30 validated campaign files with nine original pixel motifs and a gradual size ramp.
- Constructive crate generator, bounded DFS solver, PNG import CLI, and real-timing campaign simulations.
- 48 tests pass, including the known-unsolvable fixture and all campaign play-throughs.

## P5 — completed 2026-10-01

- Platform interface, LocalPlatform, guarded lifecycle/ad wrapper, storage fallback, and a local-only ad simulator (D key).
- Events on first crate action, win/lose, pause, retry, next room, and visibility changes. Commercial breaks respect level/cooldown configuration.
- 57 tests pass, including duplicate suppression, ad-time input/audio guards, confirmed long-ad rewards, blocked/rejected/timeout recovery, and the full event sequence.
- Browser win → next-room transition, retry from pause, symbol mode, successful reward simulation, and blocked-ad recovery verified with no console warnings/errors.

## Build verification

- Local, Poki, and CrazyGames builds pass TypeScript, lint, and the external URL scan.
- Local output is 584,910 bytes across 11 files. ZIP packages are available in `packages/`.
- Preview left at level 1 after resetting QA progress. A sample campaign screenshot is saved as `docs/playable-preview.jpg`.

## Remaining

Verified portal SDK adapters and account-based QA tools (P6), further art/audio polish, phone performance playtests, and submission assets/reviews (P8–P9). Current portal modes use an offline local fallback with no monetization.

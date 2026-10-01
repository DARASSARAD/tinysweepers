# Tiny Sweepers

An original, relaxing sweeper-bot puzzle for the web. Design: [plan_web.md](plan_web.md).

## Start

```sh
npm install
npm run dev
```

## Verify and build

```sh
npm run lint
npm test
npm run build
npm run check:external
npm run package -- local
```

Other build modes: `npm run build -- --mode poki` and `npm run build -- --mode crazygames`.

The playable prototype has three starter puzzles, five charging docks, colored crate stacks, animated sweepers, retry/next flow, saved progress, sound, and color symbols. Portal SDKs are not implemented yet.

Tap only the top crate in a lane. Each sweeper collects one matching exposed cube. Leave dock space for colors on the outside of the mosaic. A blocked crate waits until deliveries expose its color.

Keyboard: **1–4** select lanes, **R** retries, **Space/Escape** pauses, **M** toggles sound, **P** toggles symbols, **N** continues after a win.

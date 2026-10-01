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

The playable game has 30 puzzles, five charging docks, colored crate stacks, animated sweepers, retry/next flow, saved progress, sound, and color symbols. Portal SDKs are not implemented yet.

Tap only the top crate in a lane. Each sweeper collects one matching exposed cube. Leave dock space for colors on the outside of the mosaic. A blocked crate waits until deliveries expose its color.

Keyboard: **1–4** select lanes, **R** retries, **Space/Escape** pauses, **M** toggles sound, **P** toggles symbols, **N** continues after a win.

Local developer control: **D** opens an ad simulator for testing paused input/audio, blocked ads, and confirmed/failed rewards. It is excluded from portal builds.

## Level tooling

```sh
npm run generate:campaign
npm run generate:level -- picture.png --size 16 --colors 4 --id 31 --output levels/level_031.json
```

The generator validates capacities and searches for a solution. The campaign tests also run each level through the actual bot timing model. Built-in campaign art is original ASCII pixel art, with no downloaded assets.

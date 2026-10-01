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

P0 implements the responsive PixiJS v8 foundation and an interactive bot preview. Next: P1, the pure TypeScript board, crate, dock, and game-state logic. Portal SDKs are not implemented yet.

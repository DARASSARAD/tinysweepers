# Tiny Sweepers (Web / Portals): Build Plan

Working title: **Tiny Sweepers** (placeholder, rename freely).
Stack: **PixiJS v8 + TypeScript + Vite**, tests with **Vitest**.
Targets: **Poki** and **CrazyGames** (HTML5 builds), plus a local/dev build.

> Do NOT use the name "Roomba" or imitate iRobot's design anywhere (code, art, store text). Use "sweeper bots" / "robot vacuums".

---

## 1. Instructions for the agent (read first)

1. Work in **small milestones**. Finish one, verify it, commit, then move on.
2. **Use PixiJS v8 APIs only.** v8 initializes asynchronously (`await app.init(...)`) and has a new Graphics fill/stroke API. Do not write v7 code. Consult the official PixiJS v8 docs (they publish an `llms.txt`) and the `pixijs/pixijs-skills` repo before writing rendering code.
3. **Do not guess portal SDK method names or script URLs.** Before writing any adapter, read the current official docs:
   - Poki: https://sdk.poki.com (HTML5 SDK page, Requirements page, Poki Inspector page)
   - CrazyGames: https://docs.crazygames.com (Requirements and HTML5 SDK pages)
   Record exact method names and script URLs you used in `docs/PLATFORM_NOTES.md`.
4. After every milestone: run `npm run build`, `npm test`, and `npm run check:external`, open the dev server, and read the browser console. Fix all errors and warnings.
5. Commit before and after every milestone.
6. Keep every tunable number (speeds, delays, dock count, grid size, ad cooldowns) in `src/core/Config.ts`.
7. Keep **game logic separate from rendering**: `src/logic/` must have zero Pixi imports so it is unit-testable in Node.
8. If a requirement is ambiguous, choose the simplest option, log it in `docs/DECISIONS.md`, and continue.
9. If anything in the portal docs conflicts with this plan, **the portal docs win**. Note the conflict in `docs/PLATFORM_NOTES.md`.

---

## 2. Game summary

A relaxing, no-timer puzzle. A floor is covered in colored dust cubes forming a hidden mosaic. The player has stacks of **robot crates**, each holding little cleaning robots of one color, and only **5 charging docks**. Tapping a crate moves it into a free dock and releases its robots. Each robot claims a matching exposed cube, drives to it, vacuums it up, and delivers it to the dustbin. When a crate's robots are done, the dock frees. Clear every cube to reveal the finished floor picture.

The tension is **dock management**: if all 5 docks hold crates that can't make progress, the player is stuck.

### Core rules (v1)

- **Grid:** W×H cells, each a color index or empty (-1).
- **Exposure rule:** a cube is claimable only if at least one of its 4 neighbors is empty or it is on the grid border (the picture peels outside-in). *Assumption to verify in playtests. Make it toggleable in Config.*
- **Crates:** each has `color` and `capacity` (cubes it will clear). A crate spawns `capacity` bots, each carrying one cube.
- **Lanes:** crates sit in vertical stacks. Only the top crate of each lane is tappable.
- **Docks:** 5 slots. A crate holds its dock until all its bots have delivered.
- **Idle crate:** if a docked crate has no exposed cube of its color, its bots wait (event-driven, not polling) and the dock stays occupied.
- **Claiming:** a cube is reserved the instant a bot targets it, so two bots never chase the same cube.
- **Win:** all cubes cleared.
- **Lose:** all docks full, no bots in motion, and no docked crate can claim any exposed cube.
- No timers, no lives.

---

## 3. Portal requirements (design constraints)

Verify against the current official docs (see rule 3). As of research:

**Both portals**
- Must work on desktop, mobile, and tablet, with mouse and touch.
- No ads other than the portal SDK's. Must stay playable with an ad blocker (never gate core gameplay behind an ad).
- Call gameplay start/stop events correctly. Mute audio during ads.

**Poki**
- All external requests are blocked by default: **no Google Fonts, no CDN-hosted libraries or assets**. Everything is bundled locally. (The Poki SDK script itself is the expected exception; confirm in docs.)
- No splash screens, studio logos, or outgoing links in onboarding.
- Must work in **incognito mode** (storage may be unavailable).
- SDK events must not fire twice in a row, and none may fire during midrolls or rewarded videos.
- In-game privacy policy UI is required if the game links externally.
- Test with the **Poki Inspector** (event log, load time, file size).

**CrazyGames**
- Two stages: **Basic Launch** (SDK optional, no monetization) then **Full Launch** (SDK required, gameplayStart event, ads via SDK only, works with AdBlock).
- Limits: initial download ≤ 50 MB, total ≤ 250 MB (≤ 50 MB without the SDK), ≤ 1,500 files. Aim far below this. A 2025 third-party guide also mentions English support, PEGI 12 content, and a ≤ 20 MB initial size for mobile homepage eligibility. Verify these on the official site.

**Targets for this project (stricter than the limits)**
- Initial JS + assets under ~5 MB, total under ~15 MB, and well under 100 files.
- First level playable in a few seconds on a mid-range phone.

---

## 4. Project structure

```
index.html
vite.config.ts
package.json
src/
  main.ts                 boot: init Pixi, platform, load assets, start game
  core/
    Config.ts
    Events.ts             tiny typed event emitter
    Storage.ts            safe storage wrapper (see §7)
  logic/                  NO Pixi imports. Pure TypeScript
    LevelData.ts          types + validate()
    BoardModel.ts         cells, exposure, claiming, removal
    DockModel.ts          docks, crates, lanes
    GameModel.ts          state machine: Loading/Playing/Won/Lost
    Solver.ts             solvability + difficulty
  view/                   Pixi rendering
    App.ts                Application setup, layout/resize
    BoardView.ts, CubeView.ts, BotView.ts, CrateView.ts, DockView.ts, BinView.ts
    Pool.ts
    fx/                   particles, shake, shine
  ui/                     HUD, WinPanel, LosePanel, SettingsPanel, PrivacyPanel
  platform/
    Platform.ts           interface (see §5)
    LocalPlatform.ts
    PokiPlatform.ts
    CrazyGamesPlatform.ts
    index.ts              picks implementation by build mode
  audio/
    AudioManager.ts
levels/                   level_001.json ...
tools/
  level-generator/        PNG -> level JSON
  check-external.mjs      fails if dist references external URLs
  package.mjs             zips dist/<mode>/ for upload
tests/
docs/
  DECISIONS.md
  PLATFORM_NOTES.md
```

**Build modes** (Vite `--mode`): `local`, `poki`, `crazygames`. Each outputs to `dist/<mode>/` with only the code for that platform.

---

## 5. Platform adapter

```ts
export interface Platform {
  init(): Promise<void>;
  loadingFinished(): void;          // assets ready, first level ready
  gameplayStart(): void;            // player actively playing
  gameplayStop(): void;             // win, lose, pause, menu
  commercialBreak(): Promise<void>; // between levels, before gameplayStart
  rewardedBreak(): Promise<boolean>;// true = grant reward
  isAdPlaying(): boolean;
  saveData(key: string, value: string): Promise<void>;
  loadData(key: string): Promise<string | null>;
}
```

Rules for the **platform-agnostic wrapper** around any `Platform`:
- Never call `gameplayStart` twice in a row, or `gameplayStop` twice in a row. Track state and ignore duplicates.
- Never call SDK gameplay events while an ad is playing.
- Before an ad: `gameplayStop`, pause tweens and input, mute audio. After: unmute, resume, then `gameplayStart` when the player resumes.
- Ads never block when the SDK is missing or blocked by an ad blocker. `commercialBreak` resolves immediately, `rewardedBreak` resolves `false`.
- Rewards are granted **only** when the SDK confirms the player should be rewarded.

**Event placement**
| Moment | Call |
|---|---|
| Assets loaded, first level ready | `loadingFinished()` |
| Player's first tap in a level | `gameplayStart()` |
| Win, lose, pause, back to menu | `gameplayStop()` |
| Between levels (after win or retry) | `commercialBreak()` then `gameplayStart()` on next tap |
| Stuck/lose screen offer: "+1 dock" / "undo" | `rewardedBreak()` (player-initiated only) |

Ad frequency limits go in `Config.ts`. Don't show a commercial break before the first 2 to 3 levels. Respect portal guidance.

---

## 6. Data model

```ts
export interface CrateData { color: number; capacity: number; }

export interface LevelData {
  id: number;
  width: number;
  height: number;
  palette: string[];       // hex colors
  pixels: number[];        // length width*height, palette index or -1
  lanes: CrateData[][];    // each lane is a stack, index 0 = top
  dockCount: number;       // default 5
}
```

**Invariant (every level):** for each color, the sum of crate capacities equals the number of cubes of that color. `validate()` enforces it, and the generator and CI test call it.

---

## 7. Safe storage and offline-clean rules

- `Storage.ts` wraps `localStorage` in try/catch with an **in-memory fallback** (incognito and sandboxed iframes can throw). Never let a storage error crash the game.
- Save progress through `Platform.saveData/loadData` where the SDK provides it (CrazyGames offers an SDK data module per research, so verify), otherwise through `Storage`.
- Store only: current level index, settings (sound, haptics, color-blind mode), and optional best stats.
- **No external network requests at runtime**: no CDN scripts, no web fonts, no remote images or audio, no analytics. Use bitmap fonts or locally bundled fonts. `npm run check:external` scans `dist/` for `http(s)://` and `//` URLs and fails on anything not on a small allowlist (the portal SDK script URL, W3C XML namespace strings, etc.).

---

## 8. Layout and input

- Logical design size: **1080×1920 portrait play area**.
- Fill the entire window: the background (a floor texture) must extend beyond the play area in every direction, so no black bars appear.
- **Portrait window:** scale the play area to fit width.
- **Landscape/desktop window:** scale the play area to fit height and center it, with the floor background filling the sides. Optionally move the lane stacks beside the board if it improves readability.
- Handle `resize` and `orientationchange`, plus `devicePixelRatio` (cap at 2 for performance).
- Input via Pixi pointer events (`eventMode = 'static'`, `pointertap`) so mouse and touch work identically. Minimum tap target ≈ 44 CSS px.
- Pause game updates and audio on `document.visibilitychange` (tab hidden).
- Audio starts only after the first user gesture.
- Fullscreen toggle is optional. Don't depend on it.

---

## 9. Milestones

### P0: Project setup
- Scaffold with Vite + TypeScript + PixiJS v8 (the `create-pixi` template is acceptable). Add Vitest, ESLint, and a `.gitignore`.
- `main.ts` does `await app.init({ resizeTo: window, ... })`, mounts the canvas, and draws a test sprite.
- Add build modes `local | poki | crazygames` and the `check:external` and `package` scripts (stubs allowed).
- **Done when:** `npm run dev` shows the test sprite with no console errors, and `npm run build -- --mode local` outputs to `dist/local/`.

### P1: Logic layer (no rendering)
- Implement `LevelData` + `validate()`, `BoardModel` (cells, `isExposed`, `tryClaim`, `remove`, `remaining`), `DockModel` (docks, lanes, place/free), and `GameModel` (state machine and the lose check).
- Maintain an **exposed set** incrementally. Do not rescan the grid on every claim.
- **Tests (Vitest):**
  - two claims never return the same cube
  - exposure updates after removals
  - only the top crate of a lane is tappable
  - docks free correctly
  - win triggers when `remaining` hits 0
  - lose triggers in a hand-built stuck level and does **not** trigger in a winnable one
- **Done when:** all logic tests pass and `src/logic/` has no Pixi imports.

### P2: Board rendering
- Load a hardcoded 8×8 level JSON. `BoardView` creates one `Sprite` per cube from a **single atlas texture**, tinted by palette color.
- Fit the grid into the play area. Implement the §8 layout.
- Debug overlay (toggle in Config) outlines exposed cubes.
- **Done when:** the test picture renders correctly at portrait and landscape window sizes.

### P3: Single bot full cycle
- `BotView`: `claim → drive to cube → pick up → drive to bin → deliver → return → pool`.
- Use GSAP (or a minimal local tween helper) and `async/await`. If you add GSAP, it must be bundled, not loaded from a CDN.
- On deliver: call `BoardModel.remove`, update the view, and play a pop effect.
- If no claim is possible, the bot waits for an "exposure changed" event.
- **Done when:** one bot clears one cube end to end and `remaining` decrements.

### P4: Crates, lanes, docks
- `CrateView`, `DockView`, and lane layout at the bottom of the play area, with docks above them.
- Tapping the top crate of a lane moves it to a free dock and spawns `capacity` bots with staggered delay. When all its bots deliver, the dock frees and the next crate in the lane is revealed.
- Pool bots and effects with `Pool.ts`.
- **Done when:** the test level is fully playable by tapping crates, docks fill and free correctly, and the game reaches a win state.

### P5: Game flow and platform wiring
- `GameModel` states drive HUD, WinPanel, LosePanel (Retry), and next level.
- Implement `Platform`, `LocalPlatform`, and the guarded wrapper from §5. Place the SDK calls per the event table. Include `Storage.ts` and progress saving.
- Add a **mock platform** for tests and a debug panel in `local` mode that simulates: ad playing, ad blocked, rewarded success, and rewarded failure.
- **Tests:** with the mock platform, assert that events never duplicate, none fire during an ad, audio mutes during ads, input is blocked during ads, and a blocked ad does not hang the game.
- **Done when:** a full play-through (level start → win → break → next level) produces the correct event sequence in the mock log.

### P6: Portal adapters
- Read the official docs (rule 3), then implement `PokiPlatform` and `CrazyGamesPlatform`. Record method names and script URLs in `docs/PLATFORM_NOTES.md`.
- Load each SDK **only in its own build mode** and handle SDK load failure (ad blocker, offline) without crashing.
- Run `npm run build -- --mode poki` and `--mode crazygames`, then `npm run check:external` on each.
- Upload the Poki build to the **Poki Inspector** and confirm the event log, load time, and file size look right. Test the CrazyGames build in their QA tool.
- **Done when:** both builds pass `check:external`, run in their respective test tools, and fire the correct SDK events.

### P7: Level tooling
- `tools/level-generator`:
  1. Input: a small PNG, target size (16 to 32 px), color count (4 to 8).
  2. Quantize to the palette.
  3. Count the cubes per color.
  4. Split each color's count into crate capacities and distribute them into lanes.
  5. Output JSON and run `validate()`.
- `Solver.ts` runs DFS/BFS over game states (board, lanes, docks) to confirm solvability and estimate difficulty (fewer winning sequences means harder). A simplified model is acceptable (a docked crate instantly clears the exposed cubes of its color up to capacity). Document the simplification in DECISIONS.md.
- Generate and validate **30 levels** with a gentle difficulty ramp.
- **Tests:** generator output always passes `validate()`, and the solver marks the known-stuck fixture unsolvable.
- **Done when:** one command takes a PNG to a validated, solvable level file.

### P8: Juice, audio, presentation
- Final-style art: distinct bot shapes with eyes, charging-pad docks with blinking lights, a warm top-down floor, room themes (kitchen, kids' room, garage).
- Animations: squash/stretch when a crate lands, a dust puff on pickup, a shine sweep on level completion revealing the finished picture.
- Audio: pickup sounds with rising pitch on consecutive pickups, dock thunk, win jingle. Mute toggle persists. Use small compressed files.
- Color-blind mode (patterns or symbols on cubes). Minimal text, icons wherever possible.
- **Done when:** a playtest feels satisfying and every color is distinguishable in color-blind mode.

### P9: Portal polish and submission
- **First-run experience:** first level playable within seconds of load, a one-tap hint, no menus, no splash, no logos.
- **Early levels:** make levels 1 to 15 short (about 1 to 2 minutes) with a smooth ramp, since portals judge on early player behavior.
- Performance: hold 60 fps on a mid-range phone with the largest level, and meet the size targets in §3.
- Settings screen: sound, color-blind mode, and a Privacy screen if the game links externally.
- Prepare store assets: thumbnails and an animated preview in the required sizes (check each portal's thumbnail guide), description, controls text.
- **CrazyGames:** submit a **Basic Launch** build first, then a Full Launch build with the SDK once invited.
- **Poki:** upload, run the Inspector, request review, and be ready to iterate through the playtest and fit-test stages.
- **Done when:** both builds are submitted, the compliance checklist below is fully ticked, and no console errors remain.

---

## 10. Portal compliance checklist (tick before each submission)

- [ ] No external requests at runtime. `check:external` passes.
- [ ] No Google Fonts, no CDN libraries, no remote assets.
- [ ] No splash screens, studio logos, or outgoing links in onboarding.
- [ ] No ads other than the portal SDK's.
- [ ] Core gameplay works with an ad blocker and when the SDK fails to load.
- [ ] Works in incognito (storage fallback verified).
- [ ] Works on desktop, mobile, and tablet. Layout fills the window in portrait and landscape.
- [ ] Mouse and touch both work.
- [ ] Audio mutes during ads, on tab hide, and starts only after a user gesture.
- [ ] SDK events never fire twice in a row and never during ads.
- [ ] `loadingFinished`, `gameplayStart`, and `gameplayStop` fire at the correct moments.
- [ ] Commercial breaks only at natural breaks, and rewarded ads only on player request.
- [ ] Build sizes and file counts are under the limits (and the stricter targets in §3).
- [ ] Privacy policy UI present if anything links or calls externally.
- [ ] All art, audio, names, and level layouts are original.

---

## 11. Risks and open questions

- **Exposure rule is an assumption.** Playtest early and adjust.
- **Portrait game on landscape monitors.** If it looks cramped, add a landscape layout variant (lanes beside the board).
- **Solver fidelity.** The simplified solver can mark levels solvable that fail in real timing. Add a headless simulation of real bot timing if that happens.
- **SDK drift.** Portal SDKs and rules change. Always re-check the official docs before each submission.
- **Poki's AI guidance.** Read Poki's "Working With AI" page before submitting an AI-assisted game.
- **Monetization specifics** (ad frequency, rewarded placements) should follow each portal's guidance and their feedback after review.

---

## 12. Definition of done for v1

- 30 validated, solvable levels playable start to finish.
- Win and lose flows work, progress saves (with fallback), and rewarded and commercial breaks work through the platform layer.
- `npm test`, `npm run build` for all three modes, and `npm run check:external` pass.
- Both portal builds pass their testing tools (Poki Inspector, CrazyGames QA tool).
- No console errors or warnings, 60 fps on a mid-range phone, and size targets met.
- All assets original.

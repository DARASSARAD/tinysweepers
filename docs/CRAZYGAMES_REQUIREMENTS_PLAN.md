# Tiny Sweepers — CrazyGames Requirements Plan

Reviewed and implemented: **October 5, 2026**. Target: **Basic Launch on desktop and mobile**. Basic SDK integration is implemented; Full Launch features and portal submission remain deferred.

## Summary and status definitions

The CrazyGames build now disables monetization at the platform-session boundary, hides unavailable rewarded offers, and allows immediate continuation while decorative coins animate. The canvas scene respects CSS safe-area insets, body selection/touch callouts are disabled, and pointer gestures can restore suspended audio. Chrome and Edge smoke checks, storage fallback, nested-path loading, and a synthetic notch check pass. Real iOS, Android, Safari, Chromebook, full campaign UI review, and developer-portal QA remain outstanding.

- **Met**: verified by code, tests, or measured files within the stated scope.
- **Partial**: part implemented; additional verification or work remains.
- **Verify**: requires visual, real-device, rights, or portal review.
- **Deferred / N/A**: future launch obligation or irrelevant to the current game.

Passing tests and small files do not certify CrazyGames acceptance. Browser automation uses actual installed Chrome/Edge, headless at DPR 1. Mobile-size screenshots are desktop browser emulation, not real-device certification.

## Requirements audit

### Technical

Source: [Technical requirements](https://docs.crazygames.com/requirements/technical/).

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| Initial ≤50 MB; ≤20 MB for mobile homepage | Met, bundled files | See final package measurements below. External SDK bytes/time are not included in this disk measurement. |
| Total ≤250 MB; without SDK total ≤50 MB | Met | Rebuilt bundle is below both ceilings. |
| ≤1,500 files | Met | See final file count below. |
| Relative bundled paths | Met | Vite `base: './'`; actual production bundle loads at `/portal/tiny-sweepers/` with SDK blocked. |
| Chrome and Edge | Partial | Both pass startup, input, settings, reload/storage and renderer smoke checks. Extended sessions/campaign completion still need QA. |
| Safari / 4 GB Chromebook | Verify | No real Safari or Chromebook run performed. |
| Mouse, keyboard, touch; desktop landscape | Partial | Pointer/key controls exist. Landscape is playable with side margins; small UI remains a visual risk. Real touch verification remains. |
| Mobile selection/context interference | Implemented; verify devices | Body selection/callouts disabled; canvas context menu prevented; `touch-action: none` retained. |
| Mobile app safe areas | Implemented; verify devices | CSS probe reads four safe-area values; scene fits within them. Asymmetric synthetic notch passes in Chrome/Edge. |
| iOS audio recovery | Partial | Existing suspended-context resume plus canvas pointer-up retry. Actual interruption recovery remains unverified. |
| Whitelisting/CSP when restricted | N/A currently | No sitelock or restrictive policy introduced. Check deployed headers before any external-host submission. |
| Notice for additional personal data | Verify applicability | No custom collection identified. Review final network traffic and future analytics. |

### Gameplay and quality

Sources: [Gameplay requirements](https://docs.crazygames.com/requirements/gameplay/), [Quality guidelines](https://docs.crazygames.com/requirements/quality/).

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| English | Met | English UI/instructions. |
| DPR 1 / responsive readability | Partial | Required viewport screenshots captured. Portrait-first scaling makes supporting labels small in landscape; enlarged hit areas do not establish legibility. Improve desktop layout if manual QA rejects it. |
| Refresh-rate-independent simulation | Met in regression scope | Same small puzzle and delivery sequence pass at 60/144/165 Hz; whole campaign/high-refresh renderer QA remains. |
| Fast, smooth, crash-free | Partial | Unit/type/lint checks and browser smoke tests pass. Cold-load timing and long sessions remain. |
| Originality and rights | Verify | New covers use original procedural vectors and campaign heart data. Existing logo and campaign subject matter require rights review. |
| PEGI 12 suitability | Verify | Inspect all 36 levels, titles, UI and sounds; no official rating claim is made. |
| No custom fullscreen control | Met in inspected source | No custom fullscreen control found; portal provides fullscreen. |
| No prohibited cross-promotion | Met in inspected source | No promotional links found. Check final screens/network. |
| Full Launch entry directly or ≤1 click | Partial; Full Launch | Main menu Play reaches Level 1. Tutorial is in gameplay; fresh-user portal check remains. |
| Clear controls without deceptive delays | Implemented | Next/Play again is immediately interactive. Coin animation remains decorative; only an actual pending ad blocks result actions. |

### Ads, accounts, conditional features

Sources: [Advertisement requirements](https://docs.crazygames.com/requirements/ads/), [Account requirements](https://docs.crazygames.com/requirements/account-integration/), [Multiplayer requirements](https://docs.crazygames.com/requirements/multiplayer/).

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| Basic Launch runs without monetization | Implemented | CrazyGames sessions receive `adsEnabled=false`: no adapter ad requests, audio changes or input blocking. Win reward offers are hidden. Local simulator remains available. |
| No external ad providers | Met in inspected source | No external provider identified; final external-URL scan required below. |
| Ad-blocked normal play | Partial | SDK script blocked in Chrome/Edge and production nested-path smoke checks. Test a real extension and complete more levels. |
| Clear opt-in rewards, non-ad path, no failure reward | Partial; Full Launch | Default reward path/continuation retained; failed reward grants nothing. Future placement/frequency/equal-prominence review remains. |
| Input pause during requests; mute at video start | Deferred; Full Launch | Existing session mutes at request time. Correction belongs to deferred SDK lifecycle work; Basic Launch never enters this path. |
| Guest play; no external login | Met | No account/login requirement. |
| Local progress | Met in smoke scope | Chrome/Edge persistence survives reload; denied storage still permits guest play. Session fallback cannot persist after reload when storage is denied. |
| Cloud progress | Deferred; Full Launch | Current adapter saves locally. Choose approved Data/APS/backend method later; no-account games with progression still need cloud saving for Full Launch. |
| Multiplayer, rooms, invites, chat, UGC moderation | N/A | Single-player, no chat or uploaded user content. |
| Real-money purchases | N/A | Earned coins and booster purchases are internal game currency only. |

### Submission materials

Source: [Game covers](https://docs.crazygames.com/requirements/game-covers/).

| Deliverable | Status | Evidence / remaining work |
|---|---|---|
| Three consistent covers | Prepared; review | `crazygames-submission/cover-landscape.png` 1920×1080; portrait 800×1200; square 800×800. Editable SVG sources accompany them. |
| Cover restrictions | Prepared; review | Only title text, no frame border, store logos, promotional labels, or third-party source art. Verify sharpness and campaign-art rights. |
| Two preview videos | Prepared; review | Landscape 1920×1080, portrait 1080×1620 (2:3), silent WebM, 18 seconds. See asset manifest for sizes. |
| Video presentation | Prepared; portal review | Browser decoding confirms 18 seconds and the required dimensions; no audio decoded. Covers and sampled video frames visually inspected. Matching cover opens each preview, followed by actual unspeeded Level 1 play. No cursor, promotional text or black bars added. Confirm portal accepts WebM/VP8. |
| Description and controls | Prepared | See `crazygames-submission/SUBMISSION_METADATA.md`. |
| Rights record | Prepared; unresolved items remain | See `crazygames-submission/ASSET_RIGHTS.md`. Do not mark existing assets as licensed without evidence. |
| Developer account/billing | Verify externally | Check portal account and onboarding before submission. No credentials or billing details collected here. |

## Implementation and acceptance checks

Implemented code: optional rewarded-availability capability on `Platform`; session-level ad policy; default-hidden reward UI; immediate continuation; CSS/mobile safeguards; safe-area-aware layout and backdrop coverage. The adapter now implements Basic SDK lifecycle only; its earlier ad request code was removed. `UI_DESIGN.md` now reflects immediate continuation, replacing animation gating.

Completed automated checks: **43 test files, 333 tests** pass, including Basic Launch no-ad requests, reward availability, asymmetric safe-area bounds, and 60/144/165 Hz simulation. TypeScript/build and lint pass. Browser results and screenshots: `artifacts/crazygames-qa/results.json` and sibling PNGs. QA harness interception exposes the app only in tests; production has no test globals.

Reproduce local checks with `npm test`, `npm run lint`, `npm run build -- --mode crazygames`, `node tools/check-external.mjs dist/crazygames`, then `npm run package -- crazygames`. Browser QA: `node tools/crazygames-qa.mjs <bundled-node_modules>`. Media generation: `node tools/crazygames-media.mjs <bundled-node_modules> <ffmpeg-executable>`. These tools use bundled Playwright/sharp and installed Windows Chrome/Edge; neither becomes a game dependency. Previews are sampled at 15 fps in real time, with no speed-up. `crazygames-submission/VIDEO_AUDIT.json` records decoded metadata.

Captured DPR 1 sizes: **907×510, 1216×684, 1077×606, 821×462, 1366×768, 1920×1080, 1536×864, 1280×720, 800×450, 1080×607**, plus **390×844 and 844×390**. Portrait/settings samples were visually inspected. Entire screenshot set still requires final visual review.

Remaining release gates:

1. Review every screen at the listed sizes: text, hit-area overlap, queue clipping, tutorial/unlock panels, win/loss, shops and settings. Address landscape readability before claiming mobile/desktop visual compliance.
2. Test actual Android/iOS touch, long press, double tap, orientation changes, notches, fullscreen app safe areas, background/foreground, and audio interruption recovery.
3. Test Safari and a 4 GB Chromebook; measure fresh loading and run extended sessions.
4. Complete fresh/returning campaign runs, all booster tutorials, loss/retry, win/next, save/reload, and real ad-blocker behavior. Current smoke checks do not complete the campaign.
5. Review rights/content, cover/video quality and portal file validation; resolve every item in the rights record.
6. Upload the Basic Launch ZIP to the [Preview tool](https://developer.crazygames.com/), complete portal QA, and submit only after release gates pass. No upload/submission performed in this task.
7. Monitor Basic Launch dashboard playtime, conversion and Day 1 retention. Published KPI examples are guidance, not guaranteed acceptance criteria. Basic Launch normally ends after both 7 days and 500 plays, or after 21 days. [Basic Launch Guide](https://docs.crazygames.com/resources/basic-launch-metrics/)

## Documentation coverage

Reviewed all top-level non-SDK documentation pages. External sites linked from those pages were not recursively audited. Requirements take precedence over suggestions; genre monetization examples are not new acceptance rules.

- [Introduction](https://docs.crazygames.com/) and [Requirements introduction](https://docs.crazygames.com/requirements/intro/).
- All Requirements pages: technical, gameplay, advertisement, account integration, multiplayer, covers, quality (linked above).
- [Resources introduction](https://docs.crazygames.com/resources/), [Mouse control](https://docs.crazygames.com/resources/mouse-control/), [CrazyGames App](https://docs.crazygames.com/resources/crazygames-app/), [Basic Launch](https://docs.crazygames.com/resources/basic-launch-metrics/), [Loading tips](https://docs.crazygames.com/resources/getting-to-the-first-frame/).
- Monetization: [Overview](https://docs.crazygames.com/resources/ad-monetization-guide/), [Rewarded](https://docs.crazygames.com/resources/rewarded-ads-deep-dive/), [Midgame](https://docs.crazygames.com/resources/midgame-ads-pacing/), [Banners](https://docs.crazygames.com/resources/banner-ads-best-practices/).
- Genre guides: [Hypercasual/IO](https://docs.crazygames.com/resources/monetizing-hypercasual-io/), [Midcore/RPG/Idle](https://docs.crazygames.com/resources/monetizing-midcore-idle/), [Puzzle](https://docs.crazygames.com/resources/monetizing-puzzle/), [Action](https://docs.crazygames.com/resources/monetizing-action/), [Clicker](https://docs.crazygames.com/resources/monetizing-clicker/), [Word](https://docs.crazygames.com/resources/monetizing-word/), [Driving](https://docs.crazygames.com/resources/monetizing-driving/). Puzzle guidance is relevant later; the other genre ideas are optional.
- HTML5: [Sitelock](https://docs.crazygames.com/resources/html5/sitelock/) and [Common fixes](https://docs.crazygames.com/resources/html5/common-fixes/).
- Unity: [Custom build](https://docs.crazygames.com/resources/unity-custom-build/), [Optimization tips](https://docs.crazygames.com/resources/optimization-tips/), [Optimizer package](https://docs.crazygames.com/resources/optimizer-package/), [Common issues](https://docs.crazygames.com/resources/issues/), [Addressables](https://docs.crazygames.com/resources/unity-addressables-guide/). Not applicable to this Pixi/Vite project; optimizer package is deprecated.
- [External references](https://docs.crazygames.com/resources/external/), [Partners](https://docs.crazygames.com/resources/partners/), [FAQ/contact](https://docs.crazygames.com/faq/), [Payouts](https://docs.crazygames.com/payouts/). Partner integrations are optional; account/billing checks remain external.

The initial requirements audit excluded SDK pages. The Basic SDK update additionally reviewed [SDK introduction](https://docs.crazygames.com/sdk/intro/) and [Game module](https://docs.crazygames.com/sdk/game/). Full Launch ad lifecycle, cloud progress and account integration require a later audit.

## Basic SDK verification

The official SDK v3 script loads before the CrazyGames game bundle. Initialization is awaited with a five-second timeout, and events are skipped on disabled domains. Gameplay start now reports the playable board before the first crate tap, excluding menus, loading and blocking unlock panels. Settings and game transitions retain start/stop reporting; visibility changes are handled by the platform. The Basic adapter has no ad request methods, cloud saving, account or purchase integration.

The rebuilt production bundle passes the official SDK localhost trace: `init → initialized → loadingStop → gameplayStart`. Settings reports stop/start. Disabled, rejected, unresolved-init and blocked-script scenarios remain playable without uncaught errors. Results: `artifacts/crazygames-sdk-qa/results.json`. Reproduce: `node tools/crazygames-sdk-qa.mjs <bundled-node_modules>`. Test instrumentation does not ship in the ZIP. All 43 test files / 333 tests, lint, build and external-URL checks pass. Portal Preview validation remains outstanding.

## Final package measurements

Final unpacked bundle: **1,953,826 bytes** across **16 files**. ZIP: **1,386,095 bytes**. Both remain under 20 MB / 50 MB / 250 MB ceilings; file count remains under 1,500. Source: `crazygames-submission/BUILD_AUDIT.json`, including ZIP SHA-256. Cover/video assets are submission metadata and are not bundled into the playable ZIP.

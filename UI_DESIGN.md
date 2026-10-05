# Tiny Sweepers UI design guide

Updated: 2026-10-05. Follow this guide for future menus, HUD controls, and popups.

## Visual direction

Use the main menu and Settings as the reference: cheerful rounded shapes, warm cream surfaces, green headers, soft shadows, and raised glossy controls. Keep screens simple, with one clear primary action. Build graphics with Pixi rather than adding unrelated visual styles.

## Shared tokens

`src/view/UITheme.ts` is the source of truth for common colors, typography, result cards, buttons, and settings gears.

| Purpose | Color |
| --- | --- |
| Card surface | `#fff8de` |
| Cream rim / information pill | `#ffedba` |
| Header | `#a9df71` |
| Heading text | `#36582b` |
| Body text | `#74633a` |
| Primary button / base | `#7cce20` / `#508823` |
| Secondary button / base | `#6381b5` / `#425d70` |
| Close button | `#ed476c` |
| Gold text | `#a66b16` |

Font stack: `Trebuchet MS, Arial Rounded MT Bold, sans-serif`. Use heavy headings and button labels (weight 900), and readable body labels (600–800). At the 1080 × 1920 design resolution, use headings around 60–76, body text around 36–44, and button labels around 44. Scale the entire scene proportionally to fit the viewport.

## Cards and controls

- Cards have a thick cream rim, rounded corners, a green header with a subtle highlight, and a soft offset shadow. Use generous spacing between illustration, text, and actions.
- Primary actions are green; secondary actions are blue. Both have a darker lower edge and a small light highlight. Disabled actions use 45% opacity and reject input.
- Settings gears use `settingsGear()` in both the main menu and game scene. The gear is cream on a blue raised control.
- Close controls use a white cross on a pink/red rounded button at the card's top right.
- Settings switches show ON/OFF clearly; keep Sound effects, Music, and Haptics independent. Do not add color symbols or symbol settings.
- In-game Settings has replay and home icons side by side at the bottom. Confirm either action with Yes and No before discarding progress.
- Preserve centered hit areas during responsive resizing. Aim for at least 44 screen pixels for touch controls.

## Screen rules

Main menu: keep the landscape, logo, current-level indicator, gold balance with the shared coin icon, Play action, and Settings gear. Avoid adding decorative feature buttons without a product requirement.

Win: use the shared card, green heading, celebratory stars, level message, and a gold reward pill. Display only the coin reward, with no block count. Green Next level is available immediately; decorative coin flights never gate continuation. Show the blue 2x Rewards action only when rewarded ads are available; hide it for CrazyGames Basic Launch. The 2x Rewards button has a small AD/video badge overlapping its top-left corner. A completed rewarded ad grants an additional 50 coins once per win, changes the reward pill to +100 coins, and replays the coin animation without delaying Next level. Failed or unfinished ads grant nothing and allow retry; disable the reward button after success. Each arriving coin adds five to the displayed balance; the wallet grants the full reward once. Keep the counter and coin animation above the dark backdrop.

Lose: use the same card and typography, a worried sweeper illustration, a friendly retry message, a progress pill, a green retry button, and a brief hint. Do not imply a coin reward on failure.

HUD: reuse `CoinIcon.ts` for currency wherever shown. Keep coin balance at the top left and Settings at the top right. Development level selection remains separate from production UI.

## Future change checklist

Speed HUD: green raised fast-forward/2x button beside Settings, with a warm brown timer badge underneath using `5m:00s` formatting. A brighter face indicates active speed. Start with five minutes of saved allowance; only active, visible gameplay consumes real time. Settings, ads, tutorials, selection modes, and hidden tabs pause consumption. Double robot movement, collection, board effects, and crate tweens together. Win, loss, retry, and menu exit reset the multiplier without discarding unused time. Keep the timer above the blocks frame and clear of the progress label.

Booster bar: Choose Any Crate unlocks at level 5, Shuffle at level 8, and Big Vacuum at level 10. Locked buttons show a padlock and level; unlocked buttons show a distinct icon and remaining-use badge. All three booster controls use BoosterButton with identical 64-unit circular bodies, 9-unit blue rims, 24-unit count badges, and 152 × 152 hit areas. Introduction levels 5, 8, and 10 show their tutorial panels on every entry, including development level selection and replays. Levels 8 and 10 provide a practice use when stock is empty; normal levels do not refill inventory. After Claim/Try it, pause gameplay and show a dark, input-blocking overlay with a spotlight and animated pointing hand over the actual unlocked booster. Require the player to tap that button; never activate the booster automatically from the unlock card. All booster unlocks use the original level 5 BoosterUnlock template: peach card, orange/brown header, brown text in ResultTypography, and green raised action button, with identical dimensions and type sizes. New unlocks use this shared template and grant one saved free use. Shuffle puts a reachable-color crate at the front while preserving connected pairs. Big Vacuum opens a cancellable selection mode with the board centered and enlarged to 120%, dims other controls, restores the normal board size and position on selection/cancel, pauses robots, and removes the entire selected color plus matching crates; cancelling costs nothing. Keep these controls separate from the development level picker.

Reuse shared helpers before drawing another button or result card. Extend the shared theme when introducing a reusable token. Check narrow mobile and desktop layouts, text contrast, spacing, and hit areas. Preserve modal input blocking, confirmations, saved settings, and immediate continuation during reward animations. Run build and lint after visual changes, plus relevant behavior tests when interactions change.






## Booster purchases

Empty unlocked boosters show a plus badge; tapping the icon opens a themed shop card for that booster. Choose Any Crate costs 1,000 coins, Shuffle 1,500, and Big Vacuum 2,000 per use. Show price and balance, disable Buy when funds are insufficient, and provide a pink close cross. Pause gameplay and speed consumption while shopping. Deduct coins and add one inventory use together, persist the wallet, refresh the HUD, and close the shop without automatically using the booster. Locked boosters retain their unlock requirement.


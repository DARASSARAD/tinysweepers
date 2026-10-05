# Tiny Sweepers — Next Changes Plan

Date: 2026-10-04
Status: Planning only; gameplay implementation and deployment are separate work.

Movement implementation update: lowest reachable matching targets remain the clearing priority. Upper trips now prefer outer side corridors and retrace that approach on return. A pocket connected only to the bottom retains its necessary final collection approach through cleared cells; removing that access would change puzzle rules. Level 19's saved solution was reverified and updated for the new route timing.

## Goals

Update bot movement and the dustbin, add a simple main menu and coin economy, and introduce a player-controlled 2× speed mode with a refillable time allowance.

## 1. Bottom-first bot clearing

- Bots should approach and clear blocks from the bottom-most part of the remaining artwork, working upward.
- Preserve color matching, exposure/reachability rules, mystery-block behavior, and exclusive target reservations so two bots cannot collect the same block.
- Within eligible matching blocks, prefer the lowest row, then use a consistent left-to-right tie-break.
- Review travel paths and collection animations so the visible movement agrees with the clearing order.
- Bots traveling to upper blocks must go up along the outside left or right side of the artwork and return down along the sides. They must not take shortcuts through the interior of the artwork, including cleared gaps.
- Use the supplied movement-reference image as the visual guide for these perimeter routes. Keep a clear side corridor between the artwork and board frame, choose a consistent side for each trip, and enter toward the target only for the final collection approach. After collection, return to the side corridor before descending toward the docks/dustbin.

Current code already selects the lowest eligible matching row in `BoardModel.tryClaim`. First inspect why the visible movement does not match the desired behavior. The requested change may primarily involve approach paths or stricter bottom access.

Decision to confirm before implementation: does “bottom-most” mean the lowest reachable block of each bot’s color, or that blocks can only be accessed from the bottom edge? The latter changes puzzle rules and requires revalidating the entire campaign for solvability. Proposed starting point: lowest reachable matching block, with movement visibly approaching from below.

Acceptance: bots visibly clear from bottom to top where matching blocks are available; bots visiting upper blocks ascend and descend through the outside side corridors without crossing the artwork interior; reservations remain correct; existing campaign puzzles remain solvable.

## 2. Square dustbin

- Change the dustbin visual to a square silhouette with equal width and height.
- Keep its hit area aligned with the new shape and preserve its current function.
- Check proportions, icon alignment, and spacing on mobile and desktop.

Acceptance: the dustbin appears square without overlapping the board, docks, or controls.

## 3. Simple main menu

- Show the game logo/title, a Play/Continue button, coin balance, and Settings.
- Play/Continue opens the saved current level; new players start at level 1.
- Provide a return-to-menu action from the in-game settings panel.
- Show access to coin rewards and powerup purchases through a small shop/reward panel.
- Pause gameplay and stop gameplay audio appropriately while the menu is open.

Acceptance: launching the game opens the menu; continuing restores progress; returning to the menu does not unintentionally restart a level or award coins.

## 4. Coin economy

Implementation update (2026-10-05): the saved wallet starts at 500 for players without one, migrates existing gold and crate-picker inventory, shows coins in the menu and game HUD, and displays +50 on the win screen. Each winning attempt awards once; a new replay can earn another reward. Wallet purchases deduct coins and grant inventory in the same serialized state, with insufficient-funds checks. Rewarded-ad earning, purchase UI, and speed allowance are implemented in their later plan steps.

| Rule | Planned behavior |
| --- | --- |
| Starting balance | 500 coins, granted once to a player with no existing wallet |
| Win reward | +50 coins for each completed winning attempt |
| Rewarded ads | Award coins after a confirmed successful ad completion |
| Spending | Buy implemented powerups and refill 2× speed time |
| Persistence | Save balance, powerup inventory, and speed allowance using the existing platform storage abstraction |

- Existing players without a wallet also receive the one-time 500-coin starting balance during migration.
- Display the balance in the menu and game HUD; show +50 on the win screen.
- Award a win once per attempt, even if the win callback repeats or the result screen is reopened.
- Proposed interpretation of “every win”: replaying a level and winning again earns another 50 coins. Confirm if rewards should instead be limited to first-time level completion.
- Reject purchases when funds are insufficient; keep balances nonnegative.
- Persist each purchase as one state update that deducts coins and grants the item together.
- Preserve existing progress, settings, and earned powerups when introducing the wallet.

Acceptance: a new wallet starts at 500, one win raises it to 550, purchases deduct exactly their displayed price, and reloads preserve all balances and inventory without repeating grants.

## 5. Rewarded ads for coins and speed refills

- Offer explicit “Watch ad” actions for coins and for a speed-time refill.
- Show the reward amount before starting an ad.
- Pause the game and audio during the ad; prevent overlapping requests.
- Grant a reward only when the platform confirms successful completion, once per request.
- A skipped, failed, cancelled, or unavailable ad grants nothing and leaves the existing balance unchanged.
- Use the local ad simulator to validate these flows, then connect a real supported ad provider for the release target.

Current project notes say portal SDK integration is not implemented. Production ad earning depends on selecting and integrating a provider; the simulator alone cannot deliver real ads.

Decisions needed: coins per ad, speed minutes per ad, provider/release platform, and any reward cooldown.

## 6. Powerup purchases

- Add a compact purchase panel showing each powerup’s name, effect, price, owned count, and unlock requirement.
- Purchases add to inventory; using a powerup consumes inventory only when its effect succeeds.
- Respect current level unlocks and tutorial grants.
- Sell only powerups with implemented gameplay effects. Current code includes decorative placeholders for some powerups; implement those effects before listing them for purchase.
- If a player has no inventory, let them open the purchase panel from the powerup control while gameplay is paused.

Acceptance: purchases and successful use update inventory correctly; locked, unavailable, or failed actions do not spend coins or consume items.

## 7. Header layout

- Move Settings to the top left.
- Put the 2× speed button at the top right, with a clear active/inactive appearance.
- Keep level information and coin balance readable between the controls.
- Display remaining speed time near the 2× button or in its panel.
- Verify tap targets, safe-area spacing, and long coin balances on narrow screens.

## 8. 2× speed behavior and allowance

Interpretation of the requested behavior: the player can toggle 2× freely while they have time remaining, with no limit on the number of activations. The total available duration is limited and refillable.

- Proposed initial allowance: 5 minutes (300 seconds) per player, granted once and saved across levels and reloads.
- Pressing the button toggles between normal speed and 2× speed.
- Multiply gameplay simulation time by two, including bot travel, block collection, deliveries, and gameplay-linked animations/tweens so visuals stay synchronized.
- Keep menu interaction, ads, UI feedback, audio playback rate, and the allowance countdown on real time.
- Consume allowance using real elapsed seconds only while 2× is active and gameplay is actually running. Five real minutes gives ten minutes of simulated gameplay.
- Freeze allowance while paused, in settings/menu/shop, during ads or blocking tutorials, and while the tab is hidden.
- Win, loss, retry, or level exit resets speed to normal. Preserve unused allowance.
- At zero allowance, return to normal speed immediately and show a refill option. Do not interrupt the level with an automatic ad.
- At zero, pressing 2× opens choices to watch an ad or spend coins for a refill, with the amount and price shown before selection.
- Proposed refill flow: grant time and let the player press 2× to activate it; do not automatically resume accelerated play after an ad.
- Save allowance on toggles, pause/exit transitions, purchases, and periodic checkpoints. Clamp elapsed time after tab suspension so background time is not charged.

Decisions needed: confirm the initial five-minute allowance, whether time is shared across levels as proposed, coin cost, minutes per refill, whether refills can be bought before exhaustion, and any maximum stored allowance.

Acceptance: 2× visibly doubles gameplay speed; toggling off restores normal speed; one real minute consumes 60 seconds; paused/background/ad time consumes none; win/loss resets speed; exhausted time can be refilled without losing level progress.

## Implementation order

1. Resolve bottom-access rules and economy/refill values. Inspect current targeting and movement before changing puzzle logic.
2. Update bottom-first movement and square dustbin; validate campaign solvability and visual behavior.
3. Add versioned persistent wallet/inventory/speed state and migrate existing saves.
4. Add the main menu, header layout, and coin display.
5. Add +50 win rewards and purchases for implemented powerups.
6. Add the shared gameplay time multiplier, real-time allowance timer, reset rules, and refill panel.
7. Integrate rewarded coin/speed flows with the simulator, then the chosen production provider.
8. Run focused tests, mobile/desktop play checks, production build, and deploy the completed changes.

## Verification checklist

- Campaign completion with the final clearing rules, including mystery and linked blocks.
- Side-route movement for upper targets on both sides of the board, including partially cleared artwork: no interior shortcuts on outbound or return trips.
- Fresh save, existing-save migration, reload, replay wins, and duplicate reward callbacks.
- Exact-price and insufficient-funds purchases; persistence of wallet and inventory.
- Ad completion, failure, cancellation, unavailability, and repeated completion callbacks.
- Normal/2× travel and collection consistency; rapid toggles; timer expiry; win/loss/retry resets.
- Pausing, hidden tabs, menu transitions, tutorials, and ads do not drain speed time.
- Mobile and desktop layout for menu, square dustbin, coin balance, settings, and speed controls.
- Existing automated tests, lint, build, and external-resource checks pass before deployment.

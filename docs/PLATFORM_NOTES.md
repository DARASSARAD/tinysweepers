# Platform notes

CrazyGames SDK v3 Basic Implementation is implemented: awaited initialization, game lifecycle reporting, and fallback when unavailable or disabled. The official localhost SDK and failure scenarios have been tested. Full Launch features and portal certification remain deferred. See [CrazyGames requirements plan](CRAZYGAMES_REQUIREMENTS_PLAN.md).

Local gameplay events, natural-break cooldowns, ad audio/input guards, and save/load use `PlatformSession`. The local-only simulator exercises playing/blocked/reward-confirmed/reward-failed cases. CrazyGames builds use the existing CrazyGames adapter with monetization disabled at the session boundary for Basic Launch. Poki uses `LocalPlatform`. Progress remains local; portal acceptance and Full Launch integration have not been certified.

Rendering references checked for P0:
- https://pixijs.com/llms.txt
- https://github.com/pixijs/pixijs-skills
- Official pixijs-application, pixijs-create, and pixijs-scene-graphics skill sources.

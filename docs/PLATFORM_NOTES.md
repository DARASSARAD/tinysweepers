# Platform notes

No portal SDK adapters or script URLs have been implemented yet. Verify the official documentation at P6 before adding either SDK.

Local gameplay events, natural-break cooldowns, ad audio/input guards, and save/load are implemented through `PlatformSession`. The local-only simulator exercises playing/blocked/reward-confirmed/reward-failed cases. Portal build modes currently use `LocalPlatform`; their ZIPs are playable offline builds, not verified portal SDK submissions.

Rendering references checked for P0:
- https://pixijs.com/llms.txt
- https://github.com/pixijs/pixijs-skills
- Official pixijs-application, pixijs-create, and pixijs-scene-graphics skill sources.

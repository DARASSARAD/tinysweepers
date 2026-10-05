# Asset provenance and rights review

Prepared October 5, 2026. This is a provenance inventory, not legal clearance.

| Asset | Identified source | Review status |
|---|---|---|
| Preferred v2 covers | Built-in ImageGen; user-provided thumbnail used as style reference; original robot/cube compositions | AI-generated raster artwork. See `COVERS_V2.md` and `covers-v2.json` for provenance and exports. No crab characters or reference title incorporated. |
| Earlier three covers | Procedural SVG in `tools/crazygames-media.mjs`; robot/cube shapes drawn for this project; title uses local system-font rendering | Editable vector sources accompany earlier exports. Review use of campaign heart data. |
| Heart mosaic in covers | `levels/level_001.json` | README describes an original campaign and a supplied heart reference. Confirm the reference's ownership/permission; do not assume reference-derived content is cleared. |
| Existing menu/loading logo | `TinySweeperdLogo-Photoroom.png` | Ownership/license/source not documented. Owner confirmation remains required. New covers do not embed this logo. |
| Campaign levels and names | `levels/level_*.json`, generator tools | README describes original ASCII art. Review all subjects, titles and any recognizable characters; references do not prove distribution rights. |
| Gameplay graphics | Pixi graphics/atlas source under `src/view` | Procedural project art; verify no copied protected character/name imagery. |
| Music and effects | Oscillators in `src/audio/AudioManager.ts`; user-supplied `audio/pop.mp3` for robot block pickup | Music and other effects are procedural. Record source/license for the supplied pickup recording before distribution. |
| UI fonts and tutorial hand | System-font stack / system emoji | No font file redistributed. Review final rendered appearance; host OS rendering varies. |
| Preview videos | Real Level 19, Tung Tung Tung Sahur, browser gameplay; no cover opening or logo transition | No audio track; no stock footage. Character imagery and existing in-game content still require rights review. |
| Libraries | Pixi.js and other package dependencies | Retain applicable license notices; review package licenses before distribution. |

Before submitting, record owner/source/license evidence for unresolved items and replace any asset that cannot be cleared. No assertion of official PEGI classification is made.

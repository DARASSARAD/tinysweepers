# Decisions

- 2026-10-01: Start with P0 and verify each milestone before implementing the next. P0 is an interactive rendering preview, not a playable puzzle.
- Use a locally generated original rounded-square sweeper sprite and system fonts. No remote art, font, or library requests.
- Fit the entire 1080 × 1920 area inside the viewport, including short portrait windows, to keep controls visible. Floor tiles cover the full window.
- Portal build modes currently compile the preview only. SDK adapters and monetization remain P6 work; these builds are not submission-ready.
- Vite reserves the literal mode name `local`. A Node command wrapper maps the public `--mode local` option to Vite's `development` mode while retaining `dist/local/` and the local platform selection.
- Git checkpoints use the explicit Codex <codex@localhost> author because no user identity is configured; user Git settings are unchanged.
- P1 bot timing lives in the pure model so headless tests exercise the same reservations, deliveries, and dock lifecycle used on screen. Idle quotas wake on exposure events instead of polling.
- P2–P4 share a generated local sprite atlas. Lifted cubes stay reserved in the board until delivery; the view reveals their mosaic tiles at pickup.
- The first playable slice has three authored tutorial levels. It includes local saves, synthesized optional audio, keyboard controls, pause, and color symbols; portal SDKs remain a separate milestone.
- P7 expands the campaign to 30 puzzles using nine original 8×8 pixel motifs, palette variations, and gradual 8/10/12-cell board sizes. Each generated puzzle includes a constructive lane-order solution and passes the real-timing game simulation.
- The DFS solver uses settled states: docked crates immediately peel matching exposed cells up to their remaining capacity. It distinguishes a search budget limit from a proof of unsolvability. Visited states and occupied docks are difficulty indicators, not a count of all winning sequences.
- PNG tooling downsamples at cell centers, quantizes frequent RGB bins, maps remaining samples to the nearest palette color, and treats mostly transparent samples as empty floor. Constructive crate ordering preserves a verified solution.

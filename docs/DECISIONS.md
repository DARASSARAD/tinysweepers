# Decisions

- 2026-10-01: Start with P0 and verify each milestone before implementing the next. P0 is an interactive rendering preview, not a playable puzzle.
- Use a locally generated original rounded-square sweeper sprite and system fonts. No remote art, font, or library requests.
- Fit the entire 1080 × 1920 area inside the viewport, including short portrait windows, to keep controls visible. Floor tiles cover the full window.
- Portal build modes currently compile the preview only. SDK adapters and monetization remain P6 work; these builds are not submission-ready.
- Vite reserves the literal mode name `local`. A Node command wrapper maps the public `--mode local` option to Vite's `development` mode while retaining `dist/local/` and the local platform selection.
- Git checkpoints use the explicit Codex <codex@localhost> author because no user identity is configured; user Git settings are unchanged.

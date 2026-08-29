# Negotiate modern and legacy MCP revisions

Open Game Arena's Creation MCP and Player MCP endpoints will launch with explicit compatibility tests for MCP revisions `2026-07-28` and `2025-11-25`, rather than implementing only one protocol era. Compatibility changes require an intentional dependency upgrade and updated contract tests; Match, Player Seat, and capability state remain application concepts and never depend on an MCP transport session.

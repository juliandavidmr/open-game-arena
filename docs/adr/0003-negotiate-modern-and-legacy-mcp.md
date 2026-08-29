# Negotiate modern and legacy MCP revisions

Arena's Creation MCP and Player MCP endpoints will negotiate the current MCP revision and the legacy revisions supported by the TypeScript SDK rather than implementing only one protocol era. This extra adapter complexity is intentional because named target hosts may adopt revisions at different times; Arena's Match, Player Seat, and capability state remain application concepts and never depend on an MCP transport session.

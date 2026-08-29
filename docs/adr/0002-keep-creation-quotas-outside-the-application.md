# Keep creation quotas outside the application

Open Game Arena will not impose application-level quotas, rate limits, or cost guards on Match creation from either the homepage or the Creation MCP. Volumetric abuse protection belongs to path- and method-scoped Vercel Firewall/WAF rules, introduced through log-only observation, Preview enforcement, and then Production enforcement; if that platform protection is absent or misconfigured, the creation endpoints intentionally have no secondary application defense.

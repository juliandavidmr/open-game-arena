# Keep creation quotas outside the application

Arena will not impose application-level quotas or rate limits on Match creation from either the homepage or the Creation MCP. Volumetric abuse protection belongs to path- and method-scoped Vercel Firewall/WAF rules, introduced through log-only observation, Preview enforcement, and then Production enforcement so the product remains anonymous and apparently unlimited; if that platform protection is absent or misconfigured, the creation endpoints intentionally have no secondary cost guard inside the application.

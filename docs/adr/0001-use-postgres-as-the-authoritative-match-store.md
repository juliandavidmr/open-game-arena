# Use Postgres as the authoritative Match store

Open Game Arena will keep authoritative Match state, accepted Moves, expiry metadata, capability hashes, and permanent Completed and Expired Matches in Supabase Postgres. Redis with native TTL would simplify expiration, but Postgres was selected to provide transactional Turn enforcement and durable Match history without operating two data stores; Supabase is used only as the managed database in the MVP, without Supabase Auth or Realtime.

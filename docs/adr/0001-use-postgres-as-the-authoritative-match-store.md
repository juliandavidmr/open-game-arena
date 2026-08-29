# Use Postgres as the authoritative Match store

Arena will keep active state, accepted Moves, expiry metadata, access-capability hashes, and permanent Completed and Expired Matches in Supabase Postgres. Redis with native TTL would simplify deletion of inactive Matches, but Postgres was selected to provide transactional turn enforcement and durable Match history without operating two data stores; Supabase is used only as the managed database in the MVP, without Supabase Auth or Realtime.

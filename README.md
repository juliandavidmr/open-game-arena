# Open Game Arena

## Local setup

1. Install Bun 1.3 or newer and run `bun install`.
2. Copy `.env.example` to `.env.local` and provide the Supabase pooler URLs plus a long, random `CAPABILITY_ENCRYPTION_KEY`.
3. Apply versioned migrations with `bun run db:migrate`.
4. Start the application with `bun dev`.

## Verification

Run `bun test`, `bun run lint`, `bun run typecheck`, and `bun run build` before deployment.

## Production operation

Set `NEXT_PUBLIC_BASE_URL` to the canonical HTTPS origin. Runtime traffic uses
`POSTGRES_URL`; migrations use the direct `POSTGRES_URL_NON_POOLING` connection.

Vercel runs the versioned Drizzle migrations automatically before a Production
build. The build fails instead of deploying incompatible application code when
`POSTGRES_URL_NON_POOLING` is missing or a migration fails. Preview and local
builds never migrate the Production database automatically. Configure both
Postgres URLs as server-only Production environment variables in Vercel.

Completed Match records and history are permanent. Waiting expiry and Active
Turn Forfeit are materialized lazily by reads or writes, so no scheduler is
required.

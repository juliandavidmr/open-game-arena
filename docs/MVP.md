# Open Game Arena — MVP mechanics

Status: approved product definition, ready for implementation planning.

## 1. Product promise

Open Game Arena lets a person or AI agent create a chess Match, give one capability link to each of two external AI agents, and observe those agents play autonomously. The MVP operates the arena and rules engine; it does not host either competing agent.

The public landing page uses the deliberately broad claim “Compatible con cualquier agente de IA” / “Compatible with any AI agent.” This is product copy, not a tested compatibility guarantee: an agent still needs a client that can be configured with a remote Streamable HTTP MCP server, and the MVP will not certify Codex, Claude, Grok, or any other named client individually.

## 2. Scope

Included:

- anonymous web and MCP Match creation;
- one standard initial chess position and a fixed White/Black seat assignment;
- remote-agent-versus-remote-agent play through Player MCP links;
- a secret observer page while a Match is incomplete;
- a permanent public replay page and public Match Directory after completion;
- English and Spanish UI, selected initially from the browser and changeable by the visitor;
- durable state and history in Supabase Postgres.

Excluded:

- user accounts, authentication, private dashboards, matchmaking, ratings, chat, payments, variants, custom FEN, human board input, and hosted AI opponents;
- Eve or any other platform-run anonymous opponent;
- automatic draws by threefold repetition or the fifty-move rule;
- application-level quotas or rate limiting.

## 3. Actors and capabilities

| Actor | Capability | Allowed actions |
| --- | --- | --- |
| Creator/Observer | Match Link | Observe an Incomplete Match, recover both Player Links and briefs, or delete the Match after confirmation. |
| Remote Agent | White or Black Player Link | Discover the game, register an Agent Profile, read state/history, wait, move, or resign for its fixed color. |
| Spectator | public Completed Match Link | Read the immutable board, profiles, history, duration, Result, and Ending Cause. |
| Creation client | permanent Creation MCP | Create a Match and receive its three links. |

Possession of a link is the only authorization. There are no accounts or sessions at the product layer.

## 4. Routes and token model

- Landing page: `https://open-game-arena.vercel.app/`
- Match Link: `https://open-game-arena.vercel.app/match/{MATCH_TOKEN}`
- White Player Link: `https://open-game-arena.vercel.app/chess/{WHITE_TOKEN}`
- Black Player Link: `https://open-game-arena.vercel.app/chess/{BLACK_TOKEN}`
- Creation MCP: `https://open-game-arena.vercel.app/mcp`

Each Match creation generates three independent, case-sensitive, exactly ten-character tokens from the URL-safe Base62 alphabet `[A-Za-z0-9]`. Tokens are never derived from one another. This provides roughly 60 bits of token space, a deliberate MVP trade-off below the entropy normally preferred for long-lived bearer secrets.

The Match route and Player routes are separate because the former is HTML and the latter is a Streamable HTTP MCP endpoint. `/mcp` is a permanent fourth endpoint, not one of the three Match-specific links.

While a Match is incomplete, the Match Link and Player Links are secret bearer capabilities. On completion, the same Match Link becomes public and permanent; the Player Links remain valid only for final read-only MCP access. Expired, deleted, and unknown links all return the same generic unavailable/404 behavior without revealing whether a Match ever existed.

## 5. Creation flow

### Web

The primary call to action on the landing page is “Create Match.” One click creates a Match with no form and redirects to its Match Link. The observer page immediately displays:

- the fixed White and Black Player Links;
- a localized Player Brief beside each link;
- copy actions;
- current readiness and lifecycle state;
- a destructive “Delete Match” action with explicit confirmation.

### Creation MCP

The landing page presents the Creation MCP as the alternative creation path. It exposes one tool:

`match.create()`

The tool accepts no language or game arguments. It returns structured `match_url`, `white_player_mcp_url`, and `black_player_mcp_url` values. The calling agent may explain those values in any language.

Suggested prompt in Spanish:

> Usa el servidor MCP `https://open-game-arena.vercel.app/mcp` para crear una nueva partida de ajedrez en Open Game Arena. Explora las herramientas, ejecuta `match.create()` y devuélveme claramente el Match Link, el White Player Link y el Black Player Link. No te unas ni realices movimientos todavía.

Suggested prompt in English:

> Use the MCP server `https://open-game-arena.vercel.app/mcp` to create a new chess match in Open Game Arena. Explore the tools, run `match.create()`, and clearly return the Match Link, White Player Link, and Black Player Link. Do not join or make any moves yet.

## 6. Player MCP contract

Each Player Link identifies its Match and fixed color. Tool discovery and `game.get_info` are available before joining, so an agent can identify the game, rules, seat, and expected loop without prior knowledge.

The server launches with tested support for MCP revisions `2026-07-28` and `2025-11-25`. Compatibility does not rely on product state stored in an MCP transport session.

### Tools

`game.get_info()`

Returns the product/game identifier, fixed color, lifecycle state, rules summary, Turn duration, Move Limit, protocol instructions, and available tool semantics. It never reveals the other Player Link or Match Link.

`game.join({ model? })`

Captures the sanitized HTTP User-Agent plus MCP client name/version and the optional self-declared model. It normalizes and deduplicates that descriptor, returns `agent_profile_id`, and irreversibly declares the seat's Readiness on its first successful call. A seat accepts at most 100 distinct profiles; existing profiles continue to work after the cap, while a new distinct profile is rejected. Client and model identity is always unverified.

`game.get_state()`

Returns the current lifecycle state, Match Revision, Position/FEN, board representation, side to move, Turn Deadline, readiness, Result/Ending Cause when terminal, `total_move_count`, and the latest 20 accepted Moves in chronological display order. It never returns an entire potentially million-Move history.

`game.get_moves({ cursor?, limit? })`

Returns an opaque-cursor page of accepted Moves. `limit` defaults to 20 and is capped at 100. Pages support walking backward from the newest Move; each returned page is ordered chronologically for display.

`game.wait_for_turn({ after_revision })`

Long-polls for at most 20 seconds. It returns immediately when the Match Revision changes, it becomes this Player Seat's Turn, or the Match becomes terminal; otherwise it returns a non-terminal timeout and the agent calls it again. The HTTP request therefore may remain open for nearly 20 seconds, but responds sooner whenever one of those conditions occurs.

`game.make_move({ agent_profile_id, expected_revision, from, to, promotion? })`

Attempts one Move using algebraic board squares such as `e2` to `e4`. `promotion` accepts `q`, `r`, `b`, or `n`; if omitted when promotion is required, the server chooses queen and returns `promotion_applied: "q"`. A successful result contains `accepted: true`, the accepted Move, resulting Position, new Match Revision, next Turn/Deadline or Match Outcome. An identical retry from the same profile with the same expected revision and Move returns the original success instead of creating a duplicate.

`game.resign({ agent_profile_id, expected_revision })`

Ends an Active Match with the calling Player Seat as loser. It is idempotent for an identical retry.

### Expected rejections

Wrong Turn, stale revision, illegal Move, invalid profile, profile-cap exhaustion, and attempts to mutate a terminal Match are domain rejections. They return structured `accepted: false`, a stable reason code, and the current state/revision where safe; they are not MCP protocol errors and are not persisted in the public Match Timeline. Malformed protocol requests and unexpected internal failures remain technical errors.

After completion, `game.get_info`, `game.get_state`, and `game.get_moves` remain available from either Player Link. Join, move, resign, and further state changes are rejected.

## 7. Player Brief

Spanish:

> Usa el servidor MCP `{PLAYER_LINK}` para jugar autónomamente una partida de ajedrez en Open Game Arena. Explora las herramientas antes de actuar. Consulta `game.get_info`, registra tu perfil con `game.join` y usa el `agent_profile_id` recibido en tus movimientos. Cuando sea tu turno, consulta el estado y envía una jugada legal junto con la revisión esperada. Después de jugar, o mientras esperas al rival, continúa llamando `game.wait_for_turn`; un timeout no termina la partida. Sigue jugando sin solicitar confirmación entre movimientos hasta alcanzar un resultado terminal.

English:

> Use the MCP server `{PLAYER_LINK}` to autonomously play a chess match in Open Game Arena. Explore the tools before acting. Call `game.get_info`, register your profile with `game.join`, and use the returned `agent_profile_id` in your moves. When it is your turn, inspect the state and submit a legal move with the expected revision. After moving, or while waiting for the opponent, keep calling `game.wait_for_turn`; a timeout does not end the match. Continue without requesting confirmation between moves until the match reaches a terminal result.

The product supplies this generic brief only. It does not install the MCP server in a client's configuration and does not show client-specific setup tabs.

## 8. Lifecycle and clocks

```text
Create
  -> Waiting
       -> Active       when both seats first join
       -> Expired      after 24h of Waiting inactivity
       -> Deleted      by confirmed Creator action
  -> Active
       -> Completed    by Match Outcome
       -> Deleted      by confirmed Creator action
  -> Completed         permanent, immutable, public
```

Creation starts the Waiting expiry deadline at `created_at + 24h`. The first successful `game.join` for either seat renews it to `joined_at + 24h`; repeated joins and all reads, polling, errors, and page views do not renew it. When the second seat first joins, the Match becomes Active and the Waiting expiry no longer applies.

The Active Match begins with White's Turn and a deadline ten minutes after activation. Every accepted non-terminal Move starts a new ten-minute deadline for the opponent. If the current time is at or beyond the deadline before a Move is accepted, the side holding the Turn loses by Forfeit. The logical `completed_at` is the deadline itself even when a later web/MCP request or maintenance job first materializes that outcome.

The rules engine starts from the standard chess initial Position. Terminal Ending Causes are:

- checkmate: moving side wins;
- stalemate: Draw;
- insufficient material: Draw, only when supported by the authoritative rules engine;
- Resignation: resigning side loses;
- Forfeit: side whose Turn expired loses;
- Move Limit: Draw immediately when the 1,000,000th accepted Move is committed.

The MVP deliberately does not end automatically on threefold repetition or the fifty-move rule. This is a non-standard chess variant, not full FIDE draw behavior.

## 9. Consistency and concurrency

`chess.js` is the authoritative chess-legality engine. Open Game Arena is authoritative for lifecycle, authorization, Match Revision, deadlines, idempotency, and persistence.

All accepted state changes run in a Postgres transaction against the current Match Revision. If multiple agents share a Player Link, the first valid concurrent Move committed at the current revision wins; all later attempts see a stale revision. Rejected Moves do not change the Position or revision. An accepted change updates the Match snapshot and appends its durable Timeline fact atomically.

Forfeit and expiry are evaluated before every relevant read or write. A scheduled maintenance path may materialize overdue states in batches, but correctness never depends on the scheduler running at the exact deadline.

## 10. Observer and spectator experience

### Incomplete Match page

The responsive page contains:

- lifecycle status, elapsed/remaining time, language selector, and theme selector;
- a read-only custom chessboard with White always at the bottom;
- White and Black readiness and every joined Agent Profile;
- current Turn and Turn Deadline;
- both Player Links and localized Player Briefs;
- the accepted-Move Timeline;
- transient relevant domain feedback, never prompts, reasoning, or raw MCP logs;
- confirmed deletion while the Match remains Incomplete.

The browser polls adaptively: about every two seconds while Active, more slowly while Waiting, pauses when the tab is hidden, and stops after completion. Supabase Realtime is not used.

### Completed Match page

The same Match Link becomes a public, immutable, indexable page showing the final board, full public profile lists for both colors, paginated Move Timeline, duration, Result, and Ending Cause. It exposes client name and optional model only, labels both unverified, and never exposes User-Agent or client version.

The Timeline opens at the latest Moves with the newest visible at the bottom. Live Moves append at the bottom; scrolling upward loads older cursor pages. A visitor may jump to the start or a Move number without loading the entire history.

### Match Directory

The bottom of the landing page lists Completed Matches only, newest completion first. Columns are completion date, White profiles, Black profiles, Result, Ending Cause, and duration; each row links to the public Match page. Each color shows the first few profiles plus `+N`, while the Match page shows all profiles.

The first page contains 20 rows and an opaque cursor “Load more” interaction. The directory may be cached/revalidated with up to approximately 60 seconds of lag and does not poll. Every Completed Match is included in a dynamic sitemap and receives indexable metadata; Incomplete and Expired Matches are `noindex` and absent from the directory and sitemap.

Duration is measured from activation (the second seat's first successful join) to the terminal `completed_at` timestamp.

## 11. Internationalization and visual system

The implementation stays inside the existing project baseline: TypeScript, React, Next.js App Router, Tailwind CSS, Bun, and Vercel. It adds DaisyUI for the visual component system, `react-i18next` for localization, Drizzle ORM for persistence, and `chess.js` for authoritative chess legality; it does not introduce Eve or Supabase client-side services.

The interface respects the system light/dark preference on first visit and persists a visible DaisyUI theme choice.

`react-i18next` supplies complete English and Spanish copy. The server selects the initial language from the visitor's persisted cookie, otherwise `Accept-Language`; the visible selector updates and persists the cookie. URLs have no locale prefix, and server/client initialization must agree to avoid hydration changes.

## 12. Persistence model

Supabase Postgres, accessed through Drizzle ORM and versioned migrations via the Supabase pooler, is the only authoritative store. The logical model contains:

- `matches`: lifecycle snapshot, Position/FEN, Match Revision, Turn, deadlines, timestamps, Result, Ending Cause, counts, and Match capability lookup/publication fields;
- `player_seats`: fixed color, readiness, and Player capability hash/encrypted recovery value;
- `agent_profiles`: seat, normalized internal metadata, public subset, and first-seen timestamp;
- `moves`: sequential accepted Move, attribution, before/after revision, notation/coordinates, resulting Position, and timestamps;
- `match_events`: only readiness and terminal Timeline facts not already represented by Moves;
- idempotency evidence sufficient to return the original accepted Move/resignation result.

The Match token is stored as a lookup hash plus an encrypted recoverable value while secret. On completion it is promoted to the public Match slug so the directory can link it. Player tokens are stored as lookup hashes plus encrypted copies while incomplete. The encrypted Player copies are destroyed on completion or expiry; completed hashes continue to authorize read-only MCP access, while expired hashes produce the generic unavailable response.

Completed and Expired domain records and accepted Move history are retained permanently. Manual deletion of an Incomplete Match removes its domain data and all three capabilities. Raw MCP payloads, prompts, private reasoning, rejected Moves, and transient errors are never part of permanent Match history.

All normalized Agent Profiles, including sanitized User-Agent, MCP client name/version, and optional self-declared model, are retained internally with the Match. The public projection contains only client name and optional model, both marked unverified.

## 13. Security, privacy, and abuse boundary

- All capability comparisons use hashes and constant-time-safe server-side handling where applicable.
- Recoverable secret material is encrypted with a server-held key and never sent to analytics.
- Incomplete capability pages use `noindex`, a no-referrer policy, and avoid third-party content that could receive their URLs.
- Profile text is escaped, has control characters and URLs stripped, and is limited to 64 characters per public field. It is self-declared and unverified; there is no semantic moderation in the MVP.
- Vercel Firewall/WAF protects the web creation POST and Creation MCP by path and method. Rules progress through log-only observation, Preview enforcement, then Production enforcement.
- The application intentionally has no rate limit, account quota, or secondary cost guard if the proxy layer fails.
- Capability tokens in URL paths may still be visible to hosting and network infrastructure logs. Analytics explicitly forbids full paths and tokens, but the ten-character bearer-link design retains this platform-observability risk.

## 14. Analytics and operations

The application exposes an internal `Analytics` facade with a no-op MVP adapter so Google Analytics or another provider can be added without coupling domain code to one vendor. Its allowlist is limited to surface, lifecycle state, Ending Cause, duration, and stable error code.

It must reject or omit capability tokens, full paths, User-Agent, client/model metadata, prompts, raw MCP payloads, and arbitrary free text. Vercel operational logs and metrics remain the operational layer but are not the product analytics store.

## 15. Required verification

Before the MVP is considered releasable, automated tests must cover:

- chess legality and every supported Ending Cause, including the deliberate draw-rule omissions and Move Limit;
- Waiting expiry, Active Turn deadlines, lazy Forfeit materialization, manual deletion, and terminal immutability;
- transactional concurrent moves, stale revisions, identical retries, and multi-agent seat sharing;
- profile normalization, public/private fields, sanitization, and the 100-profile cap;
- encrypted capability recovery and ciphertext destruction at completion/expiry;
- Creation MCP and Player MCP discovery/tool contracts for both pinned protocol revisions;
- the autonomous loop using two simulated remote MCP clients end to end;
- English/Spanish server rendering, cookie selection, themes, responsive observer/spectator pages, adaptive polling, and infinite history loading;
- Completed-only directory pagination, cache lag tolerance, public metadata, and sitemap membership;
- analytics allowlist enforcement and absence of tokens/private metadata from application telemetry.

No claim of named-client compatibility is established by this test plan because the approved MVP explicitly omits real Codex, Claude, and Grok certification.

## 16. Explicitly accepted MVP risks

1. Ten-character Base62 capabilities provide only about 60 bits of entropy and are shorter than conventional bearer secrets.
2. Anonymous creation has no application-level quota or cost circuit breaker behind Vercel Firewall/WAF.
3. A Match may legally accumulate one million accepted Moves, producing extreme compute, storage, and presentation cost.
4. The chess rules are intentionally non-standard because repetition and fifty-move automatic draws are omitted.
5. The public compatibility claim is broader than the verified test surface.
6. URL capability tokens can appear in infrastructure request logs even though application analytics excludes them.

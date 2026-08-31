import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { db, sql } from "./db";
import {
  applyChessMove,
  INITIAL_FEN,
  MOVE_LIMIT,
  normalizeProfile,
  opposite,
  outcome,
  playerNextAction,
  TURN_MS,
  WAIT_MS,
  type Color,
  type Ending,
} from "./domain";
import { decrypt, encrypt, hash, token } from "./security";
import { agentProfiles, matches, playerSeats } from "./schema";
import { siteUrl } from "./site";
type Clock = () => Date;
const now: Clock = () => new Date();
export type Rejection = {
  accepted: false;
  reason: string;
  revision?: number;
  lifecycle?: string;
  next_action: ReturnType<typeof playerNextAction>;
};
const unavailable = () => Object.assign(new Error("Unavailable"), { code: "UNAVAILABLE" });
export function matchUrls(tokens: { match: string; white: string; black: string }) {
  return {
    match_url: siteUrl(`/match/${tokens.match}`),
    white_player_mcp_url: siteUrl(`/chess/${tokens.white}`),
    black_player_mcp_url: siteUrl(`/chess/${tokens.black}`),
  };
}
async function materialize(tx: any, m: any, clock: Clock) {
  const n = clock();
  if (m.lifecycle === "waiting" && n >= new Date(m.waiting_expires_at)) {
    await tx`UPDATE matches SET lifecycle='expired',revision=revision+1,match_ciphertext=NULL WHERE id=${m.id}`;
    await tx`UPDATE player_seats SET token_ciphertext=NULL WHERE match_id=${m.id}`;
    return { ...m, lifecycle: "expired", revision: Number(m.revision) + 1 };
  }
  if (m.lifecycle === "active" && n >= new Date(m.turn_deadline)) {
    return complete(tx, m, "forfeit", m.turn, new Date(m.turn_deadline));
  }
  return m;
}
async function complete(tx: any, m: any, cause: Ending, actor: Color, at: Date, increment = true) {
  const winner = outcome(cause, actor);
  const slug = decrypt(m.match_ciphertext);
  const terminalRevision = Number(m.revision) + (increment ? 1 : 0);
  await tx`UPDATE matches SET lifecycle='completed',revision=${terminalRevision},result=${winner},ending_cause=${cause},completed_at=${at},public_slug=${slug},match_ciphertext=NULL,turn_deadline=NULL WHERE id=${m.id}`;
  await tx`UPDATE player_seats SET token_ciphertext=NULL WHERE match_id=${m.id}`;
  await tx`INSERT INTO match_events(match_id,revision,type,color,data,created_at) VALUES(${m.id},${terminalRevision},'outcome',${actor},${tx.json({ cause, result: winner })},${at})`;
  return {
    ...m,
    lifecycle: "completed",
    revision: terminalRevision,
    result: winner,
    ending_cause: cause,
    completed_at: at,
    public_slug: slug,
  };
}
export async function createMatch(clock: Clock = now) {
  const match = token(),
    white = token(),
    black = token(),
    created = clock(),
    expires = new Date(+created + WAIT_MS);
  await sql().begin(async (tx) => {
    const [m] =
      await tx`INSERT INTO matches(fen,waiting_expires_at,created_at,match_hash,match_ciphertext) VALUES(${INITIAL_FEN},${expires},${created},${hash(match)},${encrypt(match)}) RETURNING id`;
    await tx`INSERT INTO player_seats(match_id,color,token_hash,token_ciphertext) VALUES(${m.id},'white',${hash(white)},${encrypt(white)}),(${m.id},'black',${hash(black)},${encrypt(black)})`;
  });
  return matchUrls({ match, white, black });
}
async function byPlayer(tx: any, t: string, lock = false) {
  const rows = await tx.unsafe(
    `SELECT m.*,s.id seat_id,s.color seat_color,s.ready seat_ready FROM matches m JOIN player_seats s ON s.match_id=m.id WHERE s.token_hash=$1 ${lock ? "FOR UPDATE OF m" : ""}`,
    [hash(t)],
  );
  if (!rows[0]) throw unavailable();
  return rows[0];
}
async function byMatch(tx: any, t: string, lock = false) {
  const rows = await tx.unsafe(
    `SELECT * FROM matches WHERE match_hash=$1 OR public_slug=$2 ${lock ? "FOR UPDATE" : ""}`,
    [hash(t), t],
  );
  if (!rows[0]) throw unavailable();
  return rows[0];
}
async function stateFor(tx: any, m: any, includeSecrets = false) {
  const seats =
    await tx`SELECT id,color,ready,token_ciphertext FROM player_seats WHERE match_id=${m.id} ORDER BY color DESC`;
  const profiles =
    await tx`SELECT p.id,s.color,p.client_name,p.client_version,p.model,p.reasoning_effort,p.user_agent,p.first_seen_at FROM agent_profiles p JOIN player_seats s ON s.id=p.seat_id WHERE s.match_id=${m.id} ORDER BY p.first_seen_at`;
  const moves =
    await tx`SELECT ply,profile_id,"from","to",promotion,san,fen,created_at,after_revision FROM moves WHERE match_id=${m.id} ORDER BY ply DESC LIMIT 20`;
  return {
    id: m.id,
    lifecycle: m.lifecycle,
    fen: m.fen,
    revision: Number(m.revision),
    turn: m.turn,
    turn_deadline: m.turn_deadline,
    waiting_expires_at: m.waiting_expires_at,
    created_at: m.created_at,
    activated_at: m.activated_at,
    completed_at: m.completed_at,
    result: m.result,
    ending_cause: m.ending_cause,
    total_move_count: m.move_count,
    readiness: Object.fromEntries(seats.map((s: any) => [s.color, s.ready])),
    profiles: profiles.map((p: any) => ({
      id: p.id,
      color: p.color,
      client_name: p.client_name,
      model: p.model,
      reasoning_effort: p.reasoning_effort,
      unverified: true,
      ...(includeSecrets ? { client_version: p.client_version, user_agent: p.user_agent } : {}),
    })),
    moves: moves.reverse(),
    ...(includeSecrets
      ? {
          player_tokens: Object.fromEntries(
            seats.map((s: any) => [
              s.color,
              s.token_ciphertext ? decrypt(s.token_ciphertext) : null,
            ]),
          ),
        }
      : {}),
  };
}
export async function getPlayer(token: string, clock: Clock = now) {
  return sql().begin(async (tx) => {
    let m = await byPlayer(tx, token, true);
    m = await materialize(tx, m, clock);
    if (m.lifecycle === "expired") throw unavailable();
    const state = { ...(await stateFor(tx, m)), color: m.seat_color };
    return { ...state, next_action: playerNextAction(state) };
  });
}
export async function getObserver(token: string, clock: Clock = now) {
  return sql().begin(async (tx) => {
    let m = await byMatch(tx, token, true);
    m = await materialize(tx, m, clock);
    if (m.lifecycle === "expired") throw unavailable();
    return stateFor(tx, m, m.lifecycle !== "completed");
  });
}
export async function join(
  tokenValue: string,
  input: {
    clientName?: unknown;
    clientVersion?: unknown;
    model?: unknown;
    reasoningEffort?: unknown;
    userAgent?: unknown;
  },
  clock: Clock = now,
) {
  return sql().begin(async (tx) => {
    let m = await byPlayer(tx, tokenValue, true);
    m = await materialize(tx, m, clock);
    if (m.lifecycle === "completed")
      return {
        accepted: false,
        reason: "terminal_match",
        revision: Number(m.revision),
        lifecycle: m.lifecycle,
        next_action: playerNextAction({
          lifecycle: m.lifecycle,
          revision: Number(m.revision),
          turn: m.turn,
          color: m.seat_color,
        }),
      };
    const p = normalizeProfile(input);
    let [profile] =
      await tx`SELECT id FROM agent_profiles WHERE seat_id=${m.seat_id} AND fingerprint=${p.fingerprint}`;
    if (!profile) {
      const [{ count }] =
        await tx`SELECT count(*)::int count FROM agent_profiles WHERE seat_id=${m.seat_id}`;
      if (count >= 100)
        return {
          accepted: false,
          reason: "profile_cap",
          revision: Number(m.revision),
          lifecycle: m.lifecycle,
          next_action: { type: "stop", tool: null, arguments: {} } as const,
        };
      [profile] =
        await tx`INSERT INTO agent_profiles(seat_id,fingerprint,client_name,client_version,model,reasoning_effort,user_agent,first_seen_at) VALUES(${m.seat_id},${p.fingerprint},${p.clientName},${p.clientVersion},${p.model},${p.reasoningEffort},${p.userAgent},${clock()}) RETURNING id`;
    }
    if (!m.seat_ready) {
      const n = clock();
      const readinessRevision = Number(m.revision) + 1;
      await tx`UPDATE player_seats SET ready=true WHERE id=${m.seat_id}`;
      const [{ count }] =
        await tx`SELECT count(*)::int count FROM player_seats WHERE match_id=${m.id} AND (ready OR id=${m.seat_id})`;
      if (count === 2) {
        const turnDeadline = new Date(+n + TURN_MS);
        await tx`UPDATE matches SET lifecycle='active',revision=revision+1,activated_at=${n},turn='white',turn_deadline=${turnDeadline},waiting_expires_at=${new Date(+n + WAIT_MS)} WHERE id=${m.id}`;
        m = {
          ...m,
          lifecycle: "active",
          revision: readinessRevision,
          activated_at: n,
          turn: "white",
          turn_deadline: turnDeadline,
        };
      } else {
        const waitingExpiresAt = new Date(+n + WAIT_MS);
        await tx`UPDATE matches SET revision=revision+1,waiting_expires_at=${waitingExpiresAt} WHERE id=${m.id}`;
        m = {
          ...m,
          revision: readinessRevision,
          waiting_expires_at: waitingExpiresAt,
        };
      }
      await tx`INSERT INTO match_events(match_id,revision,type,color,created_at) VALUES(${m.id},${readinessRevision},'readiness',${m.seat_color},${n})`;
    }
    return {
      accepted: true,
      agent_profile_id: profile.id,
      lifecycle: m.lifecycle,
      revision: Number(m.revision),
      next_action: playerNextAction(
        {
          lifecycle: m.lifecycle,
          revision: Number(m.revision),
          turn: m.turn,
          color: m.seat_color,
        },
        profile.id,
      ),
    };
  });
}
function reject(m: any, reason: string, agentProfileId?: string): Rejection {
  const nextAction =
    reason === "invalid_profile"
      ? ({ type: "join", tool: "game.join", arguments: {} } as const)
      : playerNextAction(
          {
            lifecycle: m.lifecycle,
            revision: Number(m.revision),
            turn: m.turn,
            color: m.seat_color,
          },
          agentProfileId,
        );
  return {
    accepted: false,
    reason,
    revision: Number(m.revision),
    lifecycle: m.lifecycle,
    next_action: nextAction,
  };
}
export async function makeMove(
  t: string,
  input: {
    agent_profile_id: string;
    expected_revision: number;
    from: string;
    to: string;
    promotion?: string;
  },
  clock: Clock = now,
) {
  return sql().begin(async (tx) => {
    let m = await byPlayer(tx, t, true);
    m = await materialize(tx, m, clock);
    const fp = [input.from, input.to, input.promotion ?? ""].join(":");
    const [retry] =
      await tx`SELECT response FROM idempotency WHERE match_id=${m.id} AND profile_id=${input.agent_profile_id} AND revision=${input.expected_revision} AND kind='move' AND fingerprint=${fp}`;
    if (retry) return retry.response;
    if (m.lifecycle !== "active")
      return reject(m, m.lifecycle === "waiting" ? "match_not_active" : "terminal_match");
    if (Number(m.revision) !== input.expected_revision)
      return reject(m, "stale_revision", input.agent_profile_id);
    if (m.turn !== m.seat_color) return reject(m, "wrong_turn", input.agent_profile_id);
    const [profile] =
      await tx`SELECT id FROM agent_profiles WHERE id=${input.agent_profile_id} AND seat_id=${m.seat_id}`;
    if (!profile) return reject(m, "invalid_profile");
    const applied = applyChessMove(m.fen, input.from, input.to, input.promotion);
    if (!applied.ok) return reject(m, "illegal_move", input.agent_profile_id);
    const n = clock(),
      rev = Number(m.revision) + 1,
      ply = m.move_count + 1;
    let cause = applied.ending;
    if (ply >= MOVE_LIMIT) cause = "move_limit";
    const response: any = {
      accepted: true,
      move: { ply, from: input.from, to: input.to, promotion: applied.promotion, san: applied.san },
      fen: applied.fen,
      revision: rev,
      lifecycle: cause ? "completed" : "active",
      turn: opposite(m.turn),
      turn_deadline: cause ? null : new Date(+n + TURN_MS),
      promotion_applied: !input.promotion && applied.promotion ? "q" : undefined,
    };
    await tx`UPDATE matches SET fen=${applied.fen},revision=${rev},move_count=${ply},turn=${opposite(m.turn)},turn_deadline=${cause ? null : new Date(+n + TURN_MS)} WHERE id=${m.id}`;
    await tx`INSERT INTO moves(match_id,profile_id,ply,before_revision,after_revision,"from","to",promotion,san,fen,created_at,response) VALUES(${m.id},${profile.id},${ply},${m.revision},${rev},${input.from},${input.to},${applied.promotion ?? null},${applied.san},${applied.fen},${n},${tx.json(response)})`;
    if (cause) {
      m = {
        ...m,
        revision: rev,
        fen: applied.fen,
        move_count: ply,
        match_ciphertext: m.match_ciphertext,
      };
      const done = await complete(tx, m, cause, m.seat_color, n, false);
      response.lifecycle = done.lifecycle;
      response.result = done.result;
      response.ending_cause = cause;
      response.revision = done.revision;
    }
    response.next_action = playerNextAction(
      {
        lifecycle: response.lifecycle,
        revision: response.revision,
        turn: response.turn,
        color: m.seat_color,
      },
      input.agent_profile_id,
    );
    await tx`INSERT INTO idempotency(match_id,profile_id,revision,kind,fingerprint,response) VALUES(${m.id},${profile.id},${input.expected_revision},'move',${fp},${tx.json(response)})`;
    return response;
  });
}
export async function resign(
  t: string,
  input: { agent_profile_id: string; expected_revision: number },
  clock: Clock = now,
) {
  return sql().begin(async (tx) => {
    let m = await byPlayer(tx, t, true);
    m = await materialize(tx, m, clock);
    const [retry] =
      await tx`SELECT response FROM idempotency WHERE match_id=${m.id} AND profile_id=${input.agent_profile_id} AND revision=${input.expected_revision} AND kind='resign'`;
    if (retry) return retry.response;
    if (m.lifecycle !== "active")
      return reject(m, m.lifecycle === "waiting" ? "match_not_active" : "terminal_match");
    if (Number(m.revision) !== input.expected_revision)
      return reject(m, "stale_revision", input.agent_profile_id);
    const [p] =
      await tx`SELECT id FROM agent_profiles WHERE id=${input.agent_profile_id} AND seat_id=${m.seat_id}`;
    if (!p) return reject(m, "invalid_profile");
    const done = await complete(tx, m, "resignation", m.seat_color, clock());
    const response = {
      accepted: true,
      lifecycle: "completed",
      revision: done.revision,
      result: done.result,
      ending_cause: "resignation",
      next_action: { type: "stop", tool: null, arguments: {} } as const,
    };
    await tx`INSERT INTO idempotency(match_id,profile_id,revision,kind,fingerprint,response) VALUES(${m.id},${p.id},${input.expected_revision},'resign','',${tx.json(response)})`;
    return response;
  });
}
export async function getMoves(t: string, cursor?: string, limit = 20) {
  limit = Math.max(1, Math.min(100, limit));
  return sql().begin(async (tx) => {
    const m = await byPlayer(tx, t);
    if (m.lifecycle === "expired") throw unavailable();
    const before = cursor
      ? Number(Buffer.from(cursor, "base64url").toString())
      : Number.MAX_SAFE_INTEGER;
    const rows =
      await tx`SELECT ply,profile_id,"from","to",promotion,san,fen,created_at,after_revision FROM moves WHERE match_id=${m.id} AND ply<${before} ORDER BY ply DESC LIMIT ${limit}`;
    const chronological = rows.reverse();
    return {
      moves: chronological,
      next_cursor:
        chronological.length === limit
          ? Buffer.from(String(chronological[0].ply)).toString("base64url")
          : null,
    };
  });
}
export async function deleteMatch(t: string) {
  return sql().begin(async (tx) => {
    const m = await byMatch(tx, t, true);
    if (m.lifecycle === "completed") return { deleted: false, reason: "terminal_match" };
    await tx`DELETE FROM matches WHERE id=${m.id}`;
    return { deleted: true };
  });
}
export async function directory(cursor?: string, limit = 20) {
  const before = cursor ? new Date(Buffer.from(cursor, "base64url").toString()) : null;
  const pageSize = Math.max(1, Math.min(limit, 100));
  const database = db();
  const rows = await database
    .select({
      id: matches.id,
      public_slug: matches.publicSlug,
      completed_at: matches.completedAt,
      activated_at: matches.activatedAt,
      result: matches.result,
      ending_cause: matches.endingCause,
      move_count: matches.moveCount,
    })
    .from(matches)
    .where(
      and(eq(matches.lifecycle, "completed"), before ? lt(matches.completedAt, before) : undefined),
    )
    .orderBy(desc(matches.completedAt))
    .limit(pageSize);

  const profiles = rows.length
    ? await database
        .select({
          matchId: playerSeats.matchId,
          color: playerSeats.color,
          client_name: agentProfiles.clientName,
          model: agentProfiles.model,
          reasoning_effort: agentProfiles.reasoningEffort,
        })
        .from(agentProfiles)
        .innerJoin(playerSeats, eq(playerSeats.id, agentProfiles.seatId))
        .where(
          inArray(
            playerSeats.matchId,
            rows.map((row) => row.id),
          ),
        )
        .orderBy(agentProfiles.firstSeenAt)
    : [];

  const publicMatches = rows.map(({ id, ...match }) => ({
    ...match,
    white_profiles: profiles
      .filter((profile) => profile.matchId === id && profile.color === "white")
      .map(({ client_name, model, reasoning_effort }) => ({
        client_name,
        model,
        reasoning_effort,
      })),
    black_profiles: profiles
      .filter((profile) => profile.matchId === id && profile.color === "black")
      .map(({ client_name, model, reasoning_effort }) => ({
        client_name,
        model,
        reasoning_effort,
      })),
  }));

  return {
    matches: publicMatches,
    next_cursor:
      rows.length === pageSize
        ? Buffer.from(new Date(rows.at(-1)!.completed_at!).toISOString()).toString("base64url")
        : null,
  };
}

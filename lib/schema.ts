import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const lifecycle = pgEnum("match_lifecycle", ["waiting", "active", "completed", "expired"]);
export const color = pgEnum("player_color", ["white", "black"]);
export const result = pgEnum("match_result", ["white", "black", "draw"]);
export const ending = pgEnum("ending_cause", [
  "checkmate",
  "stalemate",
  "insufficient_material",
  "resignation",
  "forfeit",
  "move_limit",
]);

export const matches = pgTable(
  "matches",
  {
    id: uuid().primaryKey().defaultRandom(),
    lifecycle: lifecycle().notNull().default("waiting"),
    fen: text().notNull(),
    revision: bigint({ mode: "number" }).notNull().default(0),
    turn: color().notNull().default("white"),
    turnDeadline: timestamp("turn_deadline", { withTimezone: true }),
    waitingExpiresAt: timestamp("waiting_expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    result: result(),
    endingCause: ending("ending_cause"),
    moveCount: integer("move_count").notNull().default(0),
    matchHash: text("match_hash").notNull(),
    matchCiphertext: text("match_ciphertext"),
    publicSlug: text("public_slug"),
  },
  (t) => [
    uniqueIndex("matches_hash_idx").on(t.matchHash),
    uniqueIndex("matches_public_slug_idx").on(t.publicSlug),
    index("matches_completed_idx").on(t.completedAt),
  ],
);
export const playerSeats = pgTable(
  "player_seats",
  {
    id: uuid().primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    color: color().notNull(),
    ready: boolean().notNull().default(false),
    tokenHash: text("token_hash").notNull(),
    tokenCiphertext: text("token_ciphertext"),
  },
  (t) => [
    uniqueIndex("seat_match_color_idx").on(t.matchId, t.color),
    uniqueIndex("seat_token_idx").on(t.tokenHash),
  ],
);
export const agentProfiles = pgTable(
  "agent_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => playerSeats.id, { onDelete: "cascade" }),
    fingerprint: text().notNull(),
    clientName: text("client_name").notNull(),
    clientVersion: text("client_version").notNull(),
    model: text(),
    userAgent: text("user_agent").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("profile_descriptor_idx").on(t.seatId, t.fingerprint)],
);
export const moves = pgTable(
  "moves",
  {
    id: uuid().primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => agentProfiles.id),
    ply: integer().notNull(),
    beforeRevision: bigint("before_revision", { mode: "number" }).notNull(),
    afterRevision: bigint("after_revision", { mode: "number" }).notNull(),
    from: text().notNull(),
    to: text().notNull(),
    promotion: text(),
    san: text().notNull(),
    fen: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    response: jsonb().notNull(),
  },
  (t) => [
    uniqueIndex("move_ply_idx").on(t.matchId, t.ply),
    uniqueIndex("move_retry_idx").on(
      t.matchId,
      t.profileId,
      t.beforeRevision,
      t.from,
      t.to,
      t.promotion,
    ),
  ],
);
export const matchEvents = pgTable("match_events", {
  id: uuid().primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  revision: bigint({ mode: "number" }).notNull(),
  type: text().notNull(),
  color: color(),
  data: jsonb().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const idempotency = pgTable(
  "idempotency",
  {
    id: uuid().primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").notNull(),
    revision: bigint({ mode: "number" }).notNull(),
    kind: text().notNull(),
    fingerprint: text().notNull(),
    response: jsonb().notNull(),
  },
  (t) => [
    uniqueIndex("idempotency_idx").on(t.matchId, t.profileId, t.revision, t.kind, t.fingerprint),
  ],
);

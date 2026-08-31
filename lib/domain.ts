import { Chess } from "chess.js";
export const INITIAL_FEN = new Chess().fen();
export const TURN_MS = 600_000;
export const WAIT_MS = 86_400_000;
export const MOVE_LIMIT = 1_000_000;
export type Color = "white" | "black";
export type PlayerLifecycle = "waiting" | "active" | "completed" | "expired";
export type NextAction =
  | {
      type: "wait_for_activation" | "wait_for_turn";
      tool: "game.wait_for_turn";
      arguments: { after_revision: number; agent_profile_id?: string };
    }
  | {
      type: "make_move";
      tool: "game.make_move";
      arguments: { expected_revision: number; agent_profile_id?: string };
    }
  | { type: "join"; tool: "game.join"; arguments: Record<string, never> }
  | { type: "stop"; tool: null; arguments: Record<string, never> };
export type Ending =
  | "checkmate"
  | "stalemate"
  | "insufficient_material"
  | "resignation"
  | "forfeit"
  | "move_limit";
export function opposite(c: Color): Color {
  return c === "white" ? "black" : "white";
}
export function outcome(ending: Ending, actor?: Color) {
  if (["stalemate", "insufficient_material", "move_limit"].includes(ending)) return "draw" as const;
  if (ending === "resignation" || ending === "forfeit") return opposite(actor!);
  return actor!;
}
export function sanitize(value: unknown, fallback = "unknown") {
  return (
    String(value ?? fallback)
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 64) || fallback
  );
}
export function normalizeProfile(input: {
  clientName?: unknown;
  clientVersion?: unknown;
  model?: unknown;
  reasoningEffort?: unknown;
  userAgent?: unknown;
}) {
  const clientName = sanitize(input.clientName);
  const clientVersion = sanitize(input.clientVersion);
  const model = sanitize(input.model);
  const reasoningEffort = sanitize(input.reasoningEffort);
  const userAgent = sanitize(input.userAgent);
  const fingerprintFields = [clientName, clientVersion, model, reasoningEffort];
  fingerprintFields.push(userAgent);
  return {
    clientName,
    clientVersion,
    model,
    reasoningEffort,
    userAgent,
    fingerprint: fingerprintFields.map((x) => x.toLowerCase()).join("|"),
  };
}

export function playerNextAction(
  state: { lifecycle: PlayerLifecycle; revision: number; turn: Color; color: Color },
  agentProfileId?: string,
): NextAction {
  if (state.lifecycle === "completed" || state.lifecycle === "expired")
    return { type: "stop", tool: null, arguments: {} };
  if (state.lifecycle === "waiting")
    return {
      type: "wait_for_activation",
      tool: "game.wait_for_turn",
      arguments: {
        after_revision: state.revision,
        ...(agentProfileId ? { agent_profile_id: agentProfileId } : {}),
      },
    };
  if (state.turn !== state.color)
    return {
      type: "wait_for_turn",
      tool: "game.wait_for_turn",
      arguments: {
        after_revision: state.revision,
        ...(agentProfileId ? { agent_profile_id: agentProfileId } : {}),
      },
    };
  return {
    type: "make_move",
    tool: "game.make_move",
    arguments: {
      expected_revision: state.revision,
      ...(agentProfileId ? { agent_profile_id: agentProfileId } : {}),
    },
  };
}
export function applyChessMove(fen: string, from: string, to: string, promotion?: string) {
  const chess = new Chess(fen);
  let move;
  try {
    move = chess.move({ from, to, promotion: promotion ?? "q" });
  } catch {
    return { ok: false as const };
  }
  let ending: Ending | undefined;
  if (chess.isCheckmate()) ending = "checkmate";
  else if (chess.isStalemate()) ending = "stalemate";
  else if (chess.isInsufficientMaterial()) ending = "insufficient_material";
  return { ok: true as const, fen: chess.fen(), san: move.san, promotion: move.promotion, ending };
}

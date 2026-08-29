import { Chess } from "chess.js";
export const INITIAL_FEN = new Chess().fen();
export const TURN_MS = 600_000;
export const WAIT_MS = 86_400_000;
export const MOVE_LIMIT = 1_000_000;
export type Color = "white" | "black";
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
  const model = input.model ? sanitize(input.model) : null;
  const reasoningEffort = input.reasoningEffort ? sanitize(input.reasoningEffort) : null;
  const userAgent = sanitize(input.userAgent);
  const fingerprintFields = [clientName, clientVersion, model ?? ""];
  if (reasoningEffort !== null) fingerprintFields.push(reasoningEffort);
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

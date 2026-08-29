export type AnalyticsEvent = {
  surface: "web" | "creation_mcp" | "player_mcp";
  lifecycle?: "waiting" | "active" | "completed" | "expired";
  ending_cause?:
    | "checkmate"
    | "stalemate"
    | "insufficient_material"
    | "resignation"
    | "forfeit"
    | "move_limit";
  duration_seconds?: number;
  error_code?: string;
};
const allowed = new Set(["surface", "lifecycle", "ending_cause", "duration_seconds", "error_code"]);
export function track(event: AnalyticsEvent) {
  for (const key of Object.keys(event))
    if (!allowed.has(key))
      throw new Error(`Analytics property not allowed: ${key}`); /* MVP no-op */
}

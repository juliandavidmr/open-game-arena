import { describe, expect, it } from "vitest";
import { applyChessMove, normalizeProfile, opposite, outcome, playerNextAction } from "./domain";
import { Chess } from "chess.js";
describe("chess domain", () => {
  it("accepts legal and rejects illegal moves", () => {
    const f = new Chess().fen();
    expect(applyChessMove(f, "e2", "e4").ok).toBe(true);
    expect(applyChessMove(f, "e2", "e5").ok).toBe(false);
  });
  it("detects checkmate", () => {
    let f = new Chess().fen();
    for (const [a, b] of [
      ["f2", "f3"],
      ["e7", "e5"],
      ["g2", "g4"],
    ])
      f = applyChessMove(f, a, b).fen!;
    expect(applyChessMove(f, "d8", "h4")).toMatchObject({ ok: true, ending: "checkmate" });
  });
  it("models terminal results", () => {
    expect(outcome("resignation", "white")).toBe("black");
    expect(outcome("forfeit", "black")).toBe("white");
    expect(outcome("stalemate", "white")).toBe("draw");
    expect(opposite("white")).toBe("black");
  });
  it("sanitizes and normalizes profiles", () => {
    const p = normalizeProfile({
      clientName: " A\u0000 https://bad.test ",
      clientVersion: "1",
      model: "gpt-5.6-sol",
      reasoningEffort: "high",
    });
    expect(p.clientName).toBe("A");
    expect(p.model).toBe("gpt-5.6-sol");
    expect(p.reasoningEffort).toBe("high");
    expect(p.fingerprint).not.toContain("http");
  });
  it("normalizes absent or empty self-declared fields to unknown", () => {
    const profile = normalizeProfile({
      clientName: "Codex",
      clientVersion: "1",
      model: "",
      userAgent: "client/1",
    });

    expect(profile.model).toBe("unknown");
    expect(profile.reasoningEffort).toBe("unknown");
    expect(profile.fingerprint).toBe("codex|1|unknown|unknown|client/1");
  });
  it("directs each Player Seat through activation, turns, and completion", () => {
    expect(
      playerNextAction({ lifecycle: "waiting", revision: 1, turn: "white", color: "white" }),
    ).toEqual({
      type: "wait_for_activation",
      tool: "game.wait_for_turn",
      arguments: { after_revision: 1 },
    });
    expect(
      playerNextAction(
        { lifecycle: "active", revision: 2, turn: "white", color: "white" },
        "white-profile",
      ),
    ).toEqual({
      type: "make_move",
      tool: "game.make_move",
      arguments: { expected_revision: 2, agent_profile_id: "white-profile" },
    });
    expect(
      playerNextAction({ lifecycle: "active", revision: 2, turn: "white", color: "black" }),
    ).toEqual({
      type: "wait_for_turn",
      tool: "game.wait_for_turn",
      arguments: { after_revision: 2 },
    });
    expect(
      playerNextAction({ lifecycle: "completed", revision: 6, turn: "white", color: "black" }),
    ).toEqual({ type: "stop", tool: null, arguments: {} });
  });
});

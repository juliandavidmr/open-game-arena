import { describe, expect, it } from "vitest";
import { applyChessMove, normalizeProfile, opposite, outcome } from "./domain";
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
      model: "x",
    });
    expect(p.clientName).toBe("A");
    expect(p.fingerprint).not.toContain("http");
  });
});

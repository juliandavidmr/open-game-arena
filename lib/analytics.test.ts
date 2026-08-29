import { describe, expect, it } from "vitest";
import { track } from "./analytics";
describe("privacy analytics", () => {
  it("accepts allowlisted values", () =>
    expect(() => track({ surface: "web", lifecycle: "active" })).not.toThrow());
  it("rejects tokens and arbitrary properties", () =>
    expect(() => track({ surface: "web", token: "secret" } as never)).toThrow());
});

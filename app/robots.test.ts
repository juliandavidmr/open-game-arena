import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows the public MCP endpoint while keeping player capabilities private", () => {
    const rules = robots().rules;
    expect(Array.isArray(rules)).toBe(false);
    if (Array.isArray(rules)) throw new Error("Expected one robots rule");

    expect(rules.allow).toContain("/mcp");
    expect(rules.disallow).not.toContain("/mcp");
    expect(rules.disallow).toContain("/chess/");
  });
});

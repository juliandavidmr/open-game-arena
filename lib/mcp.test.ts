import { describe, expect, it } from "vitest";
import { mcpResponse, revisions, tools } from "./mcp";
describe("MCP contracts", () => {
  for (const revision of revisions)
    it(`negotiates ${revision}`, async () => {
      const r = await mcpResponse(
        new Request("http://x/mcp", {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { protocolVersion: revision },
          }),
        }),
      );
      expect((await r.json()).result.protocolVersion).toBe(revision);
    });
  it("discovers the creation tool", async () => {
    const r = await mcpResponse(
      new Request("http://x/mcp", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
    );
    expect((await r.json()).result.tools[0].name).toBe("match.create");
  });
  it("defines all player tools", () => expect(tools()).toHaveLength(7));
});

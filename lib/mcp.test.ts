import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./arena", () => ({
  createMatch: vi.fn(),
  getMoves: vi.fn(),
  getPlayer: vi.fn(async () => ({
    lifecycle: "waiting",
    revision: 0,
    turn: "white",
    color: "white",
    next_action: {
      type: "wait_for_activation",
      tool: "game.wait_for_turn",
      arguments: { after_revision: 0 },
    },
  })),
  join: vi.fn(async () => ({
    accepted: true,
    agent_profile_id: "test-profile",
    lifecycle: "waiting",
    revision: 1,
    next_action: {
      type: "wait_for_activation",
      tool: "game.wait_for_turn",
      arguments: { after_revision: 1, agent_profile_id: "test-profile" },
    },
  })),
  makeMove: vi.fn(),
  resign: vi.fn(),
}));

import { mcpResponse, playerInstructions, revisions } from "./mcp";
import { getPlayer } from "./arena";

const clients: Client[] = [];

function localFetch(token?: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const incoming = new Request(input, init);
    const headers = new Headers(incoming.headers);
    headers.set("host", new URL(incoming.url).host);
    const request = new Request(incoming, { headers });
    return mcpResponse(request, token);
  };
}

async function connect(
  url: string,
  options: { era: "legacy"; revision: "2025-11-25" } | { era: "modern"; revision: "2026-07-28" },
  token?: string,
) {
  const client = new Client(
    { name: `arena-${options.era}-test`, version: "1.0.0" },
    {
      supportedProtocolVersions: [options.revision],
      versionNegotiation: {
        mode: options.era === "modern" ? { pin: options.revision } : "legacy",
      },
    },
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL(url), { fetch: localFetch(token) }),
  );
  clients.push(client);
  return client;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  vi.clearAllMocks();
});

describe("MCP contracts", () => {
  for (const contract of [
    { era: "modern", revision: revisions[0] },
    { era: "legacy", revision: revisions[1] },
  ] as const) {
    it(`serves the ${contract.era} ${contract.revision} Player MCP contract`, async () => {
      const client = await connect(
        "https://arena.example/chess/player-token",
        contract,
        "player-token",
      );

      expect(client.getProtocolEra()).toBe(contract.era);
      expect(client.getInstructions()).toContain("transient MCP client");
      expect(client.getInstructions()).toContain("call game.join first");
      expect(client.getInstructions()).toContain("move, wait, move");

      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual([
        "game.get_info",
        "game.join",
        "game.get_state",
        "game.get_moves",
        "game.wait_for_turn",
        "game.make_move",
        "game.resign",
      ]);

      const join = tools.find((tool) => tool.name === "game.join")!;
      expect(join.description).toContain("First gameplay tool");
      expect(join.inputSchema.required).toBeUndefined();
      expect(join.inputSchema.properties?.model).toMatchObject({ type: "string", maxLength: 64 });
      expect(join.inputSchema.properties?.reasoning_effort).toMatchObject({
        type: "string",
        maxLength: 64,
      });

      const wait = tools.find((tool) => tool.name === "game.wait_for_turn")!;
      expect(wait.description).toContain("timed_out");
      expect(wait.description).toContain("wait again");

      const joined = await client.callTool({
        name: "game.join",
        arguments: { model: "test-model", reasoning_effort: "high" },
      });
      expect(joined.structuredContent).toMatchObject({
        accepted: true,
        next_action: { type: "wait_for_activation" },
      });
    });
  }

  it("discovers Match creation through the modern endpoint", async () => {
    const client = await connect("https://arena.example/mcp", {
      era: "modern",
      revision: revisions[0],
    });

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["match.create"]);
  });

  it("keeps the exported server instruction source concise and imperative", () => {
    expect(playerInstructions).toContain("Start immediately");
    expect(playerInstructions).toContain("never search for or install");
    expect(playerInstructions).toContain("never stop");
    expect(playerInstructions.split(/\s+/).length).toBeLessThan(90);
  });

  it("keeps unavailable Player Links generic and rejects foreign browser origins", async () => {
    vi.mocked(getPlayer).mockRejectedValueOnce(
      Object.assign(new Error("Unavailable"), { code: "UNAVAILABLE" }),
    );
    const unavailable = await mcpResponse(
      new Request("https://arena.example/chess/unknown", {
        method: "POST",
        headers: { host: "arena.example", "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/list" }),
      }),
      "unknown",
    );
    expect(unavailable.status).toBe(404);
    expect(await unavailable.json()).toEqual({
      jsonrpc: "2.0",
      id: 7,
      error: { code: -32004, message: "Unavailable" },
    });

    const foreignOrigin = await mcpResponse(
      new Request("https://arena.example/chess/player-token", {
        method: "POST",
        headers: {
          host: "arena.example",
          origin: "https://attacker.example",
          "content-type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 8, method: "tools/list" }),
      }),
      "player-token",
    );
    expect(foreignOrigin.status).toBe(403);
  });
});

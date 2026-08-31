import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const arena = vi.hoisted(() => {
  type Color = "white" | "black";
  type State = {
    lifecycle: "waiting" | "active" | "completed";
    revision: number;
    turn: Color;
    ready: Record<Color, boolean>;
    profiles: Record<Color, { id: string; model: string; reasoning_effort: string } | null>;
    moves: Array<{ from: string; to: string; color: Color }>;
  };
  const expected = [
    { color: "white" as const, from: "f2", to: "f3" },
    { color: "black" as const, from: "e7", to: "e5" },
    { color: "white" as const, from: "g2", to: "g4" },
    { color: "black" as const, from: "d8", to: "h4" },
  ];
  let state: State;

  function reset() {
    state = {
      lifecycle: "waiting",
      revision: 0,
      turn: "white",
      ready: { white: false, black: false },
      profiles: { white: null, black: null },
      moves: [],
    };
  }

  function colorFor(token: string): Color {
    return token.includes("white") ? "white" : "black";
  }

  function nextAction(color: Color, profileId?: string) {
    if (state.lifecycle === "completed") return { type: "stop", tool: null, arguments: {} };
    if (state.lifecycle === "waiting")
      return {
        type: "wait_for_activation",
        tool: "game.wait_for_turn",
        arguments: {
          after_revision: state.revision,
          ...(profileId ? { agent_profile_id: profileId } : {}),
        },
      };
    if (state.turn !== color)
      return {
        type: "wait_for_turn",
        tool: "game.wait_for_turn",
        arguments: {
          after_revision: state.revision,
          ...(profileId ? { agent_profile_id: profileId } : {}),
        },
      };
    return {
      type: "make_move",
      tool: "game.make_move",
      arguments: { expected_revision: state.revision, agent_profile_id: profileId },
    };
  }

  reset();
  return {
    reset,
    snapshot: () => structuredClone(state),
    createMatch: vi.fn(),
    getMoves: vi.fn(async () => ({ moves: state.moves, next_cursor: null })),
    getPlayer: vi.fn(async (token: string) => {
      const color = colorFor(token);
      return {
        lifecycle: state.lifecycle,
        revision: state.revision,
        turn: state.turn,
        color,
        next_action: nextAction(color, state.profiles[color]?.id),
      };
    }),
    join: vi.fn(async (token: string, input: { model?: unknown; reasoningEffort?: unknown }) => {
      const color = colorFor(token);
      const profile = {
        id: `${color}-profile`,
        model: String(input.model ?? "").trim() || "unknown",
        reasoning_effort: String(input.reasoningEffort ?? "").trim() || "unknown",
      };
      state.profiles[color] = profile;
      if (!state.ready[color]) {
        state.ready[color] = true;
        state.revision += 1;
        if (state.ready.white && state.ready.black) state.lifecycle = "active";
      }
      return {
        accepted: true,
        agent_profile_id: profile.id,
        lifecycle: state.lifecycle,
        revision: state.revision,
        next_action: nextAction(color, profile.id),
      };
    }),
    makeMove: vi.fn(
      async (
        token: string,
        input: { agent_profile_id: string; expected_revision: number; from: string; to: string },
      ) => {
        const color = colorFor(token);
        const move = expected[state.moves.length];
        if (
          state.lifecycle !== "active" ||
          state.turn !== color ||
          input.expected_revision !== state.revision ||
          input.agent_profile_id !== state.profiles[color]?.id ||
          !move ||
          move.color !== color ||
          move.from !== input.from ||
          move.to !== input.to
        )
          throw new Error("Simulated client violated the Match contract");

        state.moves.push({ color, from: input.from, to: input.to });
        state.revision += 1;
        state.turn = color === "white" ? "black" : "white";
        if (state.moves.length === expected.length) state.lifecycle = "completed";
        return {
          accepted: true,
          lifecycle: state.lifecycle,
          revision: state.revision,
          result: state.lifecycle === "completed" ? "black" : null,
          ending_cause: state.lifecycle === "completed" ? "checkmate" : null,
          next_action: nextAction(color, input.agent_profile_id),
        };
      },
    ),
    resign: vi.fn(),
  };
});

vi.mock("./arena", () => ({
  createMatch: arena.createMatch,
  getMoves: arena.getMoves,
  getPlayer: arena.getPlayer,
  join: arena.join,
  makeMove: arena.makeMove,
  resign: arena.resign,
}));

import { mcpResponse, waitForTurn } from "./mcp";

const clients: Client[] = [];

function localFetch(token: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const incoming = new Request(input, init);
    const headers = new Headers(incoming.headers);
    headers.set("host", new URL(incoming.url).host);
    return mcpResponse(new Request(incoming, { headers }), token);
  };
}

async function connect(color: "white" | "black") {
  const token = `${color}-token`;
  const client = new Client(
    { name: `${color}-transient-client`, version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`https://arena.example/chess/${token}`), {
      fetch: localFetch(token),
    }),
  );
  clients.push(client);
  return client;
}

function structured(result: Awaited<ReturnType<Client["callTool"]>>) {
  return result.structuredContent as any;
}

beforeEach(() => arena.reset());
afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  vi.clearAllMocks();
});

describe("autonomous two-client MCP loop", () => {
  it("does not mistake White's future Turn for an Active Turn while Waiting", async () => {
    const result = await waitForTurn("white-token", 0, { timeoutMs: 5, pollMs: 1 });

    expect(result).toMatchObject({
      lifecycle: "waiting",
      turn: "white",
      color: "white",
      timed_out: true,
      next_action: { type: "wait_for_activation" },
    });
    expect(arena.getPlayer.mock.calls.length).toBeGreaterThan(1);
  });

  it("joins, alternates move and wait, and stops only after checkmate", async () => {
    const [white, black] = await Promise.all([connect("white"), connect("black")]);
    const whiteJoin = structured(
      await white.callTool({
        name: "game.join",
        arguments: { model: "", reasoning_effort: "" },
      }),
    );
    const blackJoin = structured(await black.callTool({ name: "game.join", arguments: {} }));

    expect(whiteJoin.next_action.type).toBe("wait_for_activation");
    expect(blackJoin.next_action.type).toBe("wait_for_turn");
    expect(arena.snapshot().profiles).toMatchObject({
      white: { model: "unknown", reasoning_effort: "unknown" },
      black: { model: "unknown", reasoning_effort: "unknown" },
    });
    expect(arena.join).toHaveBeenCalledWith(
      "white-token",
      expect.objectContaining({
        clientName: "white-transient-client",
        clientVersion: "1.0.0",
      }),
    );

    const moves = {
      white: [
        ["f2", "f3"],
        ["g2", "g4"],
      ],
      black: [
        ["e7", "e5"],
        ["d8", "h4"],
      ],
    } as const;

    async function play(
      client: Client,
      color: keyof typeof moves,
      initialAction: any,
    ): Promise<void> {
      let action = initialAction;
      let moveIndex = 0;
      while (action.type !== "stop") {
        if (action.type === "wait_for_activation" || action.type === "wait_for_turn") {
          action = structured(
            await client.callTool({ name: action.tool, arguments: action.arguments }),
          ).next_action;
          continue;
        }
        if (action.type === "make_move") {
          const [from, to] = moves[color][moveIndex++];
          action = structured(
            await client.callTool({
              name: action.tool,
              arguments: { ...action.arguments, from, to },
            }),
          ).next_action;
          continue;
        }
        throw new Error(`Unexpected next_action: ${action.type}`);
      }
    }

    await Promise.all([
      play(white, "white", whiteJoin.next_action),
      play(black, "black", blackJoin.next_action),
    ]);

    expect(arena.snapshot()).toMatchObject({
      lifecycle: "completed",
      revision: 6,
      moves: [
        { color: "white", from: "f2", to: "f3" },
        { color: "black", from: "e7", to: "e5" },
        { color: "white", from: "g2", to: "g4" },
        { color: "black", from: "d8", to: "h4" },
      ],
    });
    expect(arena.makeMove).toHaveBeenCalledTimes(4);
    expect(arena.getPlayer).toHaveBeenCalled();
  });
});

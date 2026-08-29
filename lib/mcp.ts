import { createMatch, getMoves, getPlayer, join, makeMove, resign } from "./arena";
export const revisions = ["2026-07-28", "2025-11-25"];
const defs = [
  ["game.get_info", "Discover rules, seat, and play loop", {}],
  [
    "game.join",
    "Register an unverified Agent Profile. Report the actual model and reasoning configuration running this match, not the seat label or agent nickname.",
    {
      model: {
        type: "string",
        description:
          'Exact model identifier running this agent (for example "gpt-5.6-sol" or "claude-opus-4-1"). Use "unknown" if unavailable. Do not send "Agent A", "Agent B", a color, role, or nickname.',
      },
      reasoning_effort: {
        type: "string",
        description:
          'Exact configured reasoning effort or thinking mode for this run (for example "medium", "high", or "extended"). Use "unknown" if unavailable. Do not describe chess reasoning or strategy.',
      },
    },
  ],
  ["game.get_state", "Read the Match snapshot", {}],
  [
    "game.get_moves",
    "Read accepted Moves",
    { cursor: { type: "string" }, limit: { type: "integer" } },
  ],
  ["game.wait_for_turn", "Wait for a revision", { after_revision: { type: "integer" } }],
  [
    "game.make_move",
    "Submit a Legal Move",
    {
      agent_profile_id: { type: "string" },
      expected_revision: { type: "integer" },
      from: { type: "string" },
      to: { type: "string" },
      promotion: { enum: ["q", "r", "b", "n"] },
    },
  ],
  [
    "game.resign",
    "Resign",
    { agent_profile_id: { type: "string" }, expected_revision: { type: "integer" } },
  ],
] as const;
export function tools() {
  return defs.map(([name, description, properties]) => ({
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      additionalProperties: false,
      required:
        name === "game.make_move"
          ? ["agent_profile_id", "expected_revision", "from", "to"]
          : name === "game.resign"
            ? ["agent_profile_id", "expected_revision"]
            : name === "game.wait_for_turn"
              ? ["after_revision"]
              : [],
    },
  }));
}
export async function dispatch(
  token: string,
  name: string,
  args: any,
  client: any,
  userAgent: string,
) {
  switch (name) {
    case "game.get_info": {
      const s = await getPlayer(token);
      return {
        product: "Open Game Arena",
        game: "chess",
        color: s.color,
        lifecycle: s.lifecycle,
        turn_duration_seconds: 600,
        move_limit: 1_000_000,
        rules: "Standard initial position; no automatic threefold or fifty-move draws",
        instructions: "Join, inspect state, move on your Turn, then keep waiting until terminal.",
        tools: defs.map((x) => x[0]),
      };
    }
    case "game.join":
      return join(token, {
        clientName: client?.name,
        clientVersion: client?.version,
        model: args.model,
        reasoningEffort: args.reasoning_effort,
        userAgent,
      });
    case "game.get_state":
      return getPlayer(token);
    case "game.get_moves":
      return getMoves(token, args.cursor, args.limit);
    case "game.wait_for_turn": {
      const until = Date.now() + 20_000;
      do {
        const s = await getPlayer(token);
        if (s.revision !== args.after_revision || s.turn === s.color || s.lifecycle === "completed")
          return { ...s, timed_out: false };
        await new Promise((r) => setTimeout(r, 500));
      } while (Date.now() < until);
      return { timed_out: true, revision: args.after_revision };
    }
    case "game.make_move":
      return makeMove(token, args);
    case "game.resign":
      return resign(token, args);
    default:
      throw new Error("Unknown tool");
  }
}
export async function mcpResponse(request: Request, token?: string) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }
  const id = body.id ?? null;
  try {
    let result: any;
    if (body.method === "initialize") {
      const requested = body.params?.protocolVersion;
      result = {
        protocolVersion: revisions.includes(requested) ? requested : revisions[0],
        capabilities: { tools: {} },
        serverInfo: { name: "open-game-arena", version: "1.0.0" },
      };
    } else if (body.method === "notifications/initialized")
      return new Response(null, { status: 202 });
    else if (body.method === "tools/list")
      result = {
        tools: token
          ? tools()
          : [
              {
                name: "match.create",
                description: "Create a chess Match and its three capability links",
                inputSchema: { type: "object", properties: {}, additionalProperties: false },
              },
            ],
      };
    else if (body.method === "tools/call") {
      if (!token && body.params?.name === "match.create") result = await createMatch();
      else if (token)
        result = await dispatch(
          token,
          body.params?.name,
          body.params?.arguments ?? {},
          body.params?._meta?.clientInfo ?? {},
          request.headers.get("user-agent") ?? "",
        );
      else throw new Error("Unknown tool");
      result = {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
        isError: false,
      };
    } else throw Object.assign(new Error("Method not found"), { rpc: -32601 });
    return Response.json(
      { jsonrpc: "2.0", id, result },
      {
        headers: {
          "MCP-Protocol-Version":
            body.params?.protocolVersion ??
            request.headers.get("mcp-protocol-version") ??
            revisions[0],
        },
      },
    );
  } catch (e: any) {
    if (e?.code === "UNAVAILABLE")
      return Response.json(
        { jsonrpc: "2.0", id, error: { code: -32004, message: "Unavailable" } },
        { status: 404 },
      );
    return Response.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: e.rpc ?? -32603, message: e.rpc ? e.message : "Internal error" },
      },
      { status: e.rpc ? 200 : 500 },
    );
  }
}

import {
  CLIENT_INFO_META_KEY,
  McpServer,
  createMcpHandler,
  originValidationResponse,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import { createMatch, getMoves, getPlayer, join, makeMove, resign } from "./arena";
import { playerNextAction } from "./domain";
import { SITE_ORIGIN } from "./site";

export const revisions = ["2026-07-28", "2025-11-25"] as const;

export const playerInstructions =
  "Start immediately. This is an already-running remote Streamable HTTP MCP endpoint: use a transient MCP client and never search for or install a local server. After discovery, call game.join first and report the exact model and reasoning_effort when known; missing or empty values become unknown. Follow every structured next_action. Once Active, keep the rhythm move, wait, move. Repeat every timeout, recover from domain rejections, and never stop or ask for confirmation until lifecycle is completed. Your objective is to win the Match.";

const creationInstructions =
  "Call match.create to create one chess Match and return its Match Link plus the separate White and Black Player MCP links. Do not join either Player Seat.";

type ClientDescriptor = { name?: unknown; version?: unknown };

function jsonSafe(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function toolResult(value: unknown) {
  const structuredContent = jsonSafe(value);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

function clientDescriptor(context: ServerContext) {
  const envelope = context.mcpReq.envelope as Record<string, unknown> | undefined;
  const client = (envelope?.[CLIENT_INFO_META_KEY] ?? {}) as ClientDescriptor;
  return {
    clientName: client.name,
    clientVersion: client.version,
    userAgent: context.http?.req?.headers.get("user-agent") ?? undefined,
  };
}

function serverOptions(instructions: string) {
  return {
    instructions,
    supportedProtocolVersions: [...revisions],
    cacheHints: {
      "tools/list": { ttlMs: 0, cacheScope: "private" as const },
      "server/discover": { ttlMs: 0, cacheScope: "private" as const },
    },
  };
}

function creationServer() {
  const server = new McpServer(
    { name: "open-game-arena-creation", version: "1.0.0" },
    serverOptions(creationInstructions),
  );
  server.registerTool(
    "match.create",
    {
      description:
        "Create one chess Match and return its observer URL and two separate remote Player MCP URLs.",
      inputSchema: z.object({}),
    },
    async () => toolResult(await createMatch()),
  );
  return server;
}

function playerServer(token: string) {
  const server = new McpServer(
    { name: "open-game-arena-player", version: "1.0.0" },
    serverOptions(playerInstructions),
  );

  server.registerTool(
    "game.get_info",
    {
      description:
        "Optionally inspect this Player Seat, rules, and autonomous loop. This is not a prerequisite: game.join must be the first gameplay tool after discovery.",
      inputSchema: z.object({}),
    },
    async () => {
      const state = await getPlayer(token);
      return toolResult({
        product: "Open Game Arena",
        game: "chess",
        color: state.color,
        lifecycle: state.lifecycle,
        revision: state.revision,
        turn_duration_seconds: 600,
        move_limit: 1_000_000,
        rules: "Standard initial position; no automatic threefold or fifty-move draws",
        loop: "join first; then follow next_action through move, wait, move until completed",
        timeout_semantics: "timed_out is non-terminal; call game.wait_for_turn again",
        next_action: state.next_action,
      });
    },
  );

  server.registerTool(
    "game.join",
    {
      description:
        "First gameplay tool after discovery. Declare this Player Seat ready and register an unverified profile. Send the exact runtime model and reasoning effort when known; missing or empty values safely become unknown. Then execute the returned next_action immediately.",
      inputSchema: z.object({
        model: z
          .string()
          .max(64)
          .optional()
          .describe("Exact runtime model identifier. Missing or empty becomes unknown."),
        reasoning_effort: z
          .string()
          .max(64)
          .optional()
          .describe(
            "Exact configured reasoning effort or thinking mode. Missing or empty becomes unknown.",
          ),
      }),
    },
    async (args, context) =>
      toolResult(
        await join(token, {
          ...clientDescriptor(context),
          model: args.model,
          reasoningEffort: args.reasoning_effort,
        }),
      ),
  );

  server.registerTool(
    "game.get_state",
    {
      description:
        "Read the authoritative Match snapshot and next_action. Use the current revision for the next move or wait; do not stop unless lifecycle is completed.",
      inputSchema: z.object({ agent_profile_id: z.string().min(1).optional() }),
    },
    async ({ agent_profile_id }) => {
      const state = await getPlayer(token);
      return toolResult({
        ...state,
        next_action: playerNextAction(state, agent_profile_id),
      });
    },
  );

  server.registerTool(
    "game.get_moves",
    {
      description:
        "Read accepted Moves newest-page first, returned in chronological display order.",
      inputSchema: z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    },
    async ({ cursor, limit }) => toolResult(await getMoves(token, cursor, limit)),
  );

  server.registerTool(
    "game.wait_for_turn",
    {
      description:
        "Wait for activation, the opponent's Move, your next Turn, or completion. A timed_out response never ends the run: execute its next_action and wait again. Once it returns make_move, move immediately.",
      inputSchema: z.object({
        after_revision: z.number().int().min(0),
        agent_profile_id: z.string().min(1).optional(),
      }),
    },
    async ({ after_revision, agent_profile_id }) =>
      toolResult(await waitForTurn(token, after_revision, { agentProfileId: agent_profile_id })),
  );

  server.registerTool(
    "game.make_move",
    {
      description:
        "Submit one Legal Move at the expected Match Revision. After success, execute next_action and wait for the opponent. Illegal, stale, and wrong-turn rejections are recoverable; follow their next_action instead of stopping.",
      inputSchema: z.object({
        agent_profile_id: z.string().min(1),
        expected_revision: z.number().int().min(0),
        from: z.string().regex(/^[a-h][1-8]$/),
        to: z.string().regex(/^[a-h][1-8]$/),
        promotion: z.enum(["q", "r", "b", "n"]).optional(),
      }),
    },
    async (args) => toolResult(await makeMove(token, args)),
  );

  server.registerTool(
    "game.resign",
    {
      description:
        "Concede the Active Match. A successful resignation completes the Match and returns next_action stop.",
      inputSchema: z.object({
        agent_profile_id: z.string().min(1),
        expected_revision: z.number().int().min(0),
      }),
    },
    async (args) => toolResult(await resign(token, args)),
  );

  return server;
}

export async function waitForTurn(
  token: string,
  afterRevision: number,
  options: { timeoutMs?: number; pollMs?: number; agentProfileId?: string } = {},
) {
  const until = Date.now() + (options.timeoutMs ?? 20_000);
  let state = await getPlayer(token);
  do {
    if (
      state.revision !== afterRevision ||
      state.lifecycle === "completed" ||
      (state.lifecycle === "active" && state.turn === state.color)
    )
      return {
        ...state,
        timed_out: false,
        next_action: playerNextAction(state, options.agentProfileId),
      };
    await new Promise((resolve) => setTimeout(resolve, options.pollMs ?? 500));
    state = await getPlayer(token);
  } while (Date.now() < until);
  return {
    ...state,
    timed_out: true,
    next_action: playerNextAction(state, options.agentProfileId),
  };
}

export async function mcpResponse(request: Request, token?: string) {
  const rejected = originValidationResponse(request, [new URL(SITE_ORIGIN).hostname]);
  if (rejected) return rejected;

  if (token) {
    try {
      await getPlayer(token);
    } catch (error: any) {
      if (error?.code !== "UNAVAILABLE") throw error;
      const body = await request
        .clone()
        .json()
        .catch(() => ({ id: null }));
      return Response.json(
        {
          jsonrpc: "2.0",
          id: typeof body === "object" && body ? (body as { id?: unknown }).id : null,
          error: { code: -32004, message: "Unavailable" },
        },
        { status: 404 },
      );
    }
  }

  const handler = createMcpHandler(() => (token ? playerServer(token) : creationServer()), {
    legacy: "stateless",
  });
  return handler.fetch(request);
}

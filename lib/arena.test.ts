import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { proxyQuery } = vi.hoisted(() => ({
  proxyQuery: vi.fn(async (query: string, params: unknown[], method: string) => {
    void query;
    void params;
    void method;
    return { rows: [] };
  }),
}));
const database = drizzle(proxyQuery);

vi.mock("./db", () => ({
  db: () => database,
  sql: () => {
    throw new Error("Raw SQL should not be used by the Match Directory");
  },
}));

vi.mock("./site", () => ({
  siteUrl: (path: string) => new URL(path, "https://arena.example/").toString(),
}));

import { directory, matchUrls } from "./arena";

describe("Match URLs", () => {
  it("uses the configured site origin for every newly created match link", () => {
    expect(matchUrls({ match: "observer", white: "white", black: "black" })).toEqual({
      match_url: "https://arena.example/match/observer",
      white_player_mcp_url: "https://arena.example/chess/white",
      black_player_mcp_url: "https://arena.example/chess/black",
    });
  });
});

describe("Match Directory", () => {
  beforeEach(() => proxyQuery.mockClear());

  it("queries completed matches through Drizzle without an infinity timestamp", async () => {
    await expect(directory()).resolves.toEqual({ matches: [], next_cursor: null });

    const [statement] = proxyQuery.mock.calls[0]!;
    expect(statement).toContain('from "matches"');
    expect(statement).toContain('"lifecycle" =');
    expect(statement).not.toContain("infinity");
  });

  it("uses the decoded cursor as the next page upper bound", async () => {
    const timestamp = "2026-08-29T12:00:00.000Z";
    const cursor = Buffer.from(timestamp).toString("base64url");

    await expect(directory(cursor)).resolves.toEqual({ matches: [], next_cursor: null });

    const params = proxyQuery.mock.calls[0]?.[1] ?? [];
    expect(params.some((value) => String(value).startsWith("2026-08-29T12:00:00"))).toBe(true);
  });
});

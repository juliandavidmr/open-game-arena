import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({
  query: vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
    const before = values[0];
    if (before instanceof Date && before.toISOString().startsWith("+275760")) {
      throw Object.assign(
        new Error('time zone displacement out of range: "+275760-09-13T00:00:00.000Z"'),
        { code: "22009" },
      );
    }
    return [];
  }),
}));

vi.mock("./db", () => ({ sql: () => query }));

import { directory } from "./arena";

describe("Match Directory", () => {
  beforeEach(() => query.mockClear());

  it("uses a PostgreSQL-compatible upper bound for the first page", async () => {
    await expect(directory()).resolves.toEqual({ matches: [], next_cursor: null });
    expect(query.mock.calls[0]?.[1]).toBeNull();
  });

  it("uses the cursor timestamp as the next page upper bound", async () => {
    const timestamp = "2026-08-29T12:00:00.000Z";
    const cursor = Buffer.from(timestamp).toString("base64url");

    await expect(directory(cursor)).resolves.toEqual({ matches: [], next_cursor: null });
    expect(query.mock.calls[0]?.[1]).toEqual(new Date(timestamp));
  });
});

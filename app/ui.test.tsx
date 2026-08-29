// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArenaHome } from "./ui";

beforeEach(() => {
  const storedValues = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => storedValues.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storedValues.set(key, value)),
    removeItem: vi.fn((key: string) => storedValues.delete(key)),
    clear: vi.fn(() => storedValues.clear()),
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("no-preference"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

describe("ArenaHome", () => {
  it("hides the Completed Matches directory when there are no items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ matches: [], next_cursor: null }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ArenaHome language="en" />);

    expect(screen.getByRole("link", { name: "Open Game Arena home" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Launch Agent Battle" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Replay the board move" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "/mcp" }).getAttribute("href")).toBe("/mcp");
    expect(screen.getByRole("link", { name: "Open the GitHub repository" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Open source/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Propose a new idea" }).getAttribute("href")).toBe(
      "https://github.com/juliandavidmr/open-game-arena/issues/new?template=new-idea.yml",
    );
    const themeController = screen.getByRole("checkbox", { name: "Theme" });
    expect(themeController.classList.contains("theme-controller")).toBe(true);
    expect(themeController.getAttribute("value")).toBe("dark");
    fireEvent.click(themeController);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("oga-theme")).toBe("dark");
    expect(
      screen.getByRole("heading", {
        name: "Two agents. One decisive match.",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Create the arena" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Deploy the contenders" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Watch every move" })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/matches"));
    expect(screen.queryByRole("heading", { name: "Completed Matches" })).toBeNull();
  });

  it("shows the Completed Matches directory when the API returns an item", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          matches: [
            {
              public_slug: "finished-match",
              completed_at: "2026-08-29T12:01:00.000Z",
              activated_at: "2026-08-29T12:00:00.000Z",
              result: "White wins",
              ending_cause: "checkmate",
              white_profiles: [
                { client_name: "Grok Bot", model: "grok-4", reasoning_effort: "high" },
              ],
              black_profiles: [
                { client_name: "Codex", model: "gpt-5.6-sol", reasoning_effort: "medium" },
              ],
            },
          ],
          next_cursor: null,
        }),
      }),
    );

    render(<ArenaHome language="en" />);

    expect(await screen.findByRole("heading", { name: "Completed Matches" })).toBeTruthy();
    expect(document.querySelector('a[href="/match/finished-match"]')).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: "Winner" })).toBeTruthy();
    expect(screen.getByText("Grok Bot · grok-4 · high")).toBeTruthy();
    expect(screen.getByText("Codex · gpt-5.6-sol · medium")).toBeTruthy();
    expect(screen.getByText("1m 0s")).toBeTruthy();
  });
});

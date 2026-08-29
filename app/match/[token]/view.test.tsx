// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchView } from "./view";

const state = {
  lifecycle: "active",
  revision: 2,
  turn: "white",
  result: null,
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  total_move_count: 0,
  moves: [],
  player_tokens: { white: "white-token", black: "black-token" },
  readiness: { white: true, black: true },
  profiles: [
    { id: "white-profile", color: "white", client_name: "Agent A", model: null },
    { id: "black-profile", color: "black", client_name: "Agent B", model: null },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MatchView setup prompts", () => {
  it("collapses after both ready seats have an agent and can be expanded again", () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<MatchView token="match-token" initial={state} />);

    const deleteButton = screen.getByRole("button", { name: "Delete match" });
    expect(deleteButton.closest("header")).not.toBeNull();
    expect(deleteButton.closest("aside")).toBeNull();

    const panel = screen.getByText("Start the match").closest("details");
    expect(panel?.open).toBe(false);
    expect(screen.queryByText("Primary action")).toBeNull();
    expect(
      screen.queryByText(
        "Keep these prompts private: each one grants control of its assigned color.",
      ),
    ).toBeNull();

    fireEvent.click(screen.getByText("Start the match").closest("summary")!);
    expect(panel?.open).toBe(true);
  });

  it("stays expanded while a seat is still waiting", () => {
    vi.stubGlobal("fetch", vi.fn());

    render(
      <MatchView
        token="match-token"
        initial={{
          ...state,
          lifecycle: "waiting",
          readiness: { white: true, black: false },
          profiles: state.profiles.slice(0, 1),
        }}
      />,
    );

    expect(screen.getByText("Start the match").closest("details")?.open).toBe(true);
  });

  it("renders the match controls in Spanish", () => {
    vi.stubGlobal("fetch", vi.fn());

    render(<MatchView token="match-token" initial={state} language="es" />);

    expect(screen.getByRole("heading", { name: "Partida de ajedrez con IA" })).toBeTruthy();
    expect(screen.getByText("Iniciar la partida")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Posición en vivo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar partida" })).toBeTruthy();
    expect(screen.getByText("Cronología")).toBeTruthy();
  });
});

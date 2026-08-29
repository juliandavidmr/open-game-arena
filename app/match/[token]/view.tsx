"use client";

import { Chess } from "chess.js";
import { useEffect, useState } from "react";

const pieces: Record<string, string> = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

function Board({ fen }: { fen: string }) {
  const board = new Chess(fen).board();

  return (
    <div
      className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-box border border-base-300 bg-base-200"
      role="grid"
      aria-label="Chess board"
    >
      {board.flatMap((row, rowIndex) =>
        row.map((piece, columnIndex) => (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={`grid aspect-square select-none place-items-center text-3xl sm:text-5xl lg:text-6xl ${
              (rowIndex + columnIndex) % 2 === 0 ? "bg-base-100" : "bg-primary/20"
            }`}
            role="gridcell"
            aria-label={piece ? `${piece.color} ${piece.type}` : "empty"}
          >
            {piece ? pieces[piece.color + piece.type] : ""}
          </div>
        )),
      )}
    </div>
  );
}

function lifecycleBadge(lifecycle: string) {
  if (lifecycle === "active") return "badge-success";
  if (lifecycle === "completed") return "badge-neutral";
  return "badge-primary";
}

function agentPrompt(agent: string, color: string, link: string) {
  return `You are Agent ${agent}, playing ${color} in an autonomous chess match. Connect to the Open Game Arena MCP server at ${link}. Explore the available tools, call game.get_info, join the match, and keep calling game.wait_for_turn. When it is your turn, make a legal move. Continue until the match reaches a terminal state.`;
}

export function MatchView({ token, initial }: { token: string; initial: any }) {
  const [state, setState] = useState(initial);
  const [copiedSeat, setCopiedSeat] = useState<string | null>(null);

  useEffect(() => {
    if (state.lifecycle === "completed") return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const poll = async () => {
      if (document.hidden) {
        timer = setTimeout(poll, 2000);
        return;
      }

      try {
        const response = await fetch(`/api/matches/${token}`, { cache: "no-store" });
        if (response.ok) setState(await response.json());
      } finally {
        if (!stopped) timer = setTimeout(poll, state.lifecycle === "active" ? 2000 : 6000);
      }
    };

    timer = setTimeout(poll, 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [token, state.lifecycle]);

  async function copyPrompt(color: string, prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedSeat(color);
    setTimeout(() => setCopiedSeat(null), 1800);
  }

  async function deleteMatch() {
    if (confirm("Delete this incomplete Match permanently?")) {
      const response = await fetch(`/api/matches/${token}`, { method: "DELETE" });
      if (response.ok) location.href = "/";
    }
  }

  const baseUrl =
    typeof window === "undefined"
      ? (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000")
      : location.origin;
  const currentOutcome = state.result ?? `${state.turn} to move`;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <nav className="mb-8" aria-label="Breadcrumb">
        <a href="/" className="link link-hover inline-flex items-center gap-2 font-semibold">
          <span aria-hidden="true">←</span>
          Open Game Arena
        </a>
      </nav>

      <header className="mb-8 flex flex-col gap-5 border-b border-base-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">Match overview</h1>
            <span className={`badge badge-lg capitalize ${lifecycleBadge(state.lifecycle)}`}>
              {state.lifecycle}
            </span>
          </div>
          <p className="max-w-2xl text-base-content/70">
            Live position, agent access, and the complete move record in one place.
          </p>
        </div>

        <dl className="flex gap-8 sm:text-right">
          <div>
            <dt className="text-sm text-base-content/60">Revision</dt>
            <dd className="font-mono text-lg font-bold tabular-nums">{state.revision}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/60">Position</dt>
            <dd className="text-lg font-bold capitalize">{currentOutcome}</dd>
          </div>
        </dl>
      </header>

      {state.player_tokens && (
        <section
          className="mb-10 rounded-box bg-primary p-5 text-primary-content sm:p-6 lg:p-8"
          aria-labelledby="start-match-title"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="start-match-title" className="text-2xl font-black tracking-tight">
                Start the match
              </h2>
              <p className="mt-2 max-w-3xl text-primary-content/80">
                Copy each complete prompt and paste it into a separate AI agent. The private player
                URL is already included.
              </p>
            </div>
            <span className="badge badge-lg border-primary-content/20 bg-primary-content/10 text-primary-content">
              Primary action
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              { color: "white", agent: "A" },
              { color: "black", agent: "B" },
            ].map(({ color, agent }) => {
              const link = `${baseUrl}/chess/${state.player_tokens[color]}`;
              const prompt = agentPrompt(agent, color === "white" ? "White" : "Black", link);
              const ready = state.readiness[color];
              const profile = state.profiles.find((item: any) => item.color === color);

              return (
                <article
                  className="rounded-box bg-base-100 p-4 text-base-content sm:p-5"
                  key={color}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="badge badge-neutral badge-lg shrink-0 whitespace-nowrap">
                        Agent {agent}
                      </span>
                      <div>
                        <h3 className="font-extrabold capitalize">Play as {color}</h3>
                        <p className="text-sm text-base-content/60">
                          {profile
                            ? `${profile.client_name}${profile.model ? ` · ${profile.model}` : ""}`
                            : "No agent connected"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
                      <span
                        className={`status ${ready ? "status-success" : "status-warning"}`}
                        aria-hidden="true"
                      />
                      {ready ? "Ready" : "Waiting"}
                    </span>
                  </div>

                  <label className="mt-5 block" htmlFor={`${color}-agent-prompt`}>
                    <span className="mb-2 block text-sm font-semibold">Complete agent prompt</span>
                    <textarea
                      id={`${color}-agent-prompt`}
                      className="textarea h-40 w-full resize-none bg-base-200 font-mono text-xs leading-5"
                      value={prompt}
                      readOnly
                    />
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary mt-3 w-full"
                    onClick={() => copyPrompt(color, prompt)}
                  >
                    {copiedSeat === color
                      ? `Agent ${agent} prompt copied`
                      : `Copy Agent ${agent} prompt`}
                  </button>
                </article>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-primary-content/75">
            Keep these prompts private: each one grants control of its assigned color.
          </p>
          <span className="sr-only" aria-live="polite">
            {copiedSeat ? `${copiedSeat} agent prompt copied` : ""}
          </span>
        </section>
      )}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.85fr)] xl:gap-12">
        <section aria-labelledby="position-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="position-title" className="text-xl font-extrabold">
              Live position
            </h2>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-base-content/70">
              <span className="status status-success" aria-hidden="true" />
              Auto-updating
            </span>
          </div>

          <div className="mx-auto w-full max-w-2xl">
            <Board fen={state.fen} />
            <div className="mt-3 flex items-center justify-between font-mono text-xs font-semibold text-base-content/60">
              <span>WHITE</span>
              <span>{state.total_move_count} MOVES</span>
              <span>BLACK</span>
            </div>
          </div>
        </section>

        <aside className="space-y-8" aria-label="Match controls and activity">
          <section aria-labelledby="agents-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="agents-title" className="text-xl font-extrabold">
                Agents
              </h2>
              <span className="badge badge-ghost">2 seats</span>
            </div>

            <div className="join join-vertical w-full sm:join-horizontal xl:join-vertical 2xl:join-horizontal">
              {["white", "black"].map((color) => {
                const ready = state.readiness[color];
                const profiles = state.profiles.filter((profile: any) => profile.color === color);

                return (
                  <div
                    className="join-item min-w-0 flex-1 border border-base-300 bg-base-200 p-4"
                    key={color}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold capitalize">{color}</h3>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <span
                          className={`status ${ready ? "status-success" : "status-warning"}`}
                          aria-hidden="true"
                        />
                        {ready ? "Ready" : "Waiting"}
                      </span>
                    </div>
                    {profiles.length > 0 ? (
                      profiles.map((profile: any) => (
                        <p className="mt-3 truncate text-sm text-base-content/70" key={profile.id}>
                          {profile.client_name}
                          {profile.model ? ` · ${profile.model}` : ""}
                        </p>
                      ))
                    ) : (
                      <p className="mt-3 text-sm text-base-content/60">No agent connected</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="timeline-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="timeline-title" className="text-xl font-extrabold">
                Timeline
              </h2>
              <span className="badge badge-ghost">{state.moves.length} shown</span>
            </div>

            {state.moves.length > 0 ? (
              <ol className="list max-h-96 overflow-y-auto rounded-box border border-base-300 bg-base-100">
                {state.moves.map((move: any) => (
                  <li className="list-row items-center" key={move.ply}>
                    <span className="font-mono text-xs font-bold text-base-content/55">
                      {String(move.ply).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-bold">{move.san}</p>
                      <p className="font-mono text-xs text-base-content/60">
                        {move.from} → {move.to}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="border-y border-base-300 py-8 text-center">
                <p className="font-semibold">No moves yet</p>
                <p className="mt-1 text-sm text-base-content/65">
                  The timeline starts when both agents are ready.
                </p>
              </div>
            )}
          </section>

          {state.lifecycle !== "completed" && (
            <div className="flex justify-end border-t border-base-300 pt-6">
              <button
                type="button"
                className="btn btn-square btn-ghost text-base-content/55 hover:border-error hover:bg-error hover:text-error-content"
                onClick={deleteMatch}
                aria-label="Delete match"
                title="Delete match"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="size-5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4h6v3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.5 7l.75 13h9.5l.75-13M10 11v5M14 11v5"
                  />
                </svg>
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

"use client";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Brand } from "./brand";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { GitHubLink } from "./github-link";
import { OpenSourceSection } from "./open-source-section";
import { ThemeControl } from "./site-controls";
const resources = {
  en: {
    translation: {
      tagline: "The autonomous chess arena",
      claim: "Compatible with any AI agent",
      create: "Launch Agent Battle",
      creating: "Launching battle…",
      alternative: "Or create through MCP",
      replayBoard: "Replay the board move",
      directory: "Completed Matches",
      load: "Load more",
      winner: "Winner",
      whiteAgents: "White agents",
      blackAgents: "Black agents",
      cause: "Ending Cause",
      duration: "Duration",
      language: "Language",
      theme: "Theme",
      howLabel: "How it works",
      howTitle: "Two agents. One decisive match.",
      howIntroduction:
        "The arena handles the board, rules, clocks, and permanent move history. You bring the agents and give each one its private seat link.",
      howStepOneTitle: "Create the arena",
      howStepOneDescription:
        "Start a match from the page or through the public MCP endpoint. You receive one observer link and two player links.",
      howStepTwoTitle: "Deploy the contenders",
      howStepTwoDescription:
        "Give the White and Black links to separate AI agents. Each agent joins, declares readiness, and controls only its assigned color.",
      howStepThreeTitle: "Watch every move",
      howStepThreeDescription:
        "The agents inspect the position, make legal moves, and wait for each other until checkmate, draw, resignation, or forfeit.",
      githubLabel: "Open the GitHub repository",
      openSourceTitle: "Open source. Built for your next idea.",
      openSourceDescription:
        "Open Game Arena is built in public. Propose a new game, improve the arena, report a fix, or help us rethink how autonomous agents compete.",
      ideasGames: "New games",
      ideasImprovements: "Improvements",
      ideasFixes: "Fixes",
      newIdea: "Propose a new idea",
      ideaTypes: "Ideas you can submit",
      openSourceLabel: "Open source",
      newIssueLabel: "New issue",
      publicLabel: "Public",
    },
  },
  es: {
    translation: {
      tagline: "La arena de ajedrez autónomo",
      claim: "Compatible con cualquier agente de IA",
      create: "Lanzar duelo de agentes",
      creating: "Lanzando duelo…",
      alternative: "O crea mediante MCP",
      replayBoard: "Repetir la jugada del tablero",
      directory: "Matches completadas",
      load: "Cargar más",
      winner: "Ganador",
      whiteAgents: "Agentes de blancas",
      blackAgents: "Agentes de negras",
      cause: "Causa final",
      duration: "Duración",
      language: "Idioma",
      theme: "Tema",
      howLabel: "Cómo funciona",
      howTitle: "Dos agentes. Una partida decisiva.",
      howIntroduction:
        "La arena gestiona el tablero, las reglas, los relojes y el historial permanente. Tú aportas los agentes y entregas a cada uno el enlace privado de su color.",
      howStepOneTitle: "Crea la arena",
      howStepOneDescription:
        "Inicia una partida desde la página o mediante el MCP público. Recibirás un enlace de observador y dos enlaces de jugador.",
      howStepTwoTitle: "Despliega los rivales",
      howStepTwoDescription:
        "Entrega los enlaces de Blancas y Negras a agentes de IA distintos. Cada agente se une y controla únicamente el color asignado.",
      howStepThreeTitle: "Observa cada jugada",
      howStepThreeDescription:
        "Los agentes consultan la posición, realizan jugadas legales y se esperan hasta llegar a jaque mate, tablas, rendición o derrota por tiempo.",
      githubLabel: "Abrir el repositorio en GitHub",
      openSourceTitle: "Código abierto. Hecho para tu próxima idea.",
      openSourceDescription:
        "Open Game Arena se construye en público. Propón un nuevo juego, mejora la arena, reporta un fix o ayúdanos a replantear cómo compiten los agentes autónomos.",
      ideasGames: "Nuevos juegos",
      ideasImprovements: "Mejoras",
      ideasFixes: "Fixes",
      newIdea: "Proponer una idea",
      ideaTypes: "Ideas que puedes enviar",
      openSourceLabel: "Código abierto",
      newIssueLabel: "Nuevo issue",
      publicLabel: "Público",
    },
  },
};
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
  });
} else {
  for (const [language, bundle] of Object.entries(resources)) {
    i18n.addResourceBundle(language, "translation", bundle.translation, true, true);
  }
}

type MatchDirectory = {
  matches: any[];
  next_cursor: string | null;
};

function formatDuration(activatedAt: string, completedAt: string) {
  const totalSeconds = Math.max(
    0,
    Math.round((+new Date(completedAt) - +new Date(activatedAt)) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours ? `${hours}h` : null, minutes ? `${minutes}m` : null, `${seconds}s`]
    .filter(Boolean)
    .join(" ");
}

function AgentProfiles({ profiles }: { profiles?: any[] }) {
  if (!profiles?.length) return <span className="text-base-content/50">—</span>;

  return (
    <div className="flex flex-col gap-1">
      {profiles.slice(0, 2).map((profile, index) => (
        <span
          className="max-w-52 truncate"
          key={`${profile.client_name}-${profile.model}-${index}`}
        >
          {profile.client_name}
          {profile.model ? ` · ${profile.model}` : ""}
        </span>
      ))}
      {profiles.length > 2 && (
        <span className="text-xs font-semibold text-base-content/60">+{profiles.length - 2}</span>
      )}
    </div>
  );
}

export function ArenaHome({
  language,
  initialDirectory,
}: {
  language: string;
  initialDirectory?: MatchDirectory;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false),
    [items, setItems] = useState<any[]>(initialDirectory?.matches ?? []),
    [cursor, setCursor] = useState<string | null>(initialDirectory?.next_cursor ?? null);
  useEffect(() => {
    void i18n.changeLanguage(language);
    if (initialDirectory) return;
    fetch("/api/matches")
      .then((r) => r.json())
      .then((x) => {
        setItems(x.matches);
        setCursor(x.next_cursor);
      })
      .catch(() => {});
  }, [language, i18n, initialDirectory]);
  async function create() {
    setBusy(true);
    const r = await fetch("/api/matches", { method: "POST" });
    const x = await r.json();
    location.href = x.match_url;
  }
  async function more() {
    const x = await fetch(`/api/matches?cursor=${encodeURIComponent(cursor!)}`).then((r) =>
      r.json(),
    );
    setItems((v) => [...v, ...x.matches]);
    setCursor(x.next_cursor);
  }
  return (
    <>
      <header className="navbar max-w-6xl mx-auto">
        <div className="min-w-0 flex-1">
          <Brand preload />
        </div>
        <GitHubLink label={t("githubLabel")} />
        <ThemeControl />
      </header>
      <main>
        <Hero
          tagline={t("tagline")}
          claim={t("claim")}
          createLabel={t("create")}
          creatingLabel={t("creating")}
          alternativeLabel={t("alternative")}
          replayLabel={t("replayBoard")}
          busy={busy}
          onCreate={create}
        />
        <HowItWorks
          label={t("howLabel")}
          title={t("howTitle")}
          introduction={t("howIntroduction")}
          steps={[
            {
              title: t("howStepOneTitle"),
              description: t("howStepOneDescription"),
              artifact: "match.create() → 3 links",
            },
            {
              title: t("howStepTwoTitle"),
              description: t("howStepTwoDescription"),
              artifact: "WHITE_LINK · BLACK_LINK",
            },
            {
              title: t("howStepThreeTitle"),
              description: t("howStepThreeDescription"),
              artifact: "wait → move → result",
            },
          ]}
          ctaLabel={busy ? t("creating") : t("create")}
          busy={busy}
          onCreate={create}
        />
        {items.length > 0 && (
          <section className="max-w-6xl mx-auto p-6 md:py-16">
            <h2 className="text-3xl font-bold mb-6">{t("directory")}</h2>
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{t("whiteAgents")}</th>
                    <th>{t("blackAgents")}</th>
                    <th>{t("winner")}</th>
                    <th>{t("cause")}</th>
                    <th>{t("duration")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.public_slug}>
                      <td>
                        <a className="link" href={`/match/${m.public_slug}`}>
                          {new Date(m.completed_at).toLocaleString()}
                        </a>
                      </td>
                      <td>
                        <AgentProfiles profiles={m.white_profiles} />
                      </td>
                      <td>
                        <AgentProfiles profiles={m.black_profiles} />
                      </td>
                      <td className="font-semibold capitalize">{m.result}</td>
                      <td>{m.ending_cause}</td>
                      <td className="whitespace-nowrap font-mono">
                        {formatDuration(m.activated_at, m.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cursor && (
              <button type="button" className="btn mt-4" onClick={more}>
                {t("load")}
              </button>
            )}
          </section>
        )}
        <OpenSourceSection
          title={t("openSourceTitle")}
          description={t("openSourceDescription")}
          gamesLabel={t("ideasGames")}
          improvementsLabel={t("ideasImprovements")}
          fixesLabel={t("ideasFixes")}
          ctaLabel={t("newIdea")}
          repositoryLabel={t("ideaTypes")}
          openSourceLabel={t("openSourceLabel")}
          newIssueLabel={t("newIssueLabel")}
          publicLabel={t("publicLabel")}
        />
      </main>
    </>
  );
}

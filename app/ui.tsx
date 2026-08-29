"use client";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { ThemeControl } from "./site-controls";
const resources = {
  en: {
    translation: {
      tagline: "The autonomous chess arena",
      claim: "Compatible with any AI agent",
      create: "Launch Agent Battle",
      creating: "Launching battle…",
      alternative: "Or create through MCP",
      directory: "Completed Matches",
      load: "Load more",
      result: "Result",
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
    },
  },
  es: {
    translation: {
      tagline: "La arena de ajedrez autónomo",
      claim: "Compatible con cualquier agente de IA",
      create: "Lanzar duelo de agentes",
      creating: "Lanzando duelo…",
      alternative: "O crea mediante MCP",
      directory: "Matches completadas",
      load: "Cargar más",
      result: "Resultado",
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
    },
  },
};
if (!i18n.isInitialized)
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

type MatchDirectory = {
  matches: any[];
  next_cursor: string | null;
};

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
        <div className="flex-1 font-black text-xl">OPEN GAME ARENA</div>
        <ThemeControl />
      </header>
      <main>
        <Hero
          tagline={t("tagline")}
          claim={t("claim")}
          createLabel={t("create")}
          creatingLabel={t("creating")}
          alternativeLabel={t("alternative")}
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
        />
        {items.length > 0 && (
          <section className="max-w-6xl mx-auto p-6 md:py-16">
            <h2 className="text-3xl font-bold mb-6">{t("directory")}</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{t("result")}</th>
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
                      <td>{m.result}</td>
                      <td>{m.ending_cause}</td>
                      <td>
                        {Math.round((+new Date(m.completed_at) - +new Date(m.activated_at)) / 1000)}
                        s
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
      </main>
    </>
  );
}

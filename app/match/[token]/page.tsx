import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getObserver } from "@/lib/arena";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { MatchView } from "./view";

const getMatch = cache((token: string) => getObserver(token));

function agentName(state: any, color: "white" | "black") {
  const name = state.profiles.find((profile: any) => profile.color === color)?.client_name;
  return name ? String(name).slice(0, 40) : `${color === "white" ? "White" : "Black"} AI agent`;
}

function matchCopy(state: any) {
  const white = agentName(state, "white");
  const black = agentName(state, "black");
  const participants = `${white} vs ${black}`;
  const ending = String(state.ending_cause ?? "completed")
    .replaceAll("_", " ")
    .toLowerCase();
  const result =
    state.result === "white"
      ? `${white} won`
      : state.result === "black"
        ? `${black} won`
        : state.result === "draw"
          ? "the match ended in a draw"
          : String(state.result ?? "the match is complete");

  return {
    title: `${participants} — AI chess match`,
    description: `Replay ${participants}, an autonomous AI chess match. ${result} by ${ending} after ${state.total_move_count} moves.`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  try {
    const token = (await params).token;
    const state = await getMatch(token);
    const completed = state.lifecycle === "completed";
    const copy = completed
      ? matchCopy(state)
      : {
          title: "Live AI chess match",
          description: "Follow a live autonomous AI chess match in Open Game Arena.",
        };

    return {
      title: copy.title,
      description: copy.description,
      ...(completed ? { alternates: { canonical: `/match/${token}` } } : {}),
      robots: completed ? { index: true, follow: true } : { index: false, follow: false },
      referrer: "no-referrer",
      openGraph: {
        title: copy.title,
        description: copy.description,
        url: completed ? `/match/${token}` : undefined,
        siteName: SITE_NAME,
        type: "website",
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title: copy.title,
        description: copy.description,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return {
      title: "Unavailable match",
      description: "This Open Game Arena match is unavailable.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const savedLanguage = cookieStore.get("oga-language")?.value;
  const language =
    savedLanguage === "es" || savedLanguage === "en"
      ? savedLanguage
      : headerStore.get("accept-language")?.toLowerCase().startsWith("es")
        ? "es"
        : "en";
  let state;
  try {
    state = await getMatch(token);
  } catch {
    notFound();
  }

  const copy = state.lifecycle === "completed" ? matchCopy(state) : undefined;
  const jsonLd = copy
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${siteUrl(`/match/${token}`)}#webpage`,
        url: siteUrl(`/match/${token}`),
        name: copy.title,
        description: copy.description,
        isPartOf: { "@id": `${siteUrl()}#website` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: SITE_NAME,
              item: siteUrl(),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: copy.title,
              item: siteUrl(`/match/${token}`),
            },
          ],
        },
      }
    : undefined;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <MatchView token={token} initial={state} language={language} />
    </>
  );
}

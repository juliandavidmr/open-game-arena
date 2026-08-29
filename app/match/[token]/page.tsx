import type { Metadata } from "next";
import { getObserver } from "@/lib/arena";
import { notFound } from "next/navigation";
import { MatchView } from "./view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  try {
    const s = await getObserver((await params).token);
    return {
      title: s.lifecycle === "completed" ? `Completed Match · ${s.result}` : "Match",
      robots:
        s.lifecycle === "completed"
          ? { index: true, follow: true }
          : { index: false, follow: false },
      referrer: "no-referrer",
    };
  } catch {
    return { title: "Unavailable", robots: { index: false, follow: false } };
  }
}
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let state;
  try {
    state = await getObserver(token);
  } catch {
    notFound();
  }
  return <MatchView token={token} initial={state} />;
}

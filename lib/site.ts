export const SITE_NAME = "Open Game Arena";
export const SITE_DESCRIPTION =
  "Watch autonomous AI agents compete in public chess matches, replay every move, and launch your own agent battle.";

const configuredOrigin =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://open-game-arena.vercel.app"
    : "http://localhost:3000");

export const SITE_ORIGIN = new URL(configuredOrigin).origin;

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

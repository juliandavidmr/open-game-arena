import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Open Game Arena — autonomous AI chess matches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse renders through Satori without loading app/globals.css, so Tailwind and DaisyUI
// classes are unavailable here. These semantic colors mirror the app's DaisyUI light theme.
const theme = {
  base100: "#ffffff",
  base200: "#f2f3f7",
  baseContent: "#18181b",
  primary: "#4b32d1",
  primaryContent: "#ffffff",
};

export default async function OpenGraphImage() {
  const mark = await readFile(join(process.cwd(), "public/brand/open-game-arena-mark.png"));
  const markSource = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: theme.base200,
        color: theme.baseContent,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primary}33, transparent 60%)`,
          display: "flex",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background: theme.base100,
          border: `2px solid ${theme.primary}33`,
          display: "flex",
          flexDirection: "column",
          height: 510,
          justifyContent: "space-between",
          padding: "64px 72px",
          position: "relative",
          width: 1080,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <img
            alt=""
            height={112}
            src={markSource}
            style={{ objectFit: "contain" }}
            width={112}
          />
          <div style={{ color: theme.primary, display: "flex", fontSize: 24, letterSpacing: 6 }}>
            THE AUTONOMOUS AI CHESS ARENA
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 900, letterSpacing: -4 }}>
            OPEN GAME
          </div>
          <div
            style={{
              color: theme.primary,
              display: "flex",
              fontSize: 128,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 0.9,
            }}
          >
            ARENA
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28 }}>
          Two agents. One decisive match. Every move public.
        </div>
      </div>
    </div>,
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Open Game Arena — autonomous AI chess matches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#11120f",
        color: "#f7f4e9",
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
          background:
            "linear-gradient(135deg, rgba(188, 255, 55, 0.22), rgba(188, 255, 55, 0) 60%)",
          display: "flex",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          border: "2px solid rgba(247, 244, 233, 0.18)",
          display: "flex",
          flexDirection: "column",
          height: 510,
          justifyContent: "space-between",
          padding: "64px 72px",
          position: "relative",
          width: 1080,
        }}
      >
        <div style={{ color: "#bcff37", display: "flex", fontSize: 24, letterSpacing: 6 }}>
          THE AUTONOMOUS AI CHESS ARENA
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 900, letterSpacing: -4 }}>
            OPEN GAME
          </div>
          <div
            style={{
              color: "#bcff37",
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

import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "F1 Pit Wall — real-time Formula 1 engineering dashboard";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse at top left, #220000 0%, #0a0a0a 55%, #000 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: "#DC0000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(220,0,0,0.6)",
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: -1,
            }}
          >
            F1
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            PIT WALL
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              maxWidth: 980,
            }}
          >
            Real-time Formula 1 engineering dashboard.
          </div>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 22,
              fontWeight: 500,
              color: "#bbb",
              letterSpacing: 0.5,
            }}
          >
            <span style={{ color: "#00ff9c" }}>● LIVE</span>
            <span>Live timing</span>
            <span>·</span>
            <span>Telemetry</span>
            <span>·</span>
            <span>Strategy</span>
            <span>·</span>
            <span>Track map</span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 18,
              color: "#666",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: 1.5,
            }}
          >
            enzoabuliak.github.io/F1PitWall
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 64,
            top: 80,
            width: 360,
            height: 8,
            background: "#DC0000",
            borderRadius: 4,
            boxShadow: "0 0 24px rgba(220,0,0,0.5)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

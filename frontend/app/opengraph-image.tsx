import { ImageResponse } from "next/og";

export const alt = "Maple Route: check Canadian work permit and PR rules, with a source for every statement";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors from the light theme in globals.css (paper, ink, graphite, rule, editor).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f5f6f3",
          color: "#1c2330",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 600, borderBottom: "2px solid #d5d9d2", paddingBottom: 24 }}>
          Maple Route
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 600, lineHeight: 1.15, maxWidth: 980 }}>
            Which Canadian work permit and PR rules apply to you, and are they still true?
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#56606e" }}>
            A source for every statement. Changed rules are flagged.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#2747a3" }}>
          Free and independent. Not legal advice. Not a government service.
        </div>
      </div>
    ),
    size,
  );
}

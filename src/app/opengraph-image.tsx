import { ImageResponse } from "next/og";

// Next.js metadata file convention — auto-served at /opengraph-image
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

export const runtime = "edge";
export const alt = "OnEasy — AI Document Generation for Indian Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0A2640";
const RED = "#C80009";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: NAVY,
          padding: "72px 88px",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle radial accent */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "260px",
            background: RED,
            opacity: 0.18,
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            left: "-100px",
            width: "460px",
            height: "460px",
            borderRadius: "230px",
            background: "#1e40af",
            opacity: 0.16,
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(180deg, ${RED} 0%, #620004 100%)`,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            O
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -0.8,
            }}
          >
            <span style={{ color: "white" }}>On</span>
            <span style={{ color: RED }}>E</span>
            <span style={{ color: "white" }}>asy</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 84,
            zIndex: 10,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: RED,
              opacity: 0.9,
              marginBottom: 14,
            }}
          >
            AI Document Generation
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              color: "white",
            }}
          >
            Every business document,
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              color: "white",
              marginTop: 4,
            }}
          >
            powered by AI.
          </div>
        </div>

        {/* Service pills */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 56,
            zIndex: 10,
            flexWrap: "wrap",
          }}
        >
          {[
            "Net Worth Certificate",
            "Partnership Deed",
            "LLP Agreement",
            "Offer Letter",
            "Salary Calculator",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.92)",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: -0.3,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 56,
            left: 88,
            right: 88,
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
            color: "rgba(255,255,255,0.5)",
            fontSize: 22,
            letterSpacing: -0.3,
          }}
        >
          <div style={{ display: "flex" }}>
            getnetworthcertificate.com
          </div>
          <div style={{ display: "flex" }}>
            Trusted by 500+ Indian businesses
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

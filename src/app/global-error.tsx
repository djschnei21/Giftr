"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#faf6ef",
          color: "#1f1a17",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.035em", margin: "0 0 8px" }}>Giftr hit a snag</h1>
          <p style={{ color: "#6e645b", marginBottom: 24 }}>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ background: "#b01e2b", color: "#fffaf5", border: 0, borderRadius: 12, padding: "0 16px", height: 40, fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

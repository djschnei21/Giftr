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
          background: "#faf8f3",
          color: "#2a2723",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Giftr hit a snag</h1>
          <p style={{ color: "#6b655d", marginBottom: 20 }}>Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ background: "#1f5c45", color: "white", border: 0, borderRadius: 999, padding: "10px 20px", fontSize: 15 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

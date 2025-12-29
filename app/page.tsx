export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0b0b0b",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "2.8rem", marginBottom: "8px" }}>
        SORA LITE
      </h1>

      <p style={{ opacity: 0.7, marginBottom: "24px" }}>
        Personal AI Video Practice
      </p>

      <button
        style={{
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg,#7c7cff,#00ffe1)",
          color: "#000",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        Generate Video (Demo)
      </button>
    </main>
  );
}

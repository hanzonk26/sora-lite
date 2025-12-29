"use client";

import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  async function handleGenerate() {
    setError("");
    setResult(null);

    const p = prompt.trim();
    if (!p) {
      setError("Prompt tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });

      // kalau server balikin non-JSON / error
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 24,
        background: "#0b0b0f",
        color: "white",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ margin: 0, fontSize: 44, letterSpacing: 2 }}>SORA LITE</h1>
        <p style={{ marginTop: 8, opacity: 0.75 }}>Personal AI Video Practice</p>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <label style={{ fontSize: 12, opacity: 0.8 }}>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Contoh: "Sweepy nonton film horor, sosok mau keluar dari TV, tapi Sweepy gebuk TV pakai remote"'
            rows={5}
            style={{
              width: "100%",
              marginTop: 8,
              borderRadius: 12,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              resize: "vertical",
              fontSize: 14,
              lineHeight: 1.4,
            }}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 16,
              background: loading
                ? "rgba(120,120,120,0.35)"
                : "linear-gradient(90deg, #5aa2ff, #25f0c8)",
              color: "#0b0b0f",
            }}
          >
            {loading ? "Generating..." : "Generate Video (Demo)"}
          </button>

          {error ? (
            <p style={{ marginTop: 10, color: "#ff7a7a", fontSize: 13 }}>
              {error}
            </p>
          ) : null}
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: "12px 0 8px", fontSize: 14, opacity: 0.9 }}>
            Response
          </h3>

          <pre
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflowX: "auto",
              fontSize: 12,
              lineHeight: 1.4,
              minHeight: 90,
            }}
          >
            {result ? JSON.stringify(result, null, 2) : "Belum ada hasil."}
          </pre>
        </div>
      </div>
    </main>
  );
}
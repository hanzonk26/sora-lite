"use client";

import React, { useMemo, useState } from "react";

type GenerateResponse = any;

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<GenerateResponse | null>(null);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  const examplePrompt =
    "Sweepy nonton film horor, kamera dari belakang. Sosok di TV makin mendekat seolah mau keluar. Sweepy gebuk kepalanya pakai remote, sosok mundur. Cinematic horror tapi lucu.";

  async function onGenerate() {
    setError("");
    setData(null);

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

      // kalau server balikin text/html atau error, tetap tangkap
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { ok: false, raw: text };
      }

      if (!res.ok) {
        setError(json?.error || `Request gagal (${res.status})`);
        setData(json);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setError(e?.message || "Terjadi error jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    try {
      const pretty = data ? JSON.stringify(data, null, 2) : "";
      await navigator.clipboard.writeText(pretty);
      // kasih feedback ringan
      setError("✅ Copied ke clipboard.");
      setTimeout(() => setError(""), 1200);
    } catch {
      setError("Gagal copy (browser tidak mengizinkan).");
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(1200px 600px at 50% -10%, rgba(52,211,153,0.18), transparent 60%), radial-gradient(900px 500px at 10% 10%, rgba(56,189,248,0.12), transparent 55%), #0b0b10",
      color: "#EDEDED",
      padding: "18px 14px 40px",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
    },
    container: {
      maxWidth: 560,
      margin: "0 auto",
    },
    header: {
      marginTop: 8,
      marginBottom: 16,
      textAlign: "left",
    },
    title: {
      fontSize: 40,
      lineHeight: 1.05,
      letterSpacing: 1,
      margin: 0,
      fontWeight: 800,
    },
    subtitle: {
      marginTop: 10,
      opacity: 0.8,
      fontSize: 14,
    },
    card: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(8px)",
    },
    labelRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 10,
    },
    label: {
      fontSize: 13,
      opacity: 0.9,
      fontWeight: 700,
    },
    pillBtn: {
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "#EDEDED",
      borderRadius: 999,
      padding: "8px 10px",
      fontSize: 12,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    textarea: {
      width: "100%",
      minHeight: 130,
      resize: "vertical",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(0,0,0,0.30)",
      color: "#EDEDED",
      padding: 12,
      fontSize: 14,
      lineHeight: 1.45,
      outline: "none",
    },
    helper: {
      marginTop: 10,
      display: "flex",
      gap: 10,
      flexDirection: "column",
    },
    button: {
      width: "100%",
      border: "none",
      borderRadius: 14,
      padding: "14px 14px",
      fontSize: 15,
      fontWeight: 900,
      cursor: canSubmit ? "pointer" : "not-allowed",
      color: "#061014",
      background: canSubmit
        ? "linear-gradient(90deg, #38bdf8 0%, #34d399 100%)"
        : "linear-gradient(90deg, rgba(56,189,248,0.35), rgba(52,211,153,0.35))",
      boxShadow: canSubmit ? "0 12px 26px rgba(56,189,248,0.18)" : "none",
      transition: "transform 0.08s ease",
      userSelect: "none",
    },
    buttonSub: {
      marginTop: 8,
      fontSize: 12,
      opacity: 0.75,
      textAlign: "center",
    },
    error: {
      marginTop: 10,
      color: error.startsWith("✅") ? "#34d399" : "#fb7185",
      fontWeight: 700,
      fontSize: 13,
    },
    sectionTitle: {
      marginTop: 16,
      marginBottom: 10,
      fontSize: 14,
      fontWeight: 900,
      opacity: 0.9,
    },
    preWrap: {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      margin: 0,
      fontSize: 12.5,
      lineHeight: 1.5,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
      color: "#EDEDED",
    },
    responseTopRow: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    copyBtn: {
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "#EDEDED",
      borderRadius: 12,
      padding: "10px 12px",
      fontSize: 12,
      cursor: data ? "pointer" : "not-allowed",
      opacity: data ? 1 : 0.5,
      userSelect: "none",
    },
    footer: {
      marginTop: 14,
      fontSize: 12,
      opacity: 0.6,
      textAlign: "center",
    },
  };

  const pretty = useMemo(() => (data ? JSON.stringify(data, null, 2) : ""), [data]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>SORA LITE</h1>
          <div style={styles.subtitle}>Personal AI Video Practice</div>
        </header>

        <section style={styles.card}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Prompt</div>
            <button
              type="button"
              style={styles.pillBtn}
              onClick={() => {
                setPrompt(examplePrompt);
                setError("");
              }}
              title="Isi contoh prompt"
            >
              Pakai contoh
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Contoh: "Sweepy nonton film horor, sosok mau keluar dari TV, lalu Sweepy gebuk pakai remote..."'
            style={styles.textarea}
          />

          <div style={styles.helper}>
            <button
              type="button"
              style={styles.button}
              onClick={onGenerate}
              disabled={!canSubmit}
              onMouseDown={(e) => {
                // efek klik ringan
                if (canSubmit) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)";
              }}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              {loading ? "Generating..." : "Generate Video (Demo)"}
            </button>

            <div style={styles.buttonSub}>
              Endpoint: <b>/api/generate</b> (POST JSON)
            </div>

            {error ? <div style={styles.error}>{error}</div> : null}
          </div>
        </section>

        <div style={styles.sectionTitle}>Response</div>
        <section style={styles.card}>
          <div style={styles.responseTopRow}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {data ? "Ada hasil." : "Belum ada hasil."}
            </div>
            <button type="button" style={styles.copyBtn} onClick={onCopy} disabled={!data}>
              Copy JSON
            </button>
          </div>

          <pre style={styles.preWrap}>{data ? pretty : "—"}</pre>
        </section>

        <div style={styles.footer}>Demo UI • Next.js App Router • Mobile-first</div>
      </div>
    </main>
  );
}

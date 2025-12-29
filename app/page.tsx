"use client";

import React, { useMemo, useState } from "react";

const EXAMPLE_PROMPT =
  "Sweepy nonton film horor, sosok di TV makin mendekat, Sweepy gebuk TV pakai remote, suasana lucu tapi tegang.";

function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [raw, setRaw] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const finalPrompt: string = useMemo(() => {
    // Sesuaikan ini kalau struktur output kamu beda.
    // Dari screenshot: raw.output.finalPrompt ada.
    return raw?.output?.finalPrompt || "";
  }, [raw]);

  const canCopy = (text: string) => typeof text === "string" && text.trim().length > 0;

  async function onGenerate() {
    setError(null);
    setRaw(null);

    const text = prompt.trim();
    if (!text) {
      setError("Prompt tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request gagal (${res.status})`);
      }

      setRaw(data);
    } catch (e: any) {
      setError(e?.message || "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert(okMsg);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert(okMsg);
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      padding: "20px 14px 28px",
      display: "flex",
      justifyContent: "center",
      background:
        "radial-gradient(1200px 800px at 50% 0%, rgba(0,255,204,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, #0a1b1a 0%, #050607 70%, #050607 100%)",
      color: "#eaf6f4",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    container: {
      width: "100%",
      maxWidth: 720,
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },
    header: {
      padding: "8px 8px 2px",
    },
    title: {
      margin: 0,
      fontSize: 40,
      letterSpacing: 2,
      fontWeight: 800,
      lineHeight: 1,
    },
    subtitle: {
      margin: "10px 0 0",
      opacity: 0.85,
      fontSize: 14,
    },
    card: {
      borderRadius: 18,
      padding: 14,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
      backdropFilter: "blur(10px)",
    },
    rowBetween: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    label: {
      fontSize: 14,
      fontWeight: 700,
      opacity: 0.95,
    },
    pillBtn: {
      padding: "10px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "#eaf6f4",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
    },
    textarea: {
      width: "100%",
      minHeight: 140,
      resize: "vertical",
      padding: 14,
      marginTop: 10,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.12)",
      outline: "none",
      background: "rgba(0,0,0,0.25)",
      color: "#eaf6f4",
      fontSize: 14,
      lineHeight: 1.5,
    },
    primaryBtn: {
      width: "100%",
      marginTop: 12,
      padding: "14px 14px",
      borderRadius: 16,
      border: "1px solid rgba(0,255,204,0.22)",
      background: "linear-gradient(90deg, rgba(0,136,255,0.55), rgba(0,255,204,0.35))",
      color: "#041212",
      fontWeight: 900,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
    },
    helper: {
      marginTop: 10,
      fontSize: 12,
      opacity: 0.75,
      textAlign: "center",
    },
    error: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(255, 70, 70, 0.12)",
      border: "1px solid rgba(255, 70, 70, 0.25)",
      color: "#ffd6d6",
      fontSize: 13,
    },
    sectionTitle: {
      margin: "6px 2px 0",
      fontSize: 14,
      fontWeight: 900,
      letterSpacing: 0.3,
      opacity: 0.95,
    },
    tabs: {
      display: "flex",
      gap: 8,
      marginTop: 10,
      flexWrap: "wrap",
    },
    tabBtn: (active: boolean): React.CSSProperties => ({
      padding: "10px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
      color: "#eaf6f4",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13,
    }),
    box: {
      marginTop: 10,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.24)",
      padding: 12,
    },
    mono: {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      margin: 0,
    },
    actionsRow: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap",
      marginTop: 10,
    },
    smallBtn: {
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#eaf6f4",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13,
    },
    footer: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 12,
      opacity: 0.65,
    },
  };

  const [tab, setTab] = useState<"prompt" | "json">("prompt");

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>SORA LITE</h1>
          <p style={styles.subtitle}>Personal AI Video Practice</p>
        </header>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div style={styles.label}>Prompt</div>
            <button
              style={styles.pillBtn}
              onClick={() => setPrompt(EXAMPLE_PROMPT)}
              type="button"
              disabled={loading}
              aria-label="Pakai contoh"
              title="Pakai contoh"
            >
              Pakai contoh
            </button>
          </div>

          <textarea
            style={styles.textarea}
            placeholder='Contoh: "Sweepy nonton film horor, sosok mau keluar dari TV, lalu Sweepy gebuk pakai remote..."'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button style={styles.primaryBtn} onClick={onGenerate} disabled={loading} type="button">
            {loading ? "Generating..." : "Generate Video (Demo)"}
          </button>

          {error ? <div style={styles.error}>{error}</div> : null}

          <div style={styles.helper}>Endpoint: <b>/api/generate</b> (POST JSON)</div>
        </section>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div style={styles.sectionTitle}>Response</div>
            <div style={styles.tabs}>
              <button style={styles.tabBtn(tab === "prompt")} onClick={() => setTab("prompt")} type="button">
                Prompt Sora
              </button>
              <button style={styles.tabBtn(tab === "json")} onClick={() => setTab("json")} type="button">
                JSON
              </button>
            </div>
          </div>

          {tab === "prompt" ? (
            <div style={styles.box}>
              <pre style={styles.mono}>
                {finalPrompt ? finalPrompt : "Belum ada hasil. Klik Generate dulu."}
              </pre>

              <div style={styles.actionsRow}>
                <button
                  style={styles.smallBtn}
                  type="button"
                  disabled={!canCopy(finalPrompt)}
                  onClick={() => copyText(finalPrompt, "✅ Prompt Sora berhasil dicopy!")}
                >
                  Copy Prompt Sora
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.box}>
              <pre style={styles.mono}>{raw ? safeStringify(raw) : "Belum ada hasil."}</pre>

              <div style={styles.actionsRow}>
                <button
                  style={styles.smallBtn}
                  type="button"
                  disabled={!raw}
                  onClick={() => copyText(safeStringify(raw), "✅ JSON berhasil dicopy!")}
                >
                  Copy JSON
                </button>
              </div>
            </div>
          )}
        </section>

        <div style={styles.footer}>Demo UI • Next.js App Router • Mobile-first</div>
      </div>
    </main>
  );
}
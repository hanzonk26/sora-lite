'use client';

import React, { useMemo, useState } from 'react';

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const examplePrompt =
    'Sweepy nonton film horor, sosok di TV makin mendekat, Sweepy gebuk TV pakai remote, suasana lucu tapi tegang';

  const canSubmit = prompt.trim().length > 0 && !loading;

  const prettyResult = useMemo(() => {
    if (!result) return '';
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [result]);

  const finalPrompt = useMemo(() => {
    const fp = result?.output?.finalPrompt;
    return typeof fp === 'string' ? fp : '';
  }, [result]);

  async function onGenerate() {
    const p = prompt.trim();
    if (!p) {
      setErr('Prompt tidak boleh kosong.');
      return;
    }

    setErr('');
    setResult(null);
    setCopied(false);
    setCopiedPrompt(false);
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          `Request gagal (HTTP ${res.status}). Cek logs Vercel.`;
        throw new Error(msg);
      }

      setResult(data);
    } catch (e: any) {
      setErr(e?.message || 'Terjadi error.');
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!prettyResult) return;
    try {
      await navigator.clipboard.writeText(prettyResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback: no-op
    }
  }

  async function onCopyPrompt() {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1200);
    } catch {
      // fallback sederhana
      try {
        const ta = document.createElement('textarea');
        ta.value = finalPrompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 1200);
      } catch {
        // no-op
      }
    }
  }

  const S = styles;

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      <main style={S.container}>
        <header style={S.header}>
          <div style={S.brandRow}>
            <div style={S.logoDot} />
            <div>
              <h1 style={S.title}>SORA LITE</h1>
              <p style={S.subtitle}>Personal AI Video Practice</p>
            </div>
          </div>
          <div style={S.badgeRow}>
            <span style={S.badge}>Mobile-first</span>
            <span style={S.badge}>Next.js App Router</span>
            <span style={S.badge}>Demo UI</span>
          </div>
        </header>

        {/* Card: Prompt */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Prompt</div>
              <div style={S.cardHint}>
                Tulis ide singkat. Nanti sistem bikin output JSON storyboard/prompt.
              </div>
            </div>

            <button
              type="button"
              style={{ ...S.smallBtn, opacity: loading ? 0.6 : 1 }}
              onClick={() => {
                setPrompt(examplePrompt);
                setErr('');
              }}
              disabled={loading}
            >
              Pakai contoh
            </button>
          </div>

          <textarea
            style={S.textarea}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (err) setErr('');
            }}
            placeholder={`Contoh:\n"${examplePrompt}"`}
            rows={6}
          />

          <div style={S.actionsRow}>
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canSubmit}
              style={{
                ...S.primaryBtn,
                opacity: canSubmit ? 1 : 0.55,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Generating…' : 'Generate Video (Demo)'}
            </button>

            <div style={S.metaRight}>
              <div style={S.metaLine}>
                Endpoint: <code style={S.code}>POST /api/generate</code>
              </div>
              {err ? <div style={S.errorText}>{err}</div> : null}
            </div>
          </div>
        </section>

        {/* Card: Response */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Response</div>
              <div style={S.cardHint}>
                Hasil utama untuk Sora ada di <b>Final Prompt</b>. JSON tetap tampil untuk debug.
              </div>
            </div>

            <button
              type="button"
              onClick={onCopy}
              disabled={!prettyResult}
              style={{
                ...S.smallBtn,
                opacity: prettyResult ? 1 : 0.5,
                cursor: prettyResult ? 'pointer' : 'not-allowed',
              }}
            >
              {copied ? 'Copied ✅' : 'Copy JSON'}
            </button>
          </div>

          <div style={S.resultBox}>
            {!result && !loading && !err ? (
              <div style={S.emptyState}>Belum ada hasil.</div>
            ) : null}

            {loading ? <div style={S.loadingState}>Sedang proses…</div> : null}

            {/* Final Prompt box (yang dipakai di Sora) */}
            {result && finalPrompt ? (
              <div style={S.finalPromptBox}>
                <div style={S.finalPromptHeader}>
                  <div>
                    <div style={S.finalPromptTitle}>Final Prompt (untuk Sora)</div>
                    <div style={S.finalPromptHint}>Klik tombol untuk auto-copy, lalu paste ke prompt box Sora.</div>
                  </div>

                  <button
                    type="button"
                    onClick={onCopyPrompt}
                    disabled={!finalPrompt}
                    style={{
                      ...S.smallBtn,
                      opacity: finalPrompt ? 1 : 0.5,
                      cursor: finalPrompt ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedPrompt ? 'Copied ✅' : 'Copy Prompt'}
                  </button>
                </div>

                <pre style={S.pre}>{finalPrompt}</pre>
              </div>
            ) : null}

            {/* Raw JSON */}
            {result ? <pre style={S.pre}>{prettyResult}</pre> : null}

            {err ? (
              <div style={S.errorBox}>
                <div style={S.errorTitle}>Error</div>
                <div style={S.errorMsg}>{err}</div>
              </div>
            ) : null}
          </div>

          <div style={S.footerNote}>
            Tips: untuk test endpoint di browser, buka <code style={S.code}>/api/generate</code> (GET) cuma untuk cek hidup.
            Generate beneran pakai POST dari tombol.
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0b1b1e 0%, #070a0f 60%, #05060a 100%)',
    color: 'rgba(255,255,255,0.92)',
    padding: '18px 14px 28px',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    position: 'relative',
    overflowX: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    inset: '-40px',
    background:
      'radial-gradient(600px 280px at 20% 10%, rgba(70,255,220,0.12), transparent 60%), radial-gradient(500px 240px at 85% 20%, rgba(90,140,255,0.10), transparent 55%)',
    filter: 'blur(6px)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: 860,
    margin: '0 auto',
    position: 'relative',
  },
  header: {
    marginBottom: 14,
  },
  brandRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #4cf5db, #6aa9ff)',
    boxShadow: '0 0 24px rgba(76,245,219,0.28)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 34,
    letterSpacing: 1.2,
    lineHeight: 1.05,
    fontWeight: 800,
  },
  subtitle: {
    margin: '6px 0 0',
    opacity: 0.72,
    fontSize: 14,
  },
  badgeRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  badge: {
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    opacity: 0.9,
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 14,
    boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    marginTop: 12,
  },
  cardHead: {
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    opacity: 0.72,
    lineHeight: 1.35,
    maxWidth: 520,
  },
  textarea: {
    width: '100%',
    resize: 'vertical',
    minHeight: 120,
    padding: '12px 12px',
    borderRadius: 14,
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.92)',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.5,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  actionsRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(90deg, rgba(76,245,219,0.35), rgba(106,169,255,0.25))',
    color: 'rgba(255,255,255,0.92)',
    fontWeight: 800,
    letterSpacing: 0.2,
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
  },
  smallBtn: {
    padding: '10px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 700,
    fontSize: 13,
  },
  metaRight: {
    flex: 1,
    minWidth: 200,
  },
  metaLine: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  code: {
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,120,120,0.95)',
    fontWeight: 700,
  },
  resultBox: {
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 12,
    minHeight: 120,
    overflow: 'hidden',
  },
  finalPromptBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    background: 'rgba(0,0,0,0.22)',
    border: '1px solid rgba(76,245,219,0.20)',
  },
  finalPromptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  finalPromptTitle: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 3,
  },
  finalPromptHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 12,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.92)',
  },
  emptyState: {
    fontSize: 13,
    opacity: 0.65,
  },
  loadingState: {
    fontSize: 13,
    opacity: 0.85,
  },
  errorBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(255,120,120,0.35)',
    background: 'rgba(255,120,120,0.08)',
  },
  errorTitle: {
    fontWeight: 800,
    fontSize: 13,
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 12,
    opacity: 0.9,
  },
  footerNote: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 1.4,
  },
};
```0
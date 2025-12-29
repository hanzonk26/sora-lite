'use client';

import React, { useMemo, useState } from 'react';

type PresetKey = 'sweepy' | 'hanz26';

export default function Page() {
  const [activePreset, setActivePreset] = useState<PresetKey>('sweepy');

  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);

  const examplePromptSweepy =
    'Sweepy (@mockey.mo) nonton film horor, sosok di TV makin mendekat, Sweepy gebuk TV pakai remote, suasana lucu tapi tegang';
  const examplePromptHanz =
    '@hanz26 duduk santai seperti UGC, bercerita singkat dengan ekspresi natural, cinematic lighting, vibe relatable';

  const examplePrompt =
    activePreset === 'sweepy' ? examplePromptSweepy : examplePromptHanz;

  const canSubmit = prompt.trim().length > 0 && !loading;

  const prettyResult = useMemo(() => {
    if (!result) return '';
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [result]);

  // Ambil finalPrompt dari output (tahan banting jika key beda)
  const finalPrompt = useMemo(() => {
    const fp =
      result?.output?.finalPrompt ??
      result?.output?.finalprompt ??
      result?.finalPrompt ??
      result?.finalprompt ??
      '';
    return typeof fp === 'string' ? fp : '';
  }, [result]);

  async function safeCopy(text: string) {
    if (!text) return false;

    // Clipboard modern
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    // Fallback (hanya di browser)
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined')
        return false;
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }

  async function onGenerate() {
    const p = prompt.trim();
    if (!p) {
      setErr('Prompt tidak boleh kosong.');
      return;
    }

    setErr('');
    setResult(null);
    setCopiedJson(false);
    setCopiedFinal(false);
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Kirim preset ke backend (kalau backend belum pakai, tidak apa-apa)
        body: JSON.stringify({ prompt: p, preset: activePreset }),
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

  async function onCopyJson() {
    if (!prettyResult) return;
    const ok = await safeCopy(prettyResult);
    if (ok) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1200);
    }
  }

  async function onCopyFinalPrompt() {
    if (!finalPrompt) return;
    const ok = await safeCopy(finalPrompt);
    if (ok) {
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 1200);
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
                Pilih preset karakter, lalu tulis ide singkat. Sistem akan buat
                storyboard + finalPrompt.
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

          {/* Toggle preset */}
          <div style={S.toggleRow}>
            <button
              type="button"
              onClick={() => setActivePreset('sweepy')}
              disabled={loading}
              style={{
                ...S.toggleBtn,
                ...(activePreset === 'sweepy'
                  ? S.toggleBtnActive
                  : S.toggleBtnIdle),
                opacity: loading ? 0.7 : 1,
              }}
            >
              🐵 Sweepy
              <span style={S.toggleSub}>@mockey.mo</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePreset('hanz26')}
              disabled={loading}
              style={{
                ...S.toggleBtn,
                ...(activePreset === 'hanz26'
                  ? S.toggleBtnActive
                  : S.toggleBtnIdle),
                opacity: loading ? 0.7 : 1,
              }}
            >
              🧑 @hanz26
              <span style={S.toggleSub}>AI version</span>
            </button>
          </div>

          <textarea
            style={S.textarea}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (err) setErr('');
            }}
            placeholder={
              activePreset === 'sweepy'
                ? `Contoh:\n"${examplePromptSweepy}"`
                : `Contoh:\n"${examplePromptHanz}"`
            }
            rows={6}
          />

          <div style={S.presetInfo}>
            Preset aktif:{' '}
            <b>
              {activePreset === 'sweepy'
                ? 'Sweepy (@mockey.mo)'
                : '@hanz26 (AI version)'}
            </b>
          </div>

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
              <div style={S.metaLine}>
                Preset payload:{' '}
                <code style={S.code}>preset="{activePreset}"</code>
              </div>
              {err ? <div style={S.errorText}>{err}</div> : null}
            </div>
          </div>
        </section>

        {/* Card: Final Prompt (yang dipakai ke Sora) */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Final Prompt (Copy ke Sora)</div>
              <div style={S.cardHint}>
                Ini teks prompt final yang tinggal kamu paste ke Sora. (Bukan
                JSON.)
              </div>
            </div>

            <button
              type="button"
              onClick={onCopyFinalPrompt}
              disabled={!finalPrompt}
              style={{
                ...S.smallBtn,
                opacity: finalPrompt ? 1 : 0.5,
                cursor: finalPrompt ? 'pointer' : 'not-allowed',
              }}
            >
              {copiedFinal ? 'Copied ✅' : 'Copy Final Prompt'}
            </button>
          </div>

          <div style={S.resultBox}>
            {!finalPrompt && !loading ? (
              <div style={S.emptyState}>
                Belum ada finalPrompt. Klik <b>Generate</b> dulu.
              </div>
            ) : null}

            {loading ? <div style={S.loadingState}>Sedang proses…</div> : null}

            {finalPrompt ? <pre style={S.pre}>{finalPrompt}</pre> : null}
          </div>
        </section>

        {/* Card: Response JSON */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Response JSON</div>
              <div style={S.cardHint}>
                JSON lengkap (storyboard, style, dll). Kalau mau simpan, pakai
                tombol copy.
              </div>
            </div>

            <button
              type="button"
              onClick={onCopyJson}
              disabled={!prettyResult}
              style={{
                ...S.smallBtn,
                opacity: prettyResult ? 1 : 0.5,
                cursor: prettyResult ? 'pointer' : 'not-allowed',
              }}
            >
              {copiedJson ? 'Copied ✅' : 'Copy JSON'}
            </button>
          </div>

          <div style={S.resultBox}>
            {!result && !loading && !err ? (
              <div style={S.emptyState}>Belum ada hasil.</div>
            ) : null}

            {loading ? <div style={S.loadingState}>Sedang proses…</div> : null}

            {result ? <pre style={S.pre}>{prettyResult}</pre> : null}

            {err ? (
              <div style={S.errorBox}>
                <div style={S.errorTitle}>Error</div>
                <div style={S.errorMsg}>{err}</div>
              </div>
            ) : null}
          </div>

          <div style={S.footerNote}>
            Tips: test endpoint di browser, buka{' '}
            <code style={S.code}>/api/generate</code> (GET) cuma untuk cek hidup.
            Generate beneran pakai POST dari tombol.
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, any> = {
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
  container: { maxWidth: 860, margin: '0 auto', position: 'relative' },
  header: { marginBottom: 14 },
  brandRow: { display: 'flex', gap: 12, alignItems: 'center' },
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
  subtitle: { margin: '6px 0 0', opacity: 0.72, fontSize: 14 },
  badgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 },
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
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  cardHint: {
    fontSize: 12,
    opacity: 0.72,
    lineHeight: 1.35,
    maxWidth: 520,
  },

  toggleRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.92)',
    background: 'rgba(255,255,255,0.06)',
    fontWeight: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  toggleBtnActive: {
    background:
      'linear-gradient(90deg, rgba(76,245,219,0.35), rgba(106,169,255,0.25))',
    border: '1px solid rgba(76,245,219,0.25)',
  },
  toggleBtnIdle: {
    background: 'rgba(255,255,255,0.06)',
  },
  toggleSub: {
    fontSize: 12,
    opacity: 0.75,
    fontWeight: 700,
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
  presetInfo: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.8,
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
    background:
      'linear-gradient(90deg, rgba(76,245,219,0.35), rgba(106,169,255,0.25))',
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
  metaRight: { flex: 1, minWidth: 200 },
  metaLine: { fontSize: 12, opacity: 0.75, marginTop: 2 },
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
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 12,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.92)',
  },
  emptyState: { fontSize: 13, opacity: 0.65 },
  loadingState: { fontSize: 13, opacity: 0.85 },
  errorBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(255,120,120,0.35)',
    background: 'rgba(255,120,120,0.08)',
  },
  errorTitle: { fontWeight: 800, fontSize: 13, marginBottom: 4 },
  errorMsg: { fontSize: 12, opacity: 0.9 },
  footerNote: { marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.4 },
};
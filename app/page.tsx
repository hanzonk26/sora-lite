'use client';

import React, { useMemo, useRef, useState } from 'react';

type PresetKey = 'sweepy' | 'hanz26';
type NicheKey = 'daily' | 'ugc' | 'fitness';

const SORA_WEB_URL = 'https://sora.com'; // fallback
const SORA_ANDROID_DEEPLINK = 'intent://#Intent;scheme=sora;package=com.openai.sora;end';

export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('sweepy');
  const [niche, setNiche] = useState<NicheKey>('daily');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const finalRef = useRef<HTMLDivElement | null>(null);

  const presetLabel: Record<PresetKey, { title: string; sub: string; emoji: string }> = {
    sweepy: { title: 'Sweepy', sub: '@mockey.mo', emoji: '🐵' },
    hanz26: { title: '@hanz26', sub: 'AI version', emoji: '🧑' },
  };

  const nicheLabel: Record<NicheKey, { title: string; hint: string }> = {
    daily: { title: 'Daily', hint: 'kegiatan harian ringan & natural' },
    ugc: { title: 'UGC', hint: 'konten ngobrol/review/soft selling' },
    fitness: { title: 'Fitness', hint: 'habit sehat, gym/lifestyle, motivasi ringan' },
  };

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
    return result?.output?.finalPrompt ? String(result.output.finalPrompt) : '';
  }, [result]);

  // =========================
  // Random helper (always new)
  // =========================
  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // =========================
  // 1-scene DAILY IDEA BUILDER
  // =========================
  function buildDailyIdea(presetKey: PresetKey, nicheKey: NicheKey) {
    const places = [
      'teras rumah sore hari',
      'warung kopi sepi',
      'kamar kos sederhana',
      'ruang tamu dengan TV',
      'taman kecil dekat rumah',
      'dapur sederhana malam hari',
      'gang kecil habis hujan',
      'kafe minimalis yang tenang',
    ];

    // --- Sweepy: daily/funny/hero/horror ringan (tetap 1 scene) ---
    const sweepyDailyActions = [
      'duduk santai sambil ngopi, menatap kosong sebentar lalu senyum kecil',
      'menyapu halaman dengan gerakan santai tapi ekspresi serius lucu',
      'nonton TV sambil ngemil pelan, lalu menoleh ke kamera seolah ketahuan',
      'membereskan meja kecil dengan teliti seperti perfeksionis',
      'rebahan sambil main HP, lalu tiba-tiba ingat sesuatu dan langsung duduk',
      'pilih playlist musik lalu goyang tipis dengan gaya malu-malu',
    ];

    const sweepyTwists = [
      'gelas kopinya hampir jatuh lalu diselamatkan dengan ekspresi panik',
      'Sweepy sadar kamera lalu langsung sok cool (pose 2 detik) lalu ketawa kecil',
      'Sweepy salah ambil remote, TV mute, lalu ia bingung nyari tombol volume',
      'ada suara kecil bikin kaget… ternyata notifikasi HP sendiri',
      'pintu berderit pelan, Sweepy menoleh… ternyata angin (ending lega + nyengir)',
    ];

    const sweepyHero = [
      'memungut sampah plastik dan membuangnya ke tempat sampah dengan bangga',
      'membantu anak kucing kecil menyeberang pelan-pelan',
      'menyelamatkan barang yang hampir jatuh dari meja dengan refleks cepat',
      'membereskan jalan kecil dari sampah ringan (hero kecil yang wholesome)',
    ];

    // --- Hanz: rapi, trendi, santai-tenang (1 scene UGC) ---
    const hanzSettings = [
      'di kamar dengan cahaya natural dari jendela',
      'di kafe minimalis yang tenang',
      'di teras rumah sore hari dengan ambience hangat',
      'di ruang tamu rapi dengan lampu warm',
      'di dekat jendela, background bersih & aesthetic',
    ];

    const hanzOutfits = [
      'clean minimal outfit: kaos polos premium + celana bahan slim + sneakers putih bersih',
      'smart casual: kemeja linen warna netral + celana chino + jam tangan sederhana',
      'street clean: jaket tipis modern + kaos basic + cargo rapi + sneakers clean',
      'monochrome look: atasan gelap rapi + celana gelap + sepatu minimalis',
    ];

    const hanzHooks = [
      '“Gue gak ngejar perfect… gue ngejar konsisten.”',
      '“Kalau kamu lagi capek, coba ini dulu. Simple.”',
      '“Yang bikin sehat itu bukan motivasi. Tapi kebiasaan kecil.”',
      '“Ini cara gue biar tetap tenang tapi tetap jalan.”',
      '“Boleh jujur? Ini yang paling gampang tapi ngaruh.”',
    ];

    const hanzTopicsUGC = [
      '1 kebiasaan pagi yang bikin energi lebih stabil',
      'tips kecil biar konsisten hidup sehat tanpa drama',
      'cara tetap fit meski jadwal padat',
      'mini reminder biar gak overthinking soal progress',
      'soft selling halus: rekomendasi produk (tanpa hard sell) sambil cerita singkat',
    ];

    const hanzFitnessTopics = [
      'pemanasan 30 detik yang sering orang skip, padahal penting',
      'cara bikin workout tetap jalan walau cuma 10 menit',
      'habit minum air + jalan kaki yang underrated',
      'cara jaga pola makan tanpa “diet ketat”',
      'cara bikin tidur lebih berkualitas tanpa ribet',
    ];

    // =========================
    // Build string per preset/niche
    // =========================
    if (presetKey === 'hanz26') {
      const topic =
        nicheKey === 'fitness' ? pick(hanzFitnessTopics) : pick(hanzTopicsUGC);

      return `@hanz26 tampil rapi & trendi (${pick(hanzOutfits)}). Setting: ${pick(
        hanzSettings
      )}. 1 scene UGC, vibe santai-tenang, bahasa Indonesia natural. Mulai dengan hook: ${pick(
        hanzHooks
      )} Lanjut bahas: ${topic}. Kamera smartphone stabil (handheld halus), framing medium shot, lighting bagus, ekspresi kalem & percaya diri. Durasi 10–12 detik.`;
    }

    // default Sweepy
    const mode = pick(['daily', 'funny', 'hero'] as const);

    if (mode === 'hero') {
      return `@mockey.mo (Sweepy) di ${pick(places)}. 1 scene: ${pick(
        sweepyHero
      )}. Ekspresi polos dan tulus, gerakan natural, hangat, realistis. Akhiri dengan senyum kecil/anggukan. Durasi 10–12 detik.`;
    }

    if (mode === 'funny') {
      return `@mockey.mo (Sweepy) di ${pick(places)}. 1 scene: ${pick(
        sweepyDailyActions
      )}. Twist lucu ringan: ${pick(
        sweepyTwists
      )}. Komedi natural, ekspresi jelas, timing pas, tetap realistis. Durasi 10–12 detik.`;
    }

    return `@mockey.mo (Sweepy) di ${pick(places)}. 1 scene: ${pick(
      sweepyDailyActions
    )}. Aktivitas sederhana tanpa konflik besar. Suasana hangat, natural, realistis seperti vlog daily. Durasi 10–12 detik.`;
  }

  // =========================
  // API calls
  // =========================
  async function generateWithText(text: string) {
    const p = text.trim();
    if (!p) {
      setErr('Prompt tidak boleh kosong.');
      return;
    }

    setErr('');
    setResult(null);
    setLoading(true);
    setCopiedFinal(false);
    setCopiedJson(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, preset, niche }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.error || data?.message || `Request gagal (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      setResult(data);

      setTimeout(() => {
        finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (e: any) {
      setErr(e?.message || 'Terjadi error.');
    } finally {
      setLoading(false);
    }
  }

  async function onGenerate() {
    await generateWithText(prompt);
  }

  async function onAutoGenerate() {
    const idea = buildDailyIdea(preset, niche);
    setPrompt(idea);
    setErr('');
    await generateWithText(idea);
  }

  async function onCopyFinal() {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 1200);
    } catch {
      // no-op
    }
  }

  async function onCopyJson() {
    if (!prettyResult) return;
    try {
      await navigator.clipboard.writeText(prettyResult);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1200);
    } catch {
      // no-op
    }
  }

  function onClear() {
    setPrompt('');
    setErr('');
    setResult(null);
  }

  function openSoraApp() {
    // Prefer Android intent deep link, fallback to web
    try {
      window.location.href = SORA_ANDROID_DEEPLINK;
      setTimeout(() => {
        window.location.href = SORA_WEB_URL;
      }, 700);
    } catch {
      window.location.href = SORA_WEB_URL;
    }
  }

  const S = styles;

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      <main style={S.container}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.brandRow}>
            <div style={S.logoDot} />
            <div>
              <h1 style={S.title}>SORA LITE</h1>
              <p style={S.subtitle}>Daily Content Generator (1-scene)</p>
            </div>
          </div>

          <div style={S.badgeRow}>
            <span style={S.badge}>Mobile-first</span>
            <span style={S.badge}>Daily ideas</span>
            <span style={S.badge}>Copy-to-Sora</span>
          </div>
        </header>

        {/* Prompt Card */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Prompt</div>
              <div style={S.cardHint}>
                Pilih preset + niche, lalu tulis ide. Atau klik <b>Auto-generate</b> untuk ide baru (1 scene).
              </div>
            </div>

            <button
              type="button"
              style={{ ...S.smallBtn, opacity: loading ? 0.6 : 1 }}
              onClick={onAutoGenerate}
              disabled={loading}
              title="Buat ide baru + generate otomatis"
            >
              {loading ? 'Generating…' : 'Auto-generate'}
            </button>
          </div>

          {/* Preset toggle */}
          <div style={S.presetRow}>
            {(['sweepy', 'hanz26'] as PresetKey[]).map((k) => {
              const active = preset === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPreset(k)}
                  disabled={loading}
                  style={{
                    ...S.presetBtn,
                    ...(active ? S.presetBtnActive : null),
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  <div style={S.presetTop}>
                    <span style={S.presetEmoji}>{presetLabel[k].emoji}</span>
                    <span style={S.presetTitle}>{presetLabel[k].title}</span>
                  </div>
                  <div style={S.presetSub}>{presetLabel[k].sub}</div>
                </button>
              );
            })}
          </div>

          {/* Niche toggle */}
          <div style={S.nicheRow}>
            {(['daily', 'ugc', 'fitness'] as NicheKey[]).map((k) => {
              const active = niche === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNiche(k)}
                  disabled={loading}
                  style={{
                    ...S.nicheBtn,
                    ...(active ? S.nicheBtnActive : null),
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  <div style={S.nicheTitle}>{nicheLabel[k].title}</div>
                  <div style={S.nicheHint}>{nicheLabel[k].hint}</div>
                </button>
              );
            })}
          </div>

          <textarea
            style={S.textarea}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (err) setErr('');
            }}
            placeholder="Tulis ide singkat… atau tekan Auto-generate."
            rows={7}
          />

          <div style={S.miniRow}>
            <div style={S.miniLeft}>
              <div style={S.miniText}>
                Preset: <span style={S.miniStrong}>{presetLabel[preset].title}</span> • Niche:{' '}
                <span style={S.miniStrong}>{nicheLabel[niche].title}</span>
              </div>
            </div>

            <div style={S.miniRight}>
              <span style={S.charCount}>{prompt.length} chars</span>
              <button type="button" onClick={onClear} disabled={loading && prompt.length === 0} style={S.linkBtn}>
                Clear
              </button>
            </div>
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
              {loading ? 'Generating…' : 'Generate (Demo)'}
            </button>

            <div style={S.metaRight}>
              <div style={S.metaLine}>
                Endpoint: <code style={S.code}>POST /api/generate</code>
              </div>
              <div style={S.metaLine}>
                Payload: <code style={S.code}>preset="{preset}", niche="{niche}"</code>
              </div>
              {err ? <div style={S.errorText}>{err}</div> : null}
            </div>
          </div>

          <div style={S.openRow}>
            <button type="button" onClick={openSoraApp} style={S.openBtn}>
              Open Sora App
            </button>
            <a href={SORA_WEB_URL} target="_blank" rel="noreferrer" style={S.openLink}>
              Open Sora Web
            </a>
          </div>
        </section>

        {/* Final Prompt */}
        <section style={S.card} ref={finalRef}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Final Prompt (Copy ke Sora)</div>
              <div style={S.cardHint}>Paste ini ke Sora. (Bukan JSON.)</div>
            </div>

            <button
              type="button"
              onClick={onCopyFinal}
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
            {!finalPrompt && !loading ? <div style={S.emptyState}>Belum ada hasil. Klik Generate / Auto-generate.</div> : null}
            {loading ? <div style={S.loadingState}>Sedang proses…</div> : null}
            {finalPrompt ? <pre style={S.pre}>{finalPrompt}</pre> : null}
          </div>
        </section>

        {/* JSON */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Response (JSON)</div>
              <div style={S.cardHint}>Opsional: kalau mau inspect hasil output API.</div>
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
            {!result && !loading && !err ? <div style={S.emptyState}>Belum ada hasil.</div> : null}
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
            Tips: test endpoint GET di <code style={S.code}>/api/generate</code> untuk cek hidup. Generate pakai POST via tombol.
          </div>
        </section>

        <div style={S.bottomPad} />
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
  title: { margin: 0, fontSize: 34, letterSpacing: 1.2, lineHeight: 1.05, fontWeight: 800 },
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
  cardTitle: { fontSize: 16, fontWeight: 800, marginBottom: 4 },
  cardHint: { fontSize: 12, opacity: 0.72, lineHeight: 1.35, maxWidth: 560 },
  presetRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
  presetBtn: {
    textAlign: 'left',
    padding: 12,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.92)',
  },
  presetBtnActive: {
    border: '1px solid rgba(76,245,219,0.35)',
    background: 'linear-gradient(90deg, rgba(76,245,219,0.18), rgba(106,169,255,0.12))',
    boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
  },
  presetTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  presetEmoji: { fontSize: 18 },
  presetTitle: { fontWeight: 900, fontSize: 15, letterSpacing: 0.2 },
  presetSub: { fontSize: 12, opacity: 0.78 },

  nicheRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 },
  nicheBtn: {
    textAlign: 'left',
    padding: 10,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.92)',
  },
  nicheBtnActive: {
    border: '1px solid rgba(106,169,255,0.35)',
    background: 'linear-gradient(90deg, rgba(106,169,255,0.16), rgba(76,245,219,0.10))',
  },
  nicheTitle: { fontWeight: 900, fontSize: 13, marginBottom: 2 },
  nicheHint: { fontSize: 11, opacity: 0.72, lineHeight: 1.2 },

  textarea: {
    width: '100%',
    resize: 'vertical',
    minHeight: 140,
    padding: '12px 12px',
    borderRadius: 14,
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.92)',
    outline: 'none',
    fontSize: 14,
    lineHeight: 1.55,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  miniRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  miniLeft: { flex: 1 },
  miniRight: { display: 'flex', alignItems: 'center', gap: 10 },
  miniText: { fontSize: 12, opacity: 0.78 },
  miniStrong: { fontWeight: 800, opacity: 1 },
  charCount: { fontSize: 12, opacity: 0.78 },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(76,245,219,0.95)',
    fontWeight: 800,
    cursor: 'pointer',
    padding: 6,
  },
  actionsRow: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap' },
  primaryBtn: {
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(90deg, rgba(76,245,219,0.35), rgba(106,169,255,0.25))',
    color: 'rgba(255,255,255,0.92)',
    fontWeight: 900,
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
    fontWeight: 900,
    fontSize: 13,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  metaRight: { flex: 1, minWidth: 220 },
  metaLine: { fontSize: 12, opacity: 0.75, marginTop: 4 },
  code: {
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  errorText: { marginTop: 8, fontSize: 12, color: 'rgba(255,120,120,0.95)', fontWeight: 900 },

  openRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  openBtn: {
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.25)',
    color: 'rgba(255,255,255,0.92)',
    fontWeight: 900,
    cursor: 'pointer',
  },
  openLink: { color: 'rgba(106,169,255,0.95)', fontWeight: 900, textDecoration: 'none' },

  resultBox: {
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 12,
    minHeight: 120,
    overflow: 'hidden',
  },
  pre: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)' },
  emptyState: { fontSize: 13, opacity: 0.65 },
  loadingState: { fontSize: 13, opacity: 0.85 },
  errorBox: { marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid rgba(255,120,120,0.35)', background: 'rgba(255,120,120,0.08)' },
  errorTitle: { fontWeight: 900, fontSize: 12, marginBottom: 4 },
  errorMsg: { fontSize: 12, opacity: 0.92 },
  footerNote: { marginTop: 10, fontSize: 12, opacity: 0.72 },
  bottomPad: { height: 30 },
};
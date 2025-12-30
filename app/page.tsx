'use client';

import React, { useMemo, useRef, useState } from 'react';

type PresetKey = 'sweepy' | 'hanz26' | 'reference';

export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('sweepy');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);

  const finalRef = useRef<HTMLDivElement | null>(null);

  const presetLabel: Record<PresetKey, { title: string; sub: string; emoji: string }> = {
    sweepy: { title: 'Sweepy', sub: '@mockey.mo', emoji: '🐵' },
    hanz26: { title: '@hanz26', sub: 'UGC (Indonesia)', emoji: '🧑' },
    reference: { title: 'Reference Photo', sub: 'Upload foto di Sora', emoji: '🖼️' },
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

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ✅ Sweepy generator (1 scene, 6s, daily/funny/hero/horror ringan)
  function makeSweepyIdea() {
    const places = [
      'warung kopi kecil yang sepi',
      'teras rumah sore hari',
      'kamar kos sederhana',
      'ruang tamu dengan TV tua',
      'halaman belakang rumah',
      'dapur sederhana malam hari',
      'taman kecil dekat rumah',
      'pinggir jalan kecil saat mendung',
    ];

    const dailyActions = [
      'duduk santai sambil ngopi',
      'rebahan sambil main HP',
      'menyapu halaman dengan gaya malas tapi lucu',
      'makan mie instan dengan ekspresi super serius',
      'nonton TV sambil ngemil pelan',
      'membersihkan meja kecil dengan teliti',
      'pilih playlist musik lalu ikut goyang tipis',
      'ngatur barang-barang berantakan jadi rapi',
    ];

    const funnyTwists = [
      'gelas kopinya hampir jatuh lalu diselamatkan dengan ekspresi panik',
      'Sweepy sadar kamera lalu langsung sok cool',
      'Sweepy bengong lama lalu baru sadar ada notifikasi',
      'Sweepy kaget suara kecil lalu cek sekeliling dengan gaya dramatis (ternyata aman)',
      'Sweepy refleks melakukan hal konyol lalu malu sendiri',
      'Sweepy salah ambil remote, pencet mute, lalu nyari-nyari tombolnya',
    ];

    const heroMoments = [
      'memungut sampah plastik dan membuangnya ke tempat sampah',
      'membereskan barang yang hampir jatuh dari meja',
      'menolong anak kucing kecil yang kebingungan',
      'membantu orang tua membawa barang ringan dengan sopan',
      'menutup pintu yang berderit agar tidak mengganggu orang lain',
    ];

    const horrorLight = [
      'suara TV berubah statis 1–2 detik lalu normal lagi',
      'bayangan aneh muncul sebentar lalu hilang (ternyata pantulan)',
      'pintu berderit pelan, Sweepy menoleh… ternyata angin',
      'pantulan kaca terlihat aneh, tapi cuma efek cahaya',
    ];

    const mode = pick(['daily', 'funny', 'hero', 'horror'] as const);
    const base = `@mockey.mo (Sweepy) di ${pick(places)}, ${pick(dailyActions)}.`;

    if (mode === 'hero') {
      return `${base} Lalu Sweepy ${pick(heroMoments)} dengan ekspresi polos dan tulus. Single scene, 6 detik, natural, realistis.`;
    }
    if (mode === 'horror') {
      return `${base} Ada momen horor ringan: ${pick(
        horrorLight
      )}. Ending aman & lucu tipis (Sweepy lega/nyengir). Single scene, 6 detik, natural, realistis.`;
    }
    if (mode === 'funny') {
      return `${base} Twist lucu: ${pick(funnyTwists)}. Komedi natural, timing pas. Single scene, 6 detik, realistis.`;
    }
    return `${base} Aktivitas sederhana tanpa konflik besar. Vibe hangat seperti vlog daily. Single scene, 6 detik, realistis.`;
  }

  // ✅ @hanz26 UGC generator (1 scene, 6s, Bahasa Indonesia)
  function makeHanzIdea() {
    const settings = [
      'di kamar dengan cahaya natural dari jendela',
      'di kafe minimalis yang tenang',
      'di teras rumah sore hari',
      'di ruang tamu rapi dengan ambience hangat',
      'di depan cermin, gaya get-ready-with-me',
    ];

    const hooks = [
      '“Gue dulu sering gagal konsisten… sampai gue ubah 1 hal ini.”',
      '“Kalau kamu ngerasa mager, coba cara ini dulu.”',
      '“Yang bikin gue rutin itu bukan motivasi… tapi sistem.”',
      '“Ini tips paling simpel tapi efeknya kerasa.”',
      '“Boleh jujur? Cara ini enak banget dijalanin.”',
    ];

    const topics = [
      'tips singkat biar tetap konsisten hidup sehat',
      'rutinitas pagi sederhana yang bikin mood naik',
      '3 kebiasaan kecil yang bantu badan lebih fit',
      'cerita singkat pengalaman pribadi yang relatable',
      'soft selling halus: rekomendasi produk tanpa hard selling',
    ];

    return `@hanz26 gaya UGC ${pick(settings)}. Buka dengan hook: ${pick(
      hooks
    )} Lalu bahas: ${pick(
      topics
    )}. Bahasa Indonesia, natural, ramah, framing smartphone handheld. Single scene, 6 detik.`;
  }

  // ✅ Reference Photo preset (tanpa karakter spesifik, pakai foto upload di Sora)
  function makeReferenceIdea() {
    const actions = [
      'menoleh pelan lalu senyum tipis',
      'mengangkat cangkir minum sedikit',
      'menatap kamera sebentar lalu melihat ke samping',
      'menghela napas pelan, ekspresi tenang',
      'merapikan kerah baju atau rambut secara natural',
      'mengangguk kecil seperti setuju/oke',
    ];

    const settings = [
      'di ruangan dengan cahaya lembut dari samping',
      'di kafe tenang dengan ambience hangat',
      'di teras rumah saat sore',
      'di ruangan minimalis dengan background bersih',
      'di luar ruangan saat mendung, lighting soft',
    ];

    return `Use the uploaded reference photo as the character identity (match face, outfit, hairstyle). Single scene, 6 seconds. Setting: ${pick(
      settings
    )}. Action: ${pick(actions)}. Keep motion minimal and realistic. No redesign, no outfit change, no scene change, no text overlay.`;
  }

  function makeAutoIdea() {
    if (preset === 'sweepy') return makeSweepyIdea();
    if (preset === 'hanz26') return makeHanzIdea();
    return makeReferenceIdea();
  }

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
        // kirim preset (opsional, backend boleh ignore)
        body: JSON.stringify({ prompt: p, preset }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.error || data?.message || `Request gagal (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      setResult(data);

      setTimeout(() => {
        finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
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
    const idea = makeAutoIdea();
    setPrompt(idea);
    setErr('');
    await generateWithText(idea);
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

  function onClear() {
    setPrompt('');
    setErr('');
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
              <p style={S.subtitle}>Prompt Builder (6s default)</p>
            </div>
          </div>

          <div style={S.badgeRow}>
            <span style={S.badge}>Mobile-first</span>
            <span style={S.badge}>Auto-generate</span>
            <span style={S.badge}>Copy Final Prompt</span>
          </div>
        </header>

        {/* Card: Prompt */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Prompt</div>
              <div style={S.cardHint}>
                Pilih preset karakter, lalu tulis ide singkat. Atau tekan <b>Auto-generate</b> untuk buat ide baru dan langsung generate final prompt.
                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  {preset === 'reference' ? (
                    <span>
                      🖼️ <b>Reference Photo:</b> Upload foto referensi di Sora terlebih dulu, lalu paste final prompt.
                    </span>
                  ) : null}
                </div>
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
            {(['sweepy', 'hanz26', 'reference'] as PresetKey[]).map((k) => {
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
                Preset aktif: <span style={S.miniStrong}>{presetLabel[preset].title} ({presetLabel[preset].sub})</span>
              </div>
              <div style={S.miniText}>
                Default durasi: <span style={S.miniStrong}>6 detik</span> (single scene)
              </div>
            </div>

            <div style={S.miniRight}>
              <span style={S.charCount}>{prompt.length} chars</span>
              <button type="button" onClick={onClear} disabled={loading || prompt.length === 0} style={S.linkBtn}>
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
              {loading ? 'Generating…' : 'Generate (Builder)'}
            </button>

            <div style={S.metaRight}>
              <div style={S.metaLine}>
                Endpoint: <code style={S.code}>POST /api/generate</code>
              </div>
              <div style={S.metaLine}>
                Preset payload: <code style={S.code}>preset="{preset}"</code>
              </div>
              {err ? <div style={S.errorText}>{err}</div> : null}
            </div>
          </div>
        </section>

        {/* Card: Final Prompt */}
        <section style={S.card} ref={finalRef}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Final Prompt (Paste ke Sora)</div>
              <div style={S.cardHint}>Ini teks final prompt yang tinggal kamu paste ke Sora / tool video lain.</div>
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
            {!finalPrompt && !loading ? <div style={S.emptyState}>Belum ada hasil. Tekan Generate atau Auto-generate.</div> : null}
            {loading ? <div style={S.loadingState}>Sedang proses…</div> : null}
            {finalPrompt ? <pre style={S.pre}>{finalPrompt}</pre> : null}
          </div>
        </section>

        {/* Card: Response JSON */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Response (JSON)</div>
              <div style={S.cardHint}>Kalau mau inspect output, copy JSON-nya.</div>
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
            Tips: untuk test endpoint, buka <code style={S.code}>/api/generate</code> (GET) cuma untuk cek hidup. Generate beneran pakai POST dari tombol.
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
    maxWidth: 900,
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
    fontWeight: 900,
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
    fontWeight: 900,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    opacity: 0.72,
    lineHeight: 1.35,
    maxWidth: 620,
  },
  presetRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 12,
  },
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
  presetTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  presetEmoji: {
    fontSize: 18,
  },
  presetTitle: {
    fontWeight: 900,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  presetSub: {
    fontSize: 12,
    opacity: 0.78,
  },
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
  miniRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  miniLeft: { flex: 1 },
  miniRight: { display: 'flex', alignItems: 'center', gap: 10 },
  miniText: { fontSize: 12, opacity: 0.78, marginTop: 2 },
  miniStrong: { fontWeight: 900, opacity: 1 },
  charCount: { fontSize: 12, opacity: 0.78 },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(76,245,219,0.95)',
    fontWeight: 900,
    cursor: 'pointer',
    padding: 6,
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
  },
  metaRight: {
    flex: 1,
    minWidth: 220,
  },
  metaLine: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 4,
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
    fontWeight: 900,
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
    lineHeight: 1.6,
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
    fontWeight: 900,
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
  bottomPad: { height: 12 },
};
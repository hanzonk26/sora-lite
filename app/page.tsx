'use client';

import React, { useEffect, useMemo, useState } from 'react';

type PresetKey = 'sweepy' | 'hanz26';
type NicheKey = 'daily' | 'horror' | 'funny' | 'ugc' | 'fitness';

type SavedItem = {
  id: string;
  dateKey: string; // YYYY-MM-DD
  preset: PresetKey;
  niche: NicheKey;
  title: string;
  hook: string;
  scene: string;
  finalPrompt: string;
  caption: string;
  hashtags: string;
  createdAt: number;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Deterministic RNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)];
}

const PRESET_LABEL: Record<PresetKey, { title: string; sub: string; emoji: string }> = {
  sweepy: { title: 'Sweepy', sub: '@mockey.mo', emoji: '🐵' },
  hanz26: { title: '@hanz26', sub: 'AI version', emoji: '🧑' },
};

const NICHE_LABEL: Record<NicheKey, { title: string; hint: string }> = {
  daily: { title: 'Daily', hint: 'kegiatan harian natural' },
  horror: { title: 'Horror ringan', hint: 'tegang tipis, aman, lucu di ending' },
  funny: { title: 'Funny', hint: 'komedi natural, timing punchline' },
  ugc: { title: 'UGC', hint: 'vlog/review/relatable, handheld' },
  fitness: { title: 'Fitness', hint: 'habit sehat, gym/lifestyle, motivasi ringan' },
};

function buildDailyIdea(dateKey: string, preset: PresetKey, niche: NicheKey) {
  const seed = hashStringToSeed(`${dateKey}|${preset}|${niche}`);
  const rng = mulberry32(seed);

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

  const sweepyDaily = [
    'duduk santai sambil ngopi pelan',
    'menyapu halaman dengan gerakan malas tapi lucu',
    'ngemil sambil nonton TV',
    'merapikan barang berantakan jadi rapi',
    'main HP lalu berhenti karena sadar baterai low',
    'nyalain kipas angin, lalu rambutnya berantakan',
  ];

  const sweepyFunnyTwist = [
    'gelas hampir jatuh lalu diselamatkan panik',
    'sadar kamera lalu pura-pura cool',
    'kaget notifikasi lalu cek sekeliling dramatis',
    'salah pencet remote bikin TV mute lalu bingung',
    'mau gaya elegan tapi malah keseleo kecil lalu ketawa sendiri',
  ];

  const sweepyHorrorLight = [
    'TV tiba-tiba jadi statis 2 detik lalu normal',
    'pintu berderit pelan, ternyata angin',
    'bayangan muncul sebentar ternyata pantulan',
    'suara “klik” kecil dari dapur, ternyata es batu jatuh',
  ];

  const hanzHooks = [
    '“Gue dulu sering gagal konsisten… sampai gue ubah 1 hal ini.”',
    '“Kalau kamu mager, coba ini dulu—simpel banget.”',
    '“Motivasi itu naik-turun. Yang gue pegang justru ini…”',
    '“Ini kebiasaan kecil yang efeknya kerasa banget.”',
    '“Boleh jujur? Gue baru nemu cara yang enak dijalanin.”',
  ];

  const hanzTopicsUGC = [
    'tips 1 menit biar tetap konsisten hidup sehat',
    'rutinitas pagi sederhana yang bikin mood naik',
    '3 kebiasaan kecil yang bikin badan lebih fit',
    'cara bikin target sehat jadi gampang dijalanin',
    'soft selling halus: rekomendasi tanpa hard selling',
  ];

  const fitnessActions = [
    'pemanasan singkat + 1 gerakan utama (contoh: push-up/skip ringan) dengan form aman',
    'meal prep simple (contoh: air putih + buah) sambil jelasin 1 tips',
    'jalan santai 5 menit, jelasin “trik mulai dulu”',
    'stretching bahu/leher, jelasin manfaatnya',
    'bikin checklist kecil “hari ini gue cuma…”',
  ];

  const captions = [
    'Yang penting mulai dulu, rapi belakangan.',
    'Kecil-kecil yang penting konsisten.',
    'Kalau kamu ngerasa stuck, coba versi paling gampang dulu.',
    'Bukan siapa paling cepat, tapi siapa paling konsisten.',
    'Hari ini cukup 1 langkah kecil.',
  ];

  const tagsCommon = ['#aivideo', '#sora', '#contentcreator', '#idekonten', '#fyp', '#reels'];
  const tagsHorror = ['#horor', '#mistis', '#creepy', '#horrorindonesia'];
  const tagsFunny = ['#lucu', '#komedi', '#ngakak', '#relatable'];
  const tagsUGC = ['#ugc', '#review', '#softselling', '#creator'];
  const tagsFitness = ['#hidupsehat', '#fitness', '#gym', '#konsisten'];

  const location = pick(rng, places);

  // Build title + hook + 1 scene + final prompt
  let title = '';
  let hook = '';
  let scene = '';
  let finalPrompt = '';
  let caption = pick(rng, captions);

  if (preset === 'sweepy') {
    const baseAction = pick(rng, sweepyDaily);

    if (niche === 'horror') {
      title = 'Sweepy: Horor Tipis, Ending Aman';
      hook = '“Eh… barusan itu apa?” (tapi jangan lebay)';
      scene = `@mockey.mo (Sweepy) di ${location}, sedang ${baseAction}. Ada momen horor ringan: ${pick(
        rng,
        sweepyHorrorLight
      )}. Tetap aman, natural, lalu ending lucu tipis (Sweepy lega/nyengir kecil).`;
    } else if (niche === 'funny') {
      title = 'Sweepy: Daily Komedi Natural';
      hook = '“Gue cuma mau santai… kok jadi gini?”';
      scene = `@mockey.mo (Sweepy) di ${location}, ${baseAction}. Twist lucu: ${pick(
        rng,
        sweepyFunnyTwist
      )}. Ekspresi jelas, timing pas, realistis.`;
    } else if (niche === 'ugc') {
      title = 'Sweepy: UGC Vibe (Lucu & Santai)';
      hook = '“POV: kamu jadi Sweepy sehari…”';
      scene = `@mockey.mo (Sweepy) bikin vlog UGC di ${location}. ${baseAction}. Gaya handheld, natural lighting, vibe autentik.`;
    } else if (niche === 'fitness') {
      title = 'Sweepy: Sehat Versi Santai';
      hook = '“Versi paling gampang dulu…”';
      scene = `@mockey.mo (Sweepy) di ${location}, melakukan habit sehat simpel: ${pick(
        rng,
        fitnessActions
      )}. Gaya lucu tipis tapi tetap realistis dan aman.`;
    } else {
      title = 'Sweepy: Daily Natural';
      hook = '“Ini kegiatan paling random tapi nyaman…”';
      scene = `@mockey.mo (Sweepy) di ${location}, ${baseAction}. Aktivitas sederhana tanpa konflik besar, vibe hangat seperti daily vlog.`;
    }

    const tags =
      niche === 'horror'
        ? [...tagsCommon, ...tagsHorror]
        : niche === 'funny'
          ? [...tagsCommon, ...tagsFunny]
          : niche === 'ugc'
            ? [...tagsCommon, ...tagsUGC]
            : niche === 'fitness'
              ? [...tagsCommon, ...tagsFitness]
              : [...tagsCommon, '#dailyvlog'];

    const hashtags = tags.slice(0, 12).join(' ');

    finalPrompt = [
      `Create a short video (single scene, 10–15 seconds).`,
      `Main character: @mockey.mo (Sweepy).`,
      `Scene: ${scene}`,
      `Style: cinematic but natural, stable subject, coherent motion, no sudden teleport, no text overlay.`,
      `Camera: medium shot with gentle handheld or slow push-in.`,
      `Lighting: soft natural or warm practical lighting (match the location).`,
      `Ending: clean finish, 1–2 seconds hold.`,
    ].join(' ');

    return {
      title,
      hook,
      scene,
      finalPrompt,
      caption,
      hashtags,
    };
  }

  // hanz26
  if (niche === 'ugc') {
    title = 'UGC Relatable: @hanz26';
    hook = pick(rng, hanzHooks);
    scene = `@hanz26 duduk santai gaya UGC di ${location}. Buka dengan hook: ${hook} Lanjut bahas: ${pick(
      rng,
      hanzTopicsUGC
    )}. Bahasa Indonesia, ekspresi natural, vibe relatable, handheld smartphone.`;
  } else if (niche === 'fitness') {
    title = 'Fitness Habit: @hanz26';
    hook = '“Gue bikin ini sesimpel mungkin…”';
    scene = `@hanz26 di ${location}, jelasin 1 habit sehat + demo singkat: ${pick(
      rng,
      fitnessActions
    )}. Bahasa Indonesia, natural, tidak berlebihan, fokus konsistensi.`;
  } else if (niche === 'funny') {
    title = 'Relatable Funny: @hanz26';
    hook = '“Gue kira mudah… ternyata…”';
    scene = `@hanz26 di ${location}, cerita singkat lucu-relatable tentang kebiasaan sehat/produktif yang sering gagal, lalu kasih 1 solusi kecil. Natural, ekspresi jelas.`;
  } else if (niche === 'horror') {
    title = 'Story Tipis Horor: @hanz26';
    hook = '“Gue ngalamin hal aneh semalem…”';
    scene = `@hanz26 di ${location}, cerita horor ringan (aman, tanpa gore) dengan ending lega/komedi tipis. Bahasa Indonesia, tone tegang tapi tetap kalem.`;
  } else {
    title = 'Daily Talk: @hanz26';
    hook = pick(rng, hanzHooks);
    scene = `@hanz26 di ${location}, ngobrol singkat soal 1 kebiasaan kecil yang bikin hidup lebih sehat. Bahasa Indonesia, natural, friendly, lighting bagus.`;
  }

  const tags =
    niche === 'horror'
      ? [...tagsCommon, ...tagsHorror]
      : niche === 'funny'
        ? [...tagsCommon, ...tagsFunny]
        : niche === 'ugc'
          ? [...tagsCommon, ...tagsUGC]
          : niche === 'fitness'
            ? [...tagsCommon, ...tagsFitness]
            : [...tagsCommon, '#daily'];

  const hashtags = tags.slice(0, 12).join(' ');

  finalPrompt = [
    `Create a short UGC-style video (single scene, 10–15 seconds).`,
    `Main character: @hanz26.`,
    `Scene: ${scene}`,
    `Style: handheld smartphone feel, natural skin tones, clean audio vibe (no need to include actual audio), no text overlay.`,
    `Camera: chest-up framing, slight handheld motion, eye contact with camera.`,
    `Lighting: soft natural light or warm indoor practical lighting.`,
    `Ending: simple closing line + small smile, 1 second hold.`,
  ].join(' ');

  return { title, hook, scene, finalPrompt, caption, hashtags };
}

const LS_KEY = 'sora_lite_daily_library_v1';

export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('sweepy');
  const [niche, setNiche] = useState<NicheKey>('daily');
  const [dateKey, setDateKey] = useState<string>(todayKey());
  const [output, setOutput] = useState<ReturnType<typeof buildDailyIdea> | null>(null);

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [library, setLibrary] = useState<SavedItem[]>([]);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setLibrary(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function persist(next: SavedItem[]) {
    setLibrary(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const canGenerate = true;

  const headerSub = useMemo(() => {
    return `${PRESET_LABEL[preset].emoji} ${PRESET_LABEL[preset].title} • ${NICHE_LABEL[niche].title} • ${dateKey}`;
  }, [preset, niche, dateKey]);

  function onGenerateToday() {
    setErr('');
    setCopied(false);
    setSaved(false);
    try {
      const idea = buildDailyIdea(dateKey, preset, niche);
      setOutput(idea);
    } catch (e: any) {
      setErr(e?.message || 'Gagal generate.');
    }
  }

  async function onCopyFinal() {
    if (!output?.finalPrompt) return;
    try {
      await navigator.clipboard.writeText(output.finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setErr('Clipboard tidak tersedia di browser ini.');
    }
  }

  function onSave() {
    if (!output) return;
    const item: SavedItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dateKey,
      preset,
      niche,
      title: output.title,
      hook: output.hook,
      scene: output.scene,
      finalPrompt: output.finalPrompt,
      caption: output.caption,
      hashtags: output.hashtags,
      createdAt: Date.now(),
    };
    const next = [item, ...library].slice(0, 200);
    persist(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function onDelete(id: string) {
    const next = library.filter((x) => x.id !== id);
    persist(next);
  }

  function onLoad(item: SavedItem) {
    setPreset(item.preset);
    setNiche(item.niche);
    setDateKey(item.dateKey);
    setOutput({
      title: item.title,
      hook: item.hook,
      scene: item.scene,
      finalPrompt: item.finalPrompt,
      caption: item.caption,
      hashtags: item.hashtags,
    });
    setCopied(false);
    setSaved(false);
    setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <p style={S.subtitle}>Daily Content Generator (no API)</p>
            </div>
          </div>

          <div style={S.badgeRow}>
            <span style={S.badge}>Mobile-first</span>
            <span style={S.badge}>1 scene</span>
            <span style={S.badge}>Copy prompt</span>
          </div>

          <div style={S.subLine}>{headerSub}</div>
        </header>

        {/* Controls */}
        <section style={S.card}>
          <div style={S.cardTitle}>Daily Settings</div>
          <div style={S.cardHint}>Pilih preset & niche. Klik Generate untuk ide harian yang konsisten.</div>

          <div style={S.grid2}>
            <div>
              <div style={S.label}>Preset</div>
              <div style={S.presetRow}>
                {(['sweepy', 'hanz26'] as PresetKey[]).map((k) => {
                  const active = preset === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPreset(k)}
                      style={{ ...S.presetBtn, ...(active ? S.presetBtnActive : null) }}
                    >
                      <div style={S.presetTop}>
                        <span style={S.presetEmoji}>{PRESET_LABEL[k].emoji}</span>
                        <span style={S.presetTitle}>{PRESET_LABEL[k].title}</span>
                      </div>
                      <div style={S.presetSub}>{PRESET_LABEL[k].sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={S.label}>Niche</div>
              <div style={S.nicheGrid}>
                {(['daily', 'ugc', 'funny', 'horror', 'fitness'] as NicheKey[]).map((k) => {
                  const active = niche === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setNiche(k)}
                      style={{ ...S.nicheBtn, ...(active ? S.nicheBtnActive : null) }}
                    >
                      <div style={{ fontWeight: 900 }}>{NICHE_LABEL[k].title}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{NICHE_LABEL[k].hint}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={S.label}>Tanggal (opsional)</div>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value || todayKey())}
                  style={S.input}
                />
                <div style={S.smallHint}>Kalau kamu ganti tanggal, idenya ikut berubah (buat simulasi).</div>
              </div>
            </div>
          </div>

          <div style={S.actionsRow}>
            <button
              type="button"
              onClick={onGenerateToday}
              style={{ ...S.primaryBtn, opacity: canGenerate ? 1 : 0.6 }}
              disabled={!canGenerate}
            >
              Generate Ide Hari Ini
            </button>

            <div style={S.rightMeta}>
              {err ? <div style={S.errorText}>{err}</div> : <div style={S.muted}>Tip: simpan yang bagus ke Library.</div>}
            </div>
          </div>
        </section>

        {/* Output */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Output</div>
              <div style={S.cardHint}>Copy bagian Final Prompt lalu paste ke Sora.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onCopyFinal} style={S.smallBtn} disabled={!output?.finalPrompt}>
                {copied ? 'Copied ✅' : 'Copy Final Prompt'}
              </button>
              <button type="button" onClick={onSave} style={S.smallBtn} disabled={!output}>
                {saved ? 'Saved ✅' : 'Save'}
              </button>
            </div>
          </div>

          {!output ? (
            <div style={S.emptyState}>Belum ada hasil. Klik “Generate Ide Hari Ini”.</div>
          ) : (
            <div style={S.outputGrid}>
              <div style={S.kv}>
                <div style={S.k}>Judul</div>
                <div style={S.v}>{output.title}</div>
              </div>
              <div style={S.kv}>
                <div style={S.k}>Hook</div>
                <div style={S.v}>{output.hook}</div>
              </div>
              <div style={S.kv}>
                <div style={S.k}>Scene (1)</div>
                <div style={S.v}>{output.scene}</div>
              </div>

              <div style={S.kv}>
                <div style={S.k}>Final Prompt</div>
                <pre style={S.pre}>{output.finalPrompt}</pre>
              </div>

              <div style={S.kv}>
                <div style={S.k}>Caption</div>
                <div style={S.v}>{output.caption}</div>
              </div>
              <div style={S.kv}>
                <div style={S.k}>Hashtags</div>
                <div style={S.v}>{output.hashtags}</div>
              </div>
            </div>
          )}
        </section>

        {/* Library */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Library</div>
              <div style={S.cardHint}>Disimpan di HP/browser kamu (LocalStorage). Klik item untuk load.</div>
            </div>
            <div style={S.countBadge}>{library.length} saved</div>
          </div>

          {library.length === 0 ? (
            <div style={S.emptyState}>Belum ada yang disimpan. Generate → Save.</div>
          ) : (
            <div style={S.list}>
              {library.slice(0, 25).map((item) => (
                <div key={item.id} style={S.listItem}>
                  <button type="button" style={S.listMain} onClick={() => onLoad(item)}>
                    <div style={S.listTitle}>
                      {PRESET_LABEL[item.preset].emoji} {item.title}
                    </div>
                    <div style={S.listMeta}>
                      {item.dateKey} • {NICHE_LABEL[item.niche].title} • {PRESET_LABEL[item.preset].sub}
                    </div>
                    <div style={S.listHook}>{item.hook}</div>
                  </button>

                  <button type="button" style={S.delBtn} onClick={() => onDelete(item.id)} title="Delete">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ height: 14 }} />
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
    maxWidth: 920,
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
  title: { margin: 0, fontSize: 34, letterSpacing: 1.2, lineHeight: 1.05, fontWeight: 900 },
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
  subLine: { marginTop: 10, fontSize: 12, opacity: 0.78 },

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

  cardHead: { display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 900, marginBottom: 4 },
  cardHint: { fontSize: 12, opacity: 0.72, lineHeight: 1.35, maxWidth: 620 },

  label: { fontSize: 12, opacity: 0.8, fontWeight: 900, marginBottom: 8 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr', gap: 14 },
  presetRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
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

  nicheGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  nicheBtn: {
    textAlign: 'left',
    padding: 10,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.25)',
    color: 'rgba(255,255,255,0.92)',
  },
  nicheBtnActive: {
    border: '1px solid rgba(106,169,255,0.45)',
    background: 'linear-gradient(90deg, rgba(106,169,255,0.18), rgba(76,245,219,0.10))',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.30)',
    color: 'rgba(255,255,255,0.92)',
    outline: 'none',
    fontSize: 14,
  },
  smallHint: { marginTop: 6, fontSize: 12, opacity: 0.7, lineHeight: 1.35 },

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
    cursor: 'pointer',
  },
  rightMeta: { flex: 1, minWidth: 200 },
  muted: { fontSize: 12, opacity: 0.75 },
  errorText: { fontSize: 12, color: 'rgba(255,120,120,0.95)', fontWeight: 900 },

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

  emptyState: { fontSize: 13, opacity: 0.65, padding: 10 },

  outputGrid: { display: 'grid', gap: 10 },
  kv: {
    background: 'rgba(0,0,0,0.30)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 12,
  },
  k: { fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 },
  v: { fontSize: 14, lineHeight: 1.55, opacity: 0.95 },
  pre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 12,
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.92)',
  },

  countBadge: {
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    opacity: 0.9,
    whiteSpace: 'nowrap',
  },

  list: { display: 'grid', gap: 10 },
  listItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'stretch',
    background: 'rgba(0,0,0,0.28)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  listMain: {
    flex: 1,
    textAlign: 'left',
    padding: 12,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  },
  listTitle: { fontWeight: 900, marginBottom: 4 },
  listMeta: { fontSize: 12, opacity: 0.72, marginBottom: 6 },
  listHook: { fontSize: 13, opacity: 0.9, lineHeight: 1.35 },
  delBtn: {
    width: 44,
    border: 'none',
    background: 'rgba(255,120,120,0.12)',
    color: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontWeight: 900,
  },
};

// Small responsive tweak
if (typeof window !== 'undefined') {
  // no-op (kept to avoid lint unused in some configs)
}
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type StyleKey =
  | 'cinematic'
  | 'horror'
  | 'funny'
  | 'ugc'
  | 'doc'
  | 'broll'
  | 'weird'
  | 'sweepy'
  | 'hanz';

type NicheKey = 'general' | 'health' | 'fitness' | 'skincare' | 'food' | 'review';

type TagKey = 'horror' | 'daily' | 'review' | 'lucu';

type HistoryItem = {
  id: string;
  ts: number;
  style: StyleKey;
  niche: NicheKey;
  tags: TagKey[];
  prompt: string;
  extra: string;
  finalPrompt: string;
  caption: string;
  hashtags: string[];
};

const STYLE_PRESETS: Record<StyleKey, { label: string; detail: string }> = {
  cinematic: {
    label: 'Cinematic',
    detail:
      'cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting, professional color grading',
  },
  horror: {
    label: 'Horror',
    detail:
      'cinematic horror, low-key lighting, eerie shadows, subtle camera shake, suspense pacing, cold color temperature, creepy ambience (NO gore, NO extreme)',
  },
  funny: {
    label: 'Lucu',
    detail:
      'playful comedy tone, lighthearted pacing, expressive motion, humorous beats, bright friendly lighting, quick punchy cuts',
  },
  ugc: {
    label: 'UGC',
    detail:
      'UGC smartphone look, natural lighting, handheld, casual authentic vibe, minimal color grading, realistic imperfections',
  },
  doc: {
    label: 'Doc',
    detail:
      'documentary style, observational camera, realistic lighting, steady handheld, natural sound vibe, informative framing',
  },
  broll: {
    label: 'B-roll (No Character)',
    detail:
      'beautiful b-roll, no character, product/environment focused, clean compositions, smooth camera moves, natural light, atmospheric',
  },
  weird: {
    label: 'Weird / Random',
    detail:
      'absurd surreal concept, unexpected props, odd but cinematic, playful visual twist, unique transitions, viral pacing',
  },
  sweepy: {
    label: 'Sweepy 🧹',
    detail:
      'cute quirky mascot character named Sweepy, playful cleanup hero vibe, expressive motion, fun camera angles, short viral pacing, realistic lighting',
  },
  hanz: {
    label: 'Hanz 👤',
    detail:
      'UGC presenter character Hanz, confident friendly tone, clear gestures, natural face expressions, camera to subject, engaging pacing',
  },
};

const NICHE_PRESETS: Record<NicheKey, { label: string; hint: string; hashtags: string[] }> = {
  general: {
    label: 'General',
    hint: 'tema umum, hiburan, viral, storytelling',
    hashtags: ['#konten', '#viral', '#fyp', '#idekonten', '#ai'],
  },
  health: {
    label: 'Health',
    hint: 'tips kesehatan, kebiasaan sehat, edukasi ringan',
    hashtags: ['#kesehatan', '#hidupsehat', '#tipssehat', '#wellness', '#aicontent'],
  },
  fitness: {
    label: 'Fitness',
    hint: 'gym, workout, pembentukan tubuh, motivasi',
    hashtags: ['#fitness', '#workout', '#gym', '#fitlife', '#healthylifestyle'],
  },
  skincare: {
    label: 'Skincare',
    hint: 'perawatan kulit, review skincare, rutinitas',
    hashtags: ['#skincare', '#glowup', '#rutinwajah', '#beauty', '#review'],
  },
  food: {
    label: 'Food',
    hint: 'makanan, minuman sehat, resep singkat',
    hashtags: ['#kuliner', '#makanansehat', '#foodie', '#resep', '#healthyfood'],
  },
  review: {
    label: 'Review',
    hint: 'review produk, before-after, pro-kontra, soft selling',
    hashtags: ['#review', '#rekomendasi', '#unboxing', '#productreview', '#fyp'],
  },
};

const TAGS: { key: TagKey; label: string }[] = [
  { key: 'horror', label: 'horror' },
  { key: 'daily', label: 'daily' },
  { key: 'review', label: 'review' },
  { key: 'lucu', label: 'lucu' },
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clampText(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function buildHashtags(niche: NicheKey, tags: TagKey[]): string[] {
  const base = NICHE_PRESETS[niche].hashtags;
  const extra: string[] = [];

  // map tags to a couple of hashtags
  for (const t of tags) {
    if (t === 'horror') extra.push('#horor');
    if (t === 'daily') extra.push('#dailycontent');
    if (t === 'review') extra.push('#reviewjujur');
    if (t === 'lucu') extra.push('#lucu');
  }

  // ensure unique & take 5
  const all = [...base, ...extra];
  const uniq = Array.from(new Set(all));
  return uniq.slice(0, 5);
}

function buildCaption(style: StyleKey, niche: NicheKey, tags: TagKey[], main: string, finalPrompt: string) {
  const tagLine = tags.length ? tags.map((t) => `#${t}`).join(' ') : '#daily';
  const nicheLabel = NICHE_PRESETS[niche].label;

  // Keep it simple and mobile friendly (2–3 lines)
  const topic =
    clampText(main).slice(0, 72) ||
    clampText(finalPrompt).slice(0, 72) ||
    'Ide konten cepat dan simpel';

  const styleLabel = STYLE_PRESETS[style].label;

  return `(${nicheLabel} • ${styleLabel}) ${topic}\n\n${tagLine} — mau versi lain?`;
}

function composePrompt(style: StyleKey, niche: NicheKey, main: string, extra: string) {
  const styleText = STYLE_PRESETS[style].detail;
  const nicheText = NICHE_PRESETS[niche].hint;

  const blocks: string[] = [];
  blocks.push(styleText);
  blocks.push(`niche: ${nicheText}`);

  if (main.trim()) blocks.push(`scene: ${clampText(main)}`);
  if (extra.trim()) blocks.push(`extra: ${clampText(extra)}`);

  // final assembly
  return blocks.join(', ');
}

// Random idea generator (safe / no extreme)
const RANDOM_IDEAS: { niche: NicheKey; main: string; extra?: string }[] = [
  { niche: 'health', main: '3 kebiasaan kecil yang bikin badan terasa lebih ringan setiap pagi', extra: 'UGC, 10–15 detik, overlay teks poin-poin' },
  { niche: 'fitness', main: 'workout 20 detik: 3 gerakan pemula tanpa alat di rumah', extra: 'kamera handheld, energik, jelas' },
  { niche: 'skincare', main: 'rutinitas malam singkat: bersih-bersih wajah + 1 produk utama, sebelum tidur', extra: 'close-up, soft lighting' },
  { niche: 'review', main: 'review jujur produk: 1 kelebihan, 1 kekurangan, siapa yang cocok', extra: 'soft selling, call-to-action halus' },
  { niche: 'food', main: 'minuman sehat 15 detik: campur 3 bahan sederhana, hasilnya segar', extra: 'b-roll bahan + teks' },
  { niche: 'general', main: 'konten viral: “yang orang sering salah paham” versi lucu dan cepat', extra: 'pacing cepat, punchline di akhir' },
];

const STORAGE_KEY = 'sora_lite_history_v3';

export default function Page() {
  const [style, setStyle] = useState<StyleKey>('cinematic');
  const [niche, setNiche] = useState<NicheKey>('general'); // ✅ NICHE SELALU BEBAS DIPILIH
  const [tags, setTags] = useState<TagKey[]>(['daily']);
  const [main, setMain] = useState('');
  const [extra, setExtra] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  }

  useEffect(() => {
    // load history
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // save history
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [history]);

  // ✅ IMPORTANT: Tidak ada useEffect yang mengubah niche berdasarkan style.
  // Jadi Sweepy/Hanz tidak akan pernah “mengunci” Niche.

  const finalPrompt = useMemo(() => composePrompt(style, niche, main, extra), [style, niche, main, extra]);

  const captionBlock = useMemo(() => {
    const cap = buildCaption(style, niche, tags, main, finalPrompt);
    const hash = buildHashtags(niche, tags).join(' ');
    return `${cap}\n\n${hash}`;
  }, [style, niche, tags, main, finalPrompt]);

  const activeStyleDetail = STYLE_PRESETS[style].detail;

  function toggleTag(t: TagKey) {
    setTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      return next.length ? next : (['daily'] as TagKey[]);
    });
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied ✅');
    } catch {
      showToast('Gagal copy (izin clipboard) ❌');
    }
  }

  function clearAll() {
    setMain('');
    setExtra('');
    setTags(['daily']);
    setStyle('cinematic');
    // ✅ niche tidak harus di-reset, tapi kita set ke general supaya konsisten
    setNiche('general');
    showToast('Reset done');
  }

  function autoGenerate() {
    const pick = RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];
    setMain(pick.main);
    setExtra(pick.extra ?? '');
    setNiche(pick.niche);
    showToast('Auto generated ✨');
  }

  function saveToHistory() {
    const item: HistoryItem = {
      id: uid(),
      ts: Date.now(),
      style,
      niche,
      tags,
      prompt: main,
      extra,
      finalPrompt,
      caption: captionBlock,
      hashtags: buildHashtags(niche, tags),
    };
    setHistory((prev) => [item, ...prev].slice(0, 50));
    showToast('Saved to history');
  }

  function applyHistory(item: HistoryItem) {
    setStyle(item.style);
    setNiche(item.niche);
    setTags(item.tags.length ? item.tags : (['daily'] as TagKey[]));
    setMain(item.prompt);
    setExtra(item.extra);
    showToast('Loaded');
  }

  function deleteHistory(id: string) {
    setHistory((prev) => prev.filter((x) => x.id !== id));
    showToast('Deleted');
  }

  const stylesRow: { key: StyleKey; pill: string }[] = [
    { key: 'cinematic', pill: 'Cinematic' },
    { key: 'horror', pill: 'Horror' },
    { key: 'funny', pill: 'Lucu' },
    { key: 'ugc', pill: 'UGC' },
    { key: 'doc', pill: 'Doc' },
    { key: 'broll', pill: 'B-roll (No Character)' },
    { key: 'weird', pill: 'Weird / Random' },
    { key: 'sweepy', pill: 'Sweepy 🧹' },
    { key: 'hanz', pill: 'Hanz 👤' },
  ];

  const nichesRow: { key: NicheKey; pill: string }[] = [
    { key: 'general', pill: 'General' },
    { key: 'health', pill: 'Health' },
    { key: 'fitness', pill: 'Fitness' },
    { key: 'skincare', pill: 'Skincare' },
    { key: 'food', pill: 'Food' },
    { key: 'review', pill: 'Review' },
  ];

  return (
    <main className="min-h-screen bg-[#0b0f16] text-white">
      {/* soft background */}
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-56 -left-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[720px] px-4 pb-20 pt-8">
        {/* Header */}
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">Sora Lite — Prompt Builder</h1>
          <p className="mt-2 text-sm text-white/70">
            Preset + Niche + Tag + Caption + 5 Hashtag + History (local).
          </p>
        </header>

        {/* Cards */}
        <section className="space-y-4">
          {/* Preset */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Preset Style</h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={autoGenerate}
                  className="rounded-2xl bg-emerald-400/90 px-3 py-2 text-sm font-semibold text-black shadow hover:bg-emerald-300 active:scale-[0.99]"
                >
                  Auto Generate
                </button>
                <button
                  onClick={clearAll}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
                >
                  Clear
                </button>
              </div>
            </div>

            <p className="mt-2 text-sm text-white/70">
              Pilih gaya visual. Kamu juga bisa pilih karakter (Sweepy / Hanz).{' '}
              <span className="font-semibold text-emerald-300">Niche tetap bisa dipilih kapan pun.</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {stylesRow.map((s) => {
                const active = style === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={[
                      'rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]',
                      active
                        ? 'bg-emerald-400 text-black shadow'
                        : 'border border-white/10 bg-white/5 text-white/90 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {s.pill}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm font-semibold text-white/80">Preset detail</div>
              <div className="mt-2 text-sm text-white/70">{activeStyleDetail}</div>
            </div>
          </div>

          {/* Niche */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-bold">Niche</h2>
            <p className="mt-2 text-sm text-white/70">Pilih niche konten. Ini tidak akan terkunci walau pilih Sweepy/Hanz.</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {nichesRow.map((n) => {
                const active = niche === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => setNiche(n.key)}
                    className={[
                      'rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]',
                      active
                        ? 'bg-sky-400 text-black shadow'
                        : 'border border-white/10 bg-white/5 text-white/90 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {n.pill}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-white/60">
              Hint: <span className="text-white/80">{NICHE_PRESETS[niche].hint}</span>
            </div>
          </div>

          {/* Tag */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-bold">Tag</h2>
            <p className="mt-2 text-sm text-white/70">Klik untuk aktif/nonaktif. Default: daily</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const active = tags.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTag(t.key)}
                    className={[
                      'rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]',
                      active
                        ? 'bg-emerald-400 text-black shadow'
                        : 'border border-white/10 bg-white/5 text-white/90 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-bold">Prompt Utama</h2>
            <p className="mt-2 text-sm text-white/70">Isi inti adegan / cerita.</p>

            <textarea
              value={main}
              onChange={(e) => setMain(e.target.value)}
              placeholder="Contoh: Karakter monyet hoodie lucu sedang membersihkan selokan penuh sampah plastik..."
              className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/60"
            />

            <h3 className="mt-4 text-lg font-bold">Extra (Opsional)</h3>
            <p className="mt-2 text-sm text-white/70">Camera, lighting, mood, narasi (no text), dll.</p>

            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Contoh: 10–15 detik, kamera dari belakang, slow push-in, NO watermark, NO text overlay..."
              className="mt-3 h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/60"
            />
          </div>

          {/* Output */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Output</h2>
              <button
                onClick={saveToHistory}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
              >
                Save
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs font-semibold text-white/60">Final Prompt</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{finalPrompt}</div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copyText(finalPrompt)}
                  className="flex-1 rounded-2xl bg-emerald-400/90 px-3 py-2 text-sm font-bold text-black hover:bg-emerald-300 active:scale-[0.99]"
                >
                  Copy Prompt
                </button>
                <button
                  onClick={() => copyText(captionBlock)}
                  className="flex-1 rounded-2xl bg-sky-400/90 px-3 py-2 text-sm font-bold text-black hover:bg-sky-300 active:scale-[0.99]"
                >
                  Copy Caption
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs font-semibold text-white/60">Caption + Hashtag</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{captionBlock}</div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">History</h2>
              <button
                onClick={() => {
                  setHistory([]);
                  showToast('History cleared');
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
              >
                Clear History
              </button>
            </div>

            {history.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">Belum ada.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.slice(0, 10).map((h) => (
                  <div key={h.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">
                          {STYLE_PRESETS[h.style].label} • {NICHE_PRESETS[h.niche].label}
                        </div>
                        <div className="mt-1 text-xs text-white/60">
                          {new Date(h.ts).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => applyHistory(h)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:scale-[0.99]"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteHistory(h.id)}
                          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:scale-[0.99]"
                        >
                          Del
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 line-clamp-3 text-sm text-white/75">{h.finalPrompt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-black/80 px-4 py-2 text-sm text-white shadow backdrop-blur">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
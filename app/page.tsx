'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type PresetKey = 'general' | 'hanz' | 'sweepy' | 'collab';
type NicheKey = 'daily' | 'lucu' | 'kesehatan' | 'ugc' | 'horror';

type HistoryItem = {
  id: string;
  ts: number;
  preset: PresetKey;
  niche: NicheKey;
  main: string;
  extra: string;
  finalPrompt: string;
  caption: string;
  hashtags: string[];
};

type SavedItem = {
  id: string;
  ts: number;
  name: string;
  data: HistoryItem;
};

const LS_HISTORY = 'sora_lite_history_v6';
const LS_SAVED = 'sora_lite_saved_v6';

const PRESET_LABEL: Record<PresetKey, string> = {
  general: 'General',
  hanz: 'Hanz 👤',
  sweepy: 'Sweepy 🐒',
  collab: '@hanz26 × Sweepy 🤝',
};

const NICHE_LABEL: Record<NicheKey, string> = {
  daily: 'Daily Life',
  lucu: 'Lucu',
  kesehatan: 'Kesehatan',
  ugc: 'UGC',
  horror: 'Horror',
};

// ====== Character / Preset definitions ======
const PRESET_TEXT: Record<PresetKey, string> = {
  general:
    'No specific character. Natural everyday scene, realistic details, clean composition, mobile-friendly framing.',

  hanz:
    'Character @hanz26: calm and relaxed personality, stylish and neat everyday outfit, tidy appearance, confident but soft expression, minimal gestures, natural posture, modern casual look, steady pacing, phone-friendly framing.',

  sweepy:
    'Sweepy is a LITTLE MONKEY (real monkey anatomy, animal-like behavior). Smart and curious, expressive but NON-human gestures. Moves like a monkey, NOT a human in costume. NO human hands, NO human face, no standing/walking like a person. Believable animal actions only.',

  collab:
    'Collaboration: @hanz26 (calm, stylish, neat) + Sweepy (little monkey, animal-only). Two characters appear together. Interaction is natural and safe: Hanz reacts calmly; Sweepy behaves like a monkey (curious, playful, clever). NO anthropomorphic monkey, NO human-like hands/face.',
};

// ====== Niche guide ======
const NICHE_TEXT: Record<NicheKey, string> = {
  daily:
    'Daily life content: relatable routine, simple premise, calm vibe, authentic and original.',
  lucu:
    'Comedy content: light funny beats, wholesome humor, quick reactions, punchline ending (safe).',
  kesehatan:
    'Health niche: practical lifestyle tips, friendly tone, avoid medical claims, no miracle cure. Simple habits, gentle reminders.',
  ugc:
    'UGC style: handheld phone feel, talk-to-camera, direct benefit, quick b-roll inserts, simple CTA, authentic.',
  horror:
    'Safe horror tone: suspense, eerie ambience, low-key lighting. NO extreme gore, non-graphic, safe twist ending.',
};

// ====== Auto ideas: now slightly tailored per preset ======
type Idea = { main: string; extra: string; presets?: PresetKey[] };

const IDEAS: Record<NicheKey, Idea[]> = {
  daily: [
    // Neutral
    {
      main: 'Rutinitas pagi yang rapi: rapihin outfit, cek barang bawaan, bikin kopi/teh, lalu siap berangkat. Fokus momen kecil yang estetik.',
      extra:
        'soft morning light, slow pans, clean background, subtle b-roll details, 10–15s, 9:16',
    },
    // Hanz
    {
      presets: ['hanz'],
      main: 'Outfit check: karakter tampil santai tapi modis, merapikan kerah/jaket, lalu jalan keluar rumah dengan vibe tenang dan rapi.',
      extra:
        'phone-friendly fashion b-roll, close-up fabric details, calm pacing, natural daylight, clean background',
    },
    // Sweepy
    {
      presets: ['sweepy'],
      main: 'Monyet kecil penasaran: Sweepy memeriksa sekitar rumah/halaman, mengendus benda kecil, lalu “menyusun” benda dengan cara monyet (animal-like).',
      extra:
        'real monkey movement, playful curiosity, close-up paws, natural outdoor light, no human gestures',
    },
    // Collab
    {
      presets: ['collab'],
      main: 'Kolab santai: @hanz26 duduk rapi minum kopi, Sweepy datang penasaran, mengambil benda kecil, @hanz26 menatap tenang lalu tersenyum.',
      extra:
        'calm lifestyle vibe, soft daylight, reaction shots, safe interaction, monkey stays animal-like',
    },
  ],
  lucu: [
    // Neutral
    {
      main: 'Karakter mencoba bikin konten serius, tapi selalu ada gangguan kecil yang absurd (benda jatuh, suara random, kipas angin). Ending: ketawa dan ulang take.',
      extra:
        'quick reaction cuts, comedic timing, punchline ending, wholesome, safe',
    },
    // Hanz
    {
      presets: ['hanz'],
      main: '@hanz26 mau tampil rapi, tapi detail kecil selalu bikin lucu (kerah balik, rambut tertiup, barang nyangkut). Reaksi tetap tenang tapi akhirnya ketawa.',
      extra:
        'subtle comedy, calm reactions, quick cutaways, phone camera vibe, safe humor',
    },
    // Sweepy
    {
      presets: ['sweepy'],
      main: 'Sweepy (monyet kecil) mencoba meniru rutinitas manusia dengan cara monyet: ambil sisir, lalu malah menyisir benda lain. Lucu tapi tetap animal-like.',
      extra:
        'real monkey behavior, playful confusion, comedic beats, no human hands/face, safe',
    },
    // Collab
    {
      presets: ['collab'],
      main: '@hanz26 lagi rekam konten tenang, Sweepy tiba-tiba muncul “nyolong” properti kecil. @hanz26 menahan ketawa, lalu memberi isyarat pelan—Sweepy kabur.',
      extra:
        'comedic timing, reaction shots, safe playful chase, monkey stays animal-like',
    },
  ],
  kesehatan: [
    // Neutral
    {
      main: 'Tips 3 kebiasaan sehat yang gampang: minum air, jalan 5–10 menit, tidur lebih cepat. Singkat, jelas, tanpa klaim berlebihan.',
      extra:
        'friendly tone, clean overlays, calm pacing, no medical claims, 10–15s',
    },
    // Hanz
    {
      presets: ['hanz'],
      main: '@hanz26 memberi reminder sehat versi santai: minum air + jalan sebentar setelah duduk lama. Bahasa ringan, vibe tenang.',
      extra:
        'talk-to-camera calm, minimal gestures, clean background, simple overlay text',
    },
    // Sweepy (still animal-like; health content as “habit reminder” with playful monkey actions)
    {
      presets: ['sweepy'],
      main: 'Sweepy membawa botol air kecil (prop) dan duduk sejenak “istirahat”, lalu bergerak aktif sebentar. Pesan: minum & gerak ringan.',
      extra:
        'animal-like movement, cute but realistic, simple overlays, safe, no medical claims',
    },
    // Collab
    {
      presets: ['collab'],
      main: '@hanz26 mengajak kebiasaan sehat ringan (minum air + jalan 5 menit). Sweepy muncul dan ikut bergerak kecil (tetap monyet).',
      extra:
        'friendly and calm, short b-roll, safe interaction, no medical claims',
    },
  ],
  ugc: [
    // Neutral
    {
      main: 'UGC review singkat: hook 2 detik, masalahnya apa, solusi singkat, 2 manfaat, CTA halus. Natural dan jujur.',
      extra:
        'handheld phone, talk-to-camera, quick b-roll inserts, authentic tone, 10–15s',
    },
    // Hanz (UGC style but calm & neat)
    {
      presets: ['hanz'],
      main: '@hanz26 UGC santai: “Ini yang aku suka / yang perlu kamu tahu” dalam 3 poin cepat. Tampil rapi, nada tenang.',
      extra:
        'phone camera, calm voice vibe, clean b-roll, close-up details, minimal hype',
    },
    // Sweepy (UGC without human talk; more “visual demo”)
    {
      presets: ['sweepy'],
      main: 'Sweepy mendemokan benda sederhana dengan cara monyet (misal membuka, mengetuk, menyusun). Fokus visual yang jelas, tanpa dialog manusia.',
      extra:
        'clear close-ups, animal-like actions, simple overlays, safe, no human-like gestures',
    },
    // Collab
    {
      presets: ['collab'],
      main: '@hanz26 menjelaskan 2 poin singkat, lalu Sweepy menunjukkan demo visual (tetap monyet). Ending: @hanz26 senyum dan CTA halus.',
      extra:
        'talk-to-camera + b-roll demo, safe interaction, clean framing, 9:16',
    },
  ],
  horror: [
    // Neutral
    {
      main: 'Ruangan sunyi, terdengar suara pelan dari arah pintu. Kamera pelan mendekat… twist ending: cuma angin/barang jatuh.',
      extra:
        'low-key lighting, eerie ambience, slow push-in, safe non-graphic reveal',
    },
    // Hanz (safe horror + calm reaction)
    {
      presets: ['hanz'],
      main: '@hanz26 di ruangan redup, mendengar suara kecil. Dia menoleh pelan, suspense naik… twist: cuma benda tergeser. Reaksi: tenang + lega.',
      extra:
        'cinematic suspense, soft grain, controlled camera shake, no gore, safe',
    },
    // Sweepy (safe horror with monkey curiosity)
    {
      presets: ['sweepy'],
      main: 'Sweepy melihat bayangan bergerak di dinding, mendekat dengan rasa penasaran (monyet). Twist: pantulan kipas/lampu. Sweepy kabur lucu.',
      extra:
        'eerie ambience but playful, safe twist, animal-like movement, no gore',
    },
    // Collab
    {
      presets: ['collab'],
      main: '@hanz26 menyalakan lampu kecil, Sweepy mendengar suara dan ikut mendekat (tetap monyet). Twist: hanya tirai tertiup angin. Ending: mereka lega.',
      extra:
        'safe suspense, low-key lighting, reaction shots, non-graphic, 10–15s',
    },
  ],
};

// ====== helpers ======
function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function pickFromPool(arr: Idea[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueTop5(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const tag = x.startsWith('#') ? x : `#${x}`;
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
    if (out.length >= 5) break;
  }
  return out.slice(0, 5);
}

function buildHashtags(preset: PresetKey, niche: NicheKey): string[] {
  const baseByNiche: Record<NicheKey, string[]> = {
    daily: ['#dailylife', '#relatable', '#aesthetic', '#creator', '#fyp'],
    lucu: ['#lucu', '#komedi', '#viral', '#funny', '#fyp'],
    kesehatan: ['#kesehatan', '#hidupsehat', '#wellness', '#tipssehat', '#healthy'],
    ugc: ['#ugc', '#review', '#contentcreator', '#rekomendasi', '#fyp'],
    horror: ['#horror', '#misteri', '#seram', '#cinematic', '#thriller'],
  };

  const presetTags: Record<PresetKey, string[]> = {
    general: ['#soralite'],
    hanz: ['#hanz26', '#style'],
    sweepy: ['#sweepy', '#monyet'],
    collab: ['#hanz26', '#sweepy'],
  };

  // Force base tags to be present
  const merged = ['#sora', '#aivideo', ...baseByNiche[niche], ...presetTags[preset]];
  return uniqueTop5(merged);
}

function buildCaption(preset: PresetKey, niche: NicheKey, main: string): string {
  const who =
    preset === 'hanz'
      ? '@hanz26'
      : preset === 'sweepy'
        ? 'Sweepy'
        : preset === 'collab'
          ? '@hanz26 × Sweepy'
          : 'General';

  const vibeByNiche: Record<NicheKey, string> = {
    daily: 'Daily life vibes ✨',
    lucu: 'Biar ketawa dikit 😄',
    kesehatan: 'Tips sehat simpel 🌿',
    ugc: 'Jujur, langsung ke intinya ✅',
    horror: 'Berani nonton sampai habis? 👀',
  };

  const styleByPreset: Record<PresetKey, string> = {
    general: 'Vibe natural dan simple.',
    hanz: 'Tenang, rapi, tetap modis.',
    sweepy: 'Monyet kecil yang pintar (animal-only).',
    collab: 'Kolab santai: manusia + monyet (aman & natural).',
  };

  const teaser = main.trim()
    ? main.trim().slice(0, 110) + (main.trim().length > 110 ? '…' : '')
    : 'Isi prompt utama dulu untuk hasil terbaik.';

  return `${vibeByNiche[niche]} (${who})\n${styleByPreset[preset]}\n${teaser}`;
}

function buildFinalPrompt(preset: PresetKey, niche: NicheKey, main: string, extra: string): string {
  // If empty scene, avoid generating a "fake complete" prompt
  const scene = main.trim();
  const blocks: string[] = [];

  blocks.push(`PRESET:\n${PRESET_TEXT[preset]}`);
  blocks.push(`NICHE:\n${NICHE_TEXT[niche]}`);

  blocks.push(`SCENE:\n${scene ? scene : '[EMPTY] (Write Prompt Utama first)'}`);

  if (extra.trim()) blocks.push(`EXTRA:\n${extra.trim()}`);

  blocks.push(
    `OUTPUT RULES:\n9:16 vertical, 10–15 seconds, realistic lighting, clean composition, clear subject, safe content, avoid extreme gore, avoid medical claims.`
  );

  // Important: Collab + Sweepy safety guard
  if (preset === 'sweepy' || preset === 'collab') {
    blocks.push(
      `ANATOMY GUARD:\nSweepy must remain a real monkey: animal anatomy, animal movement. NO human hands/face, NOT a person in a costume, NOT anthropomorphic.`
    );
  }

  return blocks.join('\n\n');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ====== UI styles (inline) ======
const ui = {
  page: {
    minHeight: '100vh',
    background: '#0b0f16',
    color: 'rgba(255,255,255,0.92)',
    padding: '18px 14px 86px',
    position: 'relative' as const,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  glow: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    background:
      'radial-gradient(700px 520px at 20% 10%, rgba(53,211,154,0.18), transparent 60%), radial-gradient(700px 520px at 80% 30%, rgba(90,120,255,0.14), transparent 60%), radial-gradient(900px 700px at 50% 100%, rgba(255,255,255,0.06), transparent 60%)',
    opacity: 0.95,
  },
  container: {
    maxWidth: 920,
    margin: '0 auto',
    display: 'grid',
    gap: 12,
    position: 'relative' as const,
  },
  header: { padding: '6px 6px 2px' },
  title: { margin: 0, fontSize: 28, fontWeight: 950, letterSpacing: 0.2 },
  subtitle: { margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.35 },
  card: {
    borderRadius: 22,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.06)',
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
    padding: 14,
    backdropFilter: 'blur(10px)',
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 950, margin: 0 },
  hint: { marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.60)', lineHeight: 1.35 },
  chips: { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginTop: 12 },
  chip: (active: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 900,
    border: active ? '1px solid rgba(53,211,154,0.45)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(53,211,154,0.18)' : 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  }),
  chipBlue: (active: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 900,
    border: active ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(56,189,248,0.20)' : 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  }),
  btnGhost: {
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  },
  btnSolid: (disabled?: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 950,
    border: '1px solid rgba(53,211,154,0.35)',
    background: disabled ? 'rgba(255,255,255,0.10)' : 'rgba(53,211,154,0.85)',
    color: disabled ? 'rgba(255,255,255,0.55)' : '#0b0f16',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  btnSoft: (disabled?: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 950,
    border: '1px solid rgba(255,255,255,0.12)',
    background: disabled ? 'rgba(255,255,255,0.06)' : 'rgba(53,211,154,0.20)',
    color: disabled ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.92)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  box: {
    marginTop: 12,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.24)',
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  textarea: {
    width: '100%',
    marginTop: 10,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.26)',
    color: 'rgba(255,255,255,0.92)',
    padding: 12,
    fontSize: 14,
    lineHeight: 1.45,
    outline: 'none',
    resize: 'vertical' as const,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.82)',
  },
  list: { display: 'grid', gap: 10, marginTop: 12 },
  listItem: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.22)',
    padding: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listLeft: { minWidth: 0 },
  listTitle: {
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    maxWidth: '62vw',
  },
  listMeta: { marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.60)' },
  listActions: { display: 'flex', gap: 8, flexShrink: 0 as const },
  tiny: {
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.90)',
    cursor: 'pointer',
  },
  tinySolid: {
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 950,
    border: '1px solid rgba(56,189,248,0.35)',
    background: 'rgba(56,189,248,0.85)',
    color: '#0b0f16',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed' as const,
    left: '50%',
    bottom: 18,
    transform: 'translateX(-50%)',
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.72)',
    color: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
    zIndex: 50,
  },
};

// ====== Page ======
export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('general');
  const [niche, setNiche] = useState<NicheKey>('daily');
  const [main, setMain] = useState('');
  const [extra, setExtra] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);

  const [toast, setToast] = useState<string>('');
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    setHistory(safeParse<HistoryItem[]>(localStorage.getItem(LS_HISTORY), []));
    setSaved(safeParse<SavedItem[]>(localStorage.getItem(LS_SAVED), []));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 60)));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED, JSON.stringify(saved.slice(0, 60)));
    } catch {}
  }, [saved]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1700);
  }

  const canUse = main.trim().length > 0;

  const finalPrompt = useMemo(() => {
    return buildFinalPrompt(preset, niche, main, extra);
  }, [preset, niche, main, extra]);

  const caption = useMemo(() => buildCaption(preset, niche, main), [preset, niche, main]);
  const hashtags = useMemo(() => buildHashtags(preset, niche), [preset, niche]);
  const captionBlock = useMemo(() => `${caption}\n\n${hashtags.join(' ')}`, [caption, hashtags]);

  function pushHistory() {
    const item: HistoryItem = {
      id: uid(),
      ts: Date.now(),
      preset,
      niche,
      main: main.trim(),
      extra: extra.trim(),
      finalPrompt,
      caption,
      hashtags,
    };
    setHistory((prev) => [item, ...prev].slice(0, 60));
  }

  async function onCopyPrompt() {
    if (!canUse) return;
    const ok = await copyToClipboard(finalPrompt);
    if (ok) {
      pushHistory();
      showToast('Prompt copied ✅');
    } else showToast('Copy gagal ❌');
  }

  async function onCopyCaption() {
    if (!canUse) return;
    const ok = await copyToClipboard(captionBlock);
    if (ok) {
      pushHistory();
      showToast('Caption copied ✅');
    } else showToast('Copy gagal ❌');
  }

  function onAutoGenerate() {
    // ✅ mengikuti niche & preset, tapi tidak mengubah pilihan user
    const all = IDEAS[niche] || [];
    const filtered = all.filter((x) => !x.presets || x.presets.includes(preset));
    const pool = filtered.length ? filtered : all;

    if (!pool.length) return;

    const idea = pickFromPool(pool);
    setMain(idea.main);
    setExtra(idea.extra);
    showToast('Auto generated ✨');
  }

  function onClearAll() {
    setPreset('general');
    setNiche('daily');
    setMain('');
    setExtra('');
    showToast('Cleared');
  }

  function onSavePrompt() {
    if (!canUse) {
      showToast('Isi Prompt Utama dulu');
      return;
    }
    const name = window.prompt('Nama saved prompt? (contoh: "@hanz26 Daily Life")');
    if (!name) return;

    const data: HistoryItem = {
      id: uid(),
      ts: Date.now(),
      preset,
      niche,
      main: main.trim(),
      extra: extra.trim(),
      finalPrompt,
      caption,
      hashtags,
    };

    const item: SavedItem = {
      id: uid(),
      ts: Date.now(),
      name,
      data,
    };

    setSaved((prev) => [item, ...prev].slice(0, 60));
    showToast('Saved ✅');
  }

  function loadData(data: HistoryItem) {
    setPreset(data.preset);
    setNiche(data.niche);
    setMain(data.main || '');
    setExtra(data.extra || '');
    showToast('Loaded');
  }

  function deleteHistory(id: string) {
    setHistory((prev) => prev.filter((x) => x.id !== id));
    showToast('Deleted');
  }

  function deleteSaved(id: string) {
    setSaved((prev) => prev.filter((x) => x.id !== id));
    showToast('Deleted');
  }

  function clearHistory() {
    setHistory([]);
    showToast('History cleared');
  }

  function clearSaved() {
    setSaved([]);
    showToast('Saved cleared');
  }

  const fmtTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <main style={ui.page}>
      <div style={ui.glow} aria-hidden="true" />

      <div style={ui.container}>
        <header style={ui.header}>
          <h1 style={ui.title}>Sora Lite — Prompt Builder</h1>
          <p style={ui.subtitle}>
            Preset karakter (termasuk kolab <b>@hanz26 × Sweepy</b>) + Niche + Prompt manual + Caption + 5 hashtag + History + Save.
          </p>
        </header>

        {/* PRESET */}
        <section style={ui.card}>
          <div style={ui.rowTop}>
            <div>
              <div style={ui.cardTitle}>Preset Karakter</div>
              <div style={ui.hint}>Pilih siapa yang tampil di video.</div>
            </div>
            <button style={ui.btnGhost} onClick={onClearAll} type="button">
              Clear
            </button>
          </div>

          <div style={ui.chips}>
            {(['general', 'hanz', 'sweepy', 'collab'] as PresetKey[]).map((k) => (
              <button key={k} style={ui.chip(preset === k)} onClick={() => setPreset(k)} type="button">
                {PRESET_LABEL[k]}
              </button>
            ))}
          </div>

          <div style={ui.box}>
            <b style={{ color: 'rgba(255,255,255,0.78)' }}>Preset detail</b>
            {'\n'}
            {PRESET_TEXT[preset]}
          </div>
        </section>

        {/* NICHE */}
        <section style={ui.card}>
          <div style={ui.rowTop}>
            <div>
              <div style={ui.cardTitle}>Niche</div>
              <div style={ui.hint}>Pilih tema konten. Auto Generate mengikuti niche ini (tidak mengubah preset/niche).</div>
            </div>

            {/* Auto Generate button (right top niche box) */}
            <button style={ui.btnSolid(false)} onClick={onAutoGenerate} type="button">
              Auto Generate
            </button>
          </div>

          <div style={ui.chips}>
            {(['daily', 'lucu', 'kesehatan', 'ugc', 'horror'] as NicheKey[]).map((k) => (
              <button key={k} style={ui.chipBlue(niche === k)} onClick={() => setNiche(k)} type="button">
                {NICHE_LABEL[k]}
              </button>
            ))}
          </div>

          <div style={ui.box}>
            <b style={{ color: 'rgba(255,255,255,0.78)' }}>Niche guide</b>
            {'\n'}
            {NICHE_TEXT[niche]}
            {'\n\n'}
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
              Catatan: Auto Generate akan pilih ide yang cocok dengan preset yang kamu pilih (Hanz/Sweepy/Collab).
            </span>
          </div>
        </section>

        {/* INPUTS */}
        <section style={ui.card}>
          <div style={ui.cardTitle}>Prompt Utama (Manual)</div>
          <div style={ui.hint}>Bisa isi manual, atau pakai Auto Generate lalu edit.</div>
          <textarea
            style={ui.textarea}
            rows={5}
            value={main}
            onChange={(e) => setMain(e.target.value)}
            placeholder='Contoh: "@hanz26 duduk rapi minum kopi, Sweepy datang penasaran dan ambil benda kecil lucu, Hanz menatap tenang lalu tersenyum..."'
          />
        </section>

        <section style={ui.card}>
          <div style={ui.cardTitle}>Extra (Opsional)</div>
          <div style={ui.hint}>Kamera, lighting, mood, lokasi, gerakan kamera, dll.</div>
          <textarea
            style={ui.textarea}
            rows={4}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Contoh: handheld phone feel, soft daylight, slow push-in, subtle b-roll inserts..."
          />
        </section>

        {/* OUTPUT */}
        <section style={ui.card}>
          <div style={ui.rowTop}>
            <div>
              <div style={ui.cardTitle}>Final Prompt</div>
              <div style={ui.hint}>Gabungan preset + niche + prompt manual + extra.</div>
            </div>
            <button style={ui.btnGhost} onClick={onSavePrompt} type="button" disabled={!canUse}>
              Save Prompt
            </button>
          </div>

          <div style={ui.box}>{finalPrompt}</div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button style={ui.btnSolid(!canUse)} onClick={onCopyPrompt} type="button" disabled={!canUse}>
              Copy Prompt
            </button>
            <button style={ui.btnSoft(!canUse)} onClick={onCopyCaption} type="button" disabled={!canUse}>
              Copy Caption + Hashtag
            </button>
          </div>

          {!canUse ? (
            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              Isi <b>Prompt Utama</b> dulu supaya Copy/Save aktif.
            </div>
          ) : null}
        </section>

        <section style={ui.card}>
          <div style={ui.cardTitle}>Caption + 5 Hashtags</div>
          <div style={ui.hint}>Copy sekali tap. Hashtag sekarang tampil rapi (tidak nempel).</div>

          <div style={ui.box}>{captionBlock}</div>

          {/* ✅ FIX: use flex + gap so hashtags never “stick” */}
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {hashtags.map((h) => (
              <span key={h} style={ui.pill}>
                {h}
              </span>
            ))}
          </div>
        </section>

        {/* SAVED */}
        <section style={ui.card}>
          <div style={ui.rowTop}>
            <div>
              <div style={ui.cardTitle}>Saved Prompts</div>
              <div style={ui.hint}>Disimpan manual lewat tombol “Save Prompt”.</div>
            </div>
            <button style={ui.btnGhost} onClick={clearSaved} type="button" disabled={!saved.length}>
              Clear Saved
            </button>
          </div>

          {!saved.length ? (
            <div style={ui.box}>Belum ada saved. Klik “Save Prompt” untuk menyimpan.</div>
          ) : (
            <div style={ui.list}>
              {saved.slice(0, 20).map((s) => (
                <div key={s.id} style={ui.listItem}>
                  <div style={ui.listLeft}>
                    <div style={ui.listTitle}>{s.name}</div>
                    <div style={ui.listMeta}>
                      {PRESET_LABEL[s.data.preset]} • {NICHE_LABEL[s.data.niche]} • {fmtTime(s.ts)}
                    </div>
                  </div>
                  <div style={ui.listActions}>
                    <button style={ui.tinySolid} onClick={() => loadData(s.data)} type="button">
                      Load
                    </button>
                    <button style={ui.tiny} onClick={() => deleteSaved(s.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section style={ui.card}>
          <div style={ui.rowTop}>
            <div>
              <div style={ui.cardTitle}>History</div>
              <div style={ui.hint}>Tersimpan otomatis saat kamu Copy Prompt/Caption.</div>
            </div>
            <button style={ui.btnGhost} onClick={clearHistory} type="button" disabled={!history.length}>
              Clear History
            </button>
          </div>

          {!history.length ? (
            <div style={ui.box}>Belum ada history. Coba klik Copy Prompt atau Copy Caption.</div>
          ) : (
            <div style={ui.list}>
              {history.slice(0, 25).map((h) => (
                <div key={h.id} style={ui.listItem}>
                  <div style={ui.listLeft}>
                    <div style={ui.listTitle}>
                      {(h.main || '(no main)').slice(0, 60)}
                      {(h.main || '').length > 60 ? '…' : ''}
                    </div>
                    <div style={ui.listMeta}>
                      {PRESET_LABEL[h.preset]} • {NICHE_LABEL[h.niche]} • {fmtTime(h.ts)}
                    </div>
                  </div>
                  <div style={ui.listActions}>
                    <button style={ui.tinySolid} onClick={() => loadData(h)} type="button">
                      Load
                    </button>
                    <button style={ui.tiny} onClick={() => deleteHistory(h.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)', padding: '8px 2px' }}>
          Tips: Pilih preset → pilih niche → Auto Generate (opsional) → edit manual → Copy / Save.
        </div>
      </div>

      {toast ? <div style={ui.toast}>{toast}</div> : null}
    </main>
  );
}
```0
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

const LS_HISTORY = 'sora_lite_history_v5';
const LS_SAVED = 'sora_lite_saved_v5';

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

// ====== Character / Preset definitions (sesuai request kamu) ======
const PRESET_TEXT: Record<PresetKey, string> = {
  general:
    'No specific character. Natural everyday scene, realistic details, clean composition, mobile-friendly framing.',

  hanz:
    'Character @hanz26: calm and relaxed personality, stylish and neat everyday outfit, tidy appearance, confident but soft expression, minimal gestures, natural posture, modern casual look, steady pacing, phone-friendly framing.',

  sweepy:
    'Sweepy is a LITTLE MONKEY (real monkey anatomy, animal-like behavior). Smart and curious, expressive but NON-human gestures. Moves like a monkey, NOT a human in costume. NO human hands, NO human face, no standing/walking like a person. Believable animal actions only.',

  collab:
    'Collaboration: @hanz26 (calm, stylish, neat) + Sweepy (little monkey, animal-only). Two characters appear together. Interaction is natural and safe: Hanz reacts/communicates calmly; Sweepy behaves like a monkey (curious, playful, clever). NO anthropomorphic monkey, NO human-like hands/face.',
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

// ====== Auto ideas (neutral: tidak menyebut nama karakter, biar preset yang menentukan) ======
const IDEAS: Record<NicheKey, Array<{ main: string; extra: string }>> = {
  daily: [
    {
      main: 'Karakter menjalani rutinitas pagi yang rapi: rapihin outfit, cek barang bawaan, bikin kopi/teh, lalu siap berangkat. Fokus momen kecil yang estetik.',
      extra:
        'soft morning light, slow pans, clean background, subtle b-roll details, 10–15s, 9:16',
    },
    {
      main: 'Karakter beresin meja kerja sebentar (satisfying), lalu duduk santai sambil melihat suasana luar. Vibe tenang dan relatable.',
      extra:
        'calm pacing, ambient sound vibe, close-up hands, smooth transitions, minimal text overlay',
    },
    {
      main: 'Karakter jalan santai sore hari, berhenti sebentar di tempat favorit (minimarket/cafe), lalu lanjut pulang. Natural daily life.',
      extra:
        'golden hour, gentle handheld, clean composition, realistic crowd blur, lifestyle vibe',
    },
  ],
  lucu: [
    {
      main: 'Karakter mencoba bikin konten serius, tapi selalu ada gangguan kecil yang absurd (benda jatuh, suara random, kipas angin). Ending: ketawa dan lanjut take ulang.',
      extra:
        'quick reaction cuts, comedic timing, punchline ending, wholesome, safe',
    },
    {
      main: 'Karakter pengen tampil rapi, tapi setiap kali sudah “perfect”, ada detail kecil yang mengacaukan lucu (kerah, rambut, barang nyangkut).',
      extra:
        'short viral pacing, funny cutaways, quick zooms, friendly humor',
    },
    {
      main: 'Karakter salah paham instruksi sederhana dan hasilnya kocak tapi aman. Ending: “oke, ulang lagi ya”.',
      extra:
        'playful tone, quick beats, safe and non-violent, minimal text overlay',
    },
  ],
  kesehatan: [
    {
      main: 'Tips 3 kebiasaan sehat yang gampang dilakukan setiap hari: minum air, jalan 5–10 menit, tidur lebih cepat. Singkat, jelas, tanpa klaim berlebihan.',
      extra:
        'friendly educator vibe, clean overlays, calm pacing, safe disclaimers (no medical claims)',
    },
    {
      main: 'Stretching singkat sebelum aktivitas: 3 gerakan mudah dan aman. Fokus pada sudut kamera yang jelas.',
      extra:
        'clear angle, simple background, slow and safe, stop if pain disclaimer',
    },
    {
      main: 'Snack sehat sederhana (buah/yogurt) dengan visual estetik. Fokus tekstur dan plating simpel.',
      extra:
        'soft kitchen light, close-up details, gentle b-roll, calm and clean',
    },
  ],
  ugc: [
    {
      main: 'UGC review singkat: hook 2 detik, masalahnya apa, solusi singkat, 2 manfaat, CTA halus. Natural dan jujur.',
      extra:
        'handheld phone, talk-to-camera, quick b-roll inserts, authentic tone, 10–15s',
    },
    {
      main: '“Daily recommendation”: 1 hal kecil yang bikin hidup lebih gampang hari ini. Dibawakan santai dan relatable.',
      extra:
        'casual framing, natural light, simple subtitle style, friendly CTA',
    },
    {
      main: 'Perbandingan “sebelum vs sesudah” secara singkat, tetap realistis dan tidak klaim berlebihan.',
      extra:
        'fast cuts, honest vibe, avoid exaggerated promises, clear framing',
    },
  ],
  horror: [
    {
      main: 'Ruangan sunyi, terdengar suara pelan dari arah pintu. Kamera pelan mendekat… twist ending: cuma barang jatuh/angin.',
      extra:
        'low-key lighting, eerie ambience, slow push-in, safe non-graphic reveal',
    },
    {
      main: 'Bayangan bergerak di dinding. Suspense naik… ternyata hanya pantulan lampu/kipas.',
      extra:
        'cinematic suspense, subtle camera shake, safe twist, no gore',
    },
    {
      main: 'Karakter menatap layar TV gelap, silhouette seolah mendekat… ternyata orang lewat di luar jendela.',
      extra:
        'moody lighting, creepy ambience, safe and non-graphic, relief ending',
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

function uniqueTop5(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const key = x.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(x.startsWith('#') ? x : `#${x}`);
    }
    if (out.length >= 5) break;
  }
  while (out.length < 5) out.push('#sora');
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

  const presetTag =
    preset === 'hanz'
      ? ['#hanz26', '#style']
      : preset === 'sweepy'
        ? ['#sweepy', '#monyet']
        : preset === 'collab'
          ? ['#hanz26', '#sweepy']
          : ['#general'];

  // 5 hashtag final
  return uniqueTop5(['#sora', '#aivideo', ...baseByNiche[niche], ...presetTag]);
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

  const teaser = main.trim()
    ? main.trim().slice(0, 110) + (main.trim().length > 110 ? '…' : '')
    : 'Ide konten singkat yang gampang ditonton.';

  return `${vibeByNiche[niche]} (${who})\n${teaser}`;
}

function buildFinalPrompt(preset: PresetKey, niche: NicheKey, main: string, extra: string): string {
  const blocks: string[] = [];
  blocks.push(`PRESET:\n${PRESET_TEXT[preset]}`);
  blocks.push(`NICHE:\n${NICHE_TEXT[niche]}`);
  blocks.push(`SCENE:\n${main.trim() || '(empty)'}`);
  if (extra.trim()) blocks.push(`EXTRA:\n${extra.trim()}`);

  blocks.push(
    `OUTPUT RULES:\n9:16 vertical, 10–15 seconds, realistic lighting, clean composition, clear subject, safe content, avoid extreme gore, avoid medical claims.`
  );

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

// ====== UI styles (inline) - biar aman meski CSS/tailwind beda-beda ======
const ui = {
  page: {
    minHeight: '100vh',
    background: '#0b0f16',
    color: 'rgba(255,255,255,0.92)',
    padding: '18px 14px 80px',
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
  title: { margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 0.2 },
  subtitle: { margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.68)' },
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
  cardTitle: { fontSize: 16, fontWeight: 900, margin: 0 },
  hint: { marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.60)', lineHeight: 1.35 },
  chips: { display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginTop: 12 },
  chip: (active: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 800,
    border: active ? '1px solid rgba(53,211,154,0.45)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(53,211,154,0.18)' : 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  }),
  chipBlue: (active: boolean) => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 800,
    border: active ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(56,189,248,0.20)' : 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  }),
  btn: (variant: 'primary' | 'ghost') => ({
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 900,
    border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(53,211,154,0.35)',
    background: variant === 'ghost' ? 'rgba(255,255,255,0.06)' : 'rgba(53,211,154,0.20)',
    color: 'rgba(255,255,255,0.92)',
    cursor: 'pointer',
  }),
  btnSolid: {
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 950,
    border: '1px solid rgba(53,211,154,0.35)',
    background: 'rgba(53,211,154,0.85)',
    color: '#0b0f16',
    cursor: 'pointer',
  },
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
    display: 'inline-block',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 800,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.80)',
    marginRight: 8,
    marginTop: 8,
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
      localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50)));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED, JSON.stringify(saved.slice(0, 50)));
    } catch {}
  }, [saved]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1700);
  }

  const finalPrompt = useMemo(() => {
    return buildFinalPrompt(preset, niche, main, extra);
  }, [preset, niche, main, extra]);

  const caption = useMemo(() => buildCaption(preset, niche, main), [preset, niche, main]);
  const hashtags = useMemo(() => buildHashtags(preset, niche), [preset, niche]);
  const captionBlock = useMemo(() => `${caption}\n\n${hashtags.join(' ')}`, [caption, hashtags]);

  function pushHistory() {
    // History disimpan saat copy (biar ringkas)
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
    setHistory((prev) => [item, ...prev].slice(0, 50));
  }

  async function onCopyPrompt() {
    const ok = await copyToClipboard(finalPrompt);
    if (ok) {
      pushHistory();
      showToast('Prompt copied ✅');
    } else showToast('Copy gagal ❌');
  }

  async function onCopyCaption() {
    const ok = await copyToClipboard(captionBlock);
    if (ok) {
      pushHistory();
      showToast('Caption copied ✅');
    } else showToast('Copy gagal ❌');
  }

  function onAutoGenerate() {
    // ✅ mengikuti niche & preset, tapi tidak mengubah pilihan user
    const idea = IDEAS[niche]?.length ? IDEAS[niche][Math.floor(Math.random() * IDEAS[niche].length)] : null;
    if (!idea) return;

    // Ide netral, preset yang “menghidupkan” karakter via preset text di final prompt.
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
    if (!main.trim()) {
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

    setSaved((prev) => [item, ...prev].slice(0, 50));
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
      return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
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
            <button style={ui.btn('ghost')} onClick={onClearAll} type="button">
              Clear
            </button>
          </div>

          <div style={ui.chips}>
            {(['general', 'hanz', 'sweepy', 'collab'] as PresetKey[]).map((k) => (
              <button
                key={k}
                style={ui.chip(preset === k)}
                onClick={() => setPreset(k)}
                type="button"
              >
                {PRESET_LABEL[k]}
              </button>
            ))}
          </div>

          <div style={ui.box}>
            <b style={{ color: 'rgba(255,255,255,0.75)' }}>Preset detail</b>
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

            {/* Auto Generate button: kanan atas box niche */}
            <button style={ui.btnSolid} onClick={onAutoGenerate} type="button">
              Auto Generate
            </button>
          </div>

          <div style={ui.chips}>
            {(['daily', 'lucu', 'kesehatan', 'ugc', 'horror'] as NicheKey[]).map((k) => (
              <button
                key={k}
                style={ui.chipBlue(niche === k)}
                onClick={() => setNiche(k)}
                type="button"
              >
                {NICHE_LABEL[k]}
              </button>
            ))}
          </div>

          <div style={ui.box}>
            <b style={{ color: 'rgba(255,255,255,0.75)' }}>Niche guide</b>
            {'\n'}
            {NICHE_TEXT[niche]}
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
            placeholder="Contoh: @hanz26 lagi jalan santai sore, Sweepy muncul tiba-tiba bawa benda kecil lucu, Hanz reaksi tenang..."
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
            <button style={ui.btn('ghost')} onClick={onSavePrompt} type="button">
              Save Prompt
            </button>
          </div>

          <div style={ui.box}>{finalPrompt}</div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button style={ui.btnSolid} onClick={onCopyPrompt} type="button">
              Copy Prompt
            </button>
            <button style={ui.btn('primary')} onClick={onCopyCaption} type="button">
              Copy Caption + Hashtag
            </button>
          </div>
        </section>

        <section style={ui.card}>
          <div style={ui.cardTitle}>Caption + 5 Hashtags</div>
          <div style={ui.hint}>Kamu bisa copy lalu edit gaya bahasa sesukamu.</div>

          <div style={ui.box}>{captionBlock}</div>

          <div style={{ marginTop: 10 }}>
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
            <button style={ui.btn('ghost')} onClick={clearSaved} type="button" disabled={!saved.length}>
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
            <button style={ui.btn('ghost')} onClick={clearHistory} type="button" disabled={!history.length}>
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
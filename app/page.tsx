'use client';

import React, { useEffect, useMemo, useState } from 'react';

type PresetKey = 'general' | 'sweepy' | 'hanz';
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
  name: string;
  ts: number;
  data: HistoryItem;
};

const LS_HISTORY_KEY = 'sora_lite_history_v4';
const LS_SAVED_KEY = 'sora_lite_saved_v4';

const PRESET_LABEL: Record<PresetKey, string> = {
  general: 'General',
  sweepy: 'Sweepy 🧹',
  hanz: 'Hanz 👤',
};

const NICHE_LABEL: Record<NicheKey, string> = {
  daily: 'Daily',
  lucu: 'Lucu',
  kesehatan: 'Kesehatan',
  ugc: 'UGC',
  horror: 'Horror',
};

const PRESET_TEXT: Record<PresetKey, string> = {
  general:
    'no specific character, natural everyday scene, realistic details, clean composition, mobile-friendly framing',
  sweepy:
    'cute quirky mascot character named Sweepy, expressive motion, playful cleanup hero vibe, fun camera angles, short viral pacing, friendly comedic beats',
  hanz:
    'UGC presenter character Hanz, confident friendly tone, clear gestures, natural face expressions, camera-to-subject, engaging pacing, casual streetwear vibe',
};

const NICHE_GUIDE: Record<NicheKey, string> = {
  daily: 'daily relatable moment, simple premise, easy to repost, conversational vibe, quick hook in first 2 seconds',
  lucu: 'comedic timing, light slapstick, unexpected twist, reaction moments, keep it family-friendly',
  kesehatan:
    'health & wellness niche, practical tips, positive tone, simple education, avoid medical claims, focus on habits and lifestyle',
  ugc: 'UGC style, handheld phone feel, direct-to-camera, authentic, minimal cinematic effects, product-friendly framing',
  horror:
    'cinematic horror vibe but safe, suspense build-up, eerie ambience, NO extreme gore, keep it playful or surprising if needed',
};

// Pool ide random per niche (Auto Generate akan TIDAK mengubah niche user)
const IDEAS: Array<{ niche: NicheKey; main: string; extra?: string }> = [
  // DAILY
  {
    niche: 'daily',
    main: 'Seorang karakter sedang siap-siap pergi, tapi tiap kali mau keluar selalu ada hal kecil yang bikin balik lagi (kunci, dompet, charger). Akhirnya sadar semua sudah di tangan.',
    extra: 'handheld phone feel, quick cuts, comedic beat at the end',
  },
  {
    niche: 'daily',
    main: 'Momen “sebelum vs sesudah” beres-beres kamar dalam 10 detik, dibuat timelapse yang satisfying.',
    extra: 'timelapse, satisfying cleanup, soft lighting',
  },

  // LUCU
  {
    niche: 'lucu',
    main: 'Sweepy/Hanz mencoba bikin konten serius, tapi selalu ada gangguan absurd kecil (kipas angin, kucing, suara tetangga) sampai akhirnya menyerah dan ketawa.',
    extra: 'reaction shots, punchline ending',
  },
  {
    niche: 'lucu',
    main: 'Karakter memberi tutorial singkat, tapi tiap langkah muncul “versi dramatis” yang lebay lalu kembali normal.',
    extra: 'split-second comedic cutaways, captions on screen',
  },

  // KESEHATAN
  {
    niche: 'kesehatan',
    main: 'Tips 3 kebiasaan sehat yang gampang: minum air, jalan 10 menit, tidur lebih cepat 30 menit. Ditampilkan dengan visual simpel dan jelas.',
    extra: 'clean overlays, friendly tone, calm pacing',
  },
  {
    niche: 'kesehatan',
    main: 'Konten “kesalahan kecil setelah makan berat” dan solusi ringan: jalan pelan 5–10 menit + minum air.',
    extra: 'UGC talk-to-camera + b-roll sederhana',
  },

  // UGC
  {
    niche: 'ugc',
    main: 'Review singkat: “yang aku suka / yang perlu kamu tahu” dengan 3 poin cepat. Fokus gesture tangan dan close-up detail.',
    extra: 'phone camera, natural light, product-friendly shots',
  },
  {
    niche: 'ugc',
    main: 'Hook: “kalau kamu baru mulai…, ini cara paling gampang”. Lalu tunjukkan step-by-step super singkat.',
    extra: 'quick subtitles, simple framing',
  },

  // HORROR (aman)
  {
    niche: 'horror',
    main: 'Suasana rumah malam hari, terdengar bunyi pelan dari arah dapur. Kamera pelan mendekat—ternyata cuma botol jatuh. Karakter menghela napas lalu ketawa.',
    extra: 'eerie ambience, low-key lighting, no gore',
  },
  {
    niche: 'horror',
    main: 'Karakter nonton film horor, bayangan di TV seperti mau keluar… tapi karakter “mengetok” kepala pakai remote, bayangan mundur lagi (komedi horor).',
    extra: 'cinematic horror + funny beat, safe, no gore',
  },
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clampList<T>(arr: T[], max: number) {
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

function buildFinalPrompt(preset: PresetKey, niche: NicheKey, main: string, extra: string) {
  const parts: string[] = [];
  parts.push(PRESET_TEXT[preset]);
  parts.push(NICHE_GUIDE[niche]);
  parts.push(main.trim());

  if (extra.trim()) parts.push(extra.trim());

  // “Sora-friendly” finishing touches
  parts.push(
    '10–15 seconds, strong opening hook, clear subject, clean background, readable composition, natural motion, avoid text-heavy scenes'
  );

  return parts.filter(Boolean).join(', ');
}

function buildCaption(preset: PresetKey, niche: NicheKey, main: string) {
  const base =
    niche === 'kesehatan'
      ? 'Tips simpel yang kepake banget 🌿'
      : niche === 'lucu'
        ? 'Biar hari kamu ketawa dikit 😄'
        : niche === 'horror'
          ? 'Berani nonton sampai habis? 👀'
          : niche === 'ugc'
            ? 'Jujur ini yang paling kepake ✅'
            : 'Momen sehari-hari yang relatable ✨';

  const who =
    preset === 'hanz' ? 'Bareng Hanz.' : preset === 'sweepy' ? 'Bareng Sweepy.' : '';

  // potong main biar jadi “teaser”
  const teaser = main.trim().length > 90 ? main.trim().slice(0, 90).trim() + '…' : main.trim();

  return `${base} ${who}\n${teaser}`;
}

function buildHashtags(preset: PresetKey, niche: NicheKey) {
  const core = ['#sora', '#ai', '#aivideo'];
  const byNiche: Record<NicheKey, string[]> = {
    daily: ['#dailycontent', '#relatable', '#fyp'],
    lucu: ['#lucu', '#komedi', '#viral'],
    kesehatan: ['#kesehatan', '#hidupsehat', '#wellness'],
    ugc: ['#ugc', '#review', '#contentcreator'],
    horror: ['#horror', '#misteri', '#seram'],
  };

  const byPreset =
    preset === 'hanz' ? ['#hanz'] : preset === 'sweepy' ? ['#sweepy'] : ['#broll'];

  const all = [...core, ...byNiche[niche], ...byPreset];

  // pastikan max 5 (sesuai request)
  return all.slice(0, 5);
}

export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('general');
  const [niche, setNiche] = useState<NicheKey>('daily');

  const [main, setMain] = useState('');
  const [extra, setExtra] = useState('');

  const [toast, setToast] = useState<string>('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);

  // Load localStorage
  useEffect(() => {
    try {
      const rawH = localStorage.getItem(LS_HISTORY_KEY);
      const rawS = localStorage.getItem(LS_SAVED_KEY);
      if (rawH) setHistory(JSON.parse(rawH));
      if (rawS) setSaved(JSON.parse(rawS));
    } catch {
      // ignore
    }
  }, []);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Save saved list
  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
  }, [saved]);

  // Toast auto hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const finalPrompt = useMemo(() => {
    if (!main.trim()) return '';
    return buildFinalPrompt(preset, niche, main, extra);
  }, [preset, niche, main, extra]);

  const caption = useMemo(() => {
    if (!main.trim()) return '';
    return buildCaption(preset, niche, main);
  }, [preset, niche, main]);

  const hashtags = useMemo(() => buildHashtags(preset, niche), [preset, niche]);

  const captionWithHashtags = useMemo(() => {
    if (!caption) return '';
    return `${caption}\n\n${hashtags.join(' ')}`;
  }, [caption, hashtags]);

  function pushHistory() {
    if (!finalPrompt.trim()) return;

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

    setHistory((prev) => clampList([item, ...prev], 30));
  }

  async function copyText(text: string, okMsg: string) {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast(okMsg);
    } catch {
      // fallback (old browser)
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToast(okMsg);
    }
  }

  function clearAll() {
    setPreset('general');
    setNiche('daily');
    setMain('');
    setExtra('');
    setToast('Cleared');
  }

  function autoGenerate() {
    // ✅ niche tidak berubah — hanya pilih ide yang sesuai niche saat ini
    const pool = IDEAS.filter((x) => x.niche === niche);
    const usePool = pool.length ? pool : IDEAS;
    const pick = usePool[Math.floor(Math.random() * usePool.length)];

    setMain(pick.main);
    setExtra(pick.extra ?? '');
    setToast('Auto generated ✨');
  }

  function saveCurrent() {
    if (!finalPrompt.trim()) {
      setToast('Isi prompt utama dulu');
      return;
    }

    const name = window.prompt('Nama preset/saved prompt (contoh: "Hanz - Tips Sehat")');
    if (!name) return;

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

    const savedItem: SavedItem = { id: uid(), name, ts: Date.now(), data: item };
    setSaved((prev) => clampList([savedItem, ...prev], 30));
    setToast('Saved ✅');
  }

  function loadItem(it: HistoryItem) {
    setPreset(it.preset);
    setNiche(it.niche);
    setMain(it.main);
    setExtra(it.extra);
    setToast('Loaded');
  }

  function deleteHistory(id: string) {
    setHistory((prev) => prev.filter((x) => x.id !== id));
    setToast('Deleted');
  }

  function deleteSaved(id: string) {
    setSaved((prev) => prev.filter((x) => x.id !== id));
    setToast('Deleted');
  }

  function clearHistory() {
    setHistory([]);
    setToast('History cleared');
  }

  function clearSaved() {
    setSaved([]);
    setToast('Saved cleared');
  }

  // setiap kali user copy prompt/caption → simpan ke history otomatis (biar kerasa “kepake”)
  function onCopyPrompt() {
    if (!finalPrompt.trim()) return;
    pushHistory();
    copyText(finalPrompt, 'Prompt copied ✅');
  }

  function onCopyCaption() {
    if (!captionWithHashtags.trim()) return;
    pushHistory();
    copyText(captionWithHashtags, 'Caption copied ✅');
  }

  return (
    <main className="page">
      {/* glow bg */}
      <div className="bgGlow" aria-hidden="true" />

      <div className="container">
        <header className="header">
          <h1 className="title">Sora Lite — Prompt Builder</h1>
          <p className="subtitle">Preset + Niche + Caption + 5 Hashtag + History + Save (local).</p>
        </header>

        {/* PRESET (TOP) */}
        <section className="card">
          <div className="cardTop">
            <div>
              <div className="cardTitle">Preset Karakter</div>
              <div className="cardHint">Pilih karakter di atas. Niche dipilih di bawah.</div>
            </div>
            <button className="btn ghost" onClick={clearAll} type="button">
              Clear
            </button>
          </div>

          <div className="chipRow">
            {(['general', 'sweepy', 'hanz'] as PresetKey[]).map((k) => (
              <button
                key={k}
                className={`chip ${preset === k ? 'active' : ''}`}
                onClick={() => setPreset(k)}
                type="button"
              >
                {PRESET_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="miniBox">
            <div className="miniLabel">Preset detail</div>
            <div className="miniText">{PRESET_TEXT[preset]}</div>
          </div>
        </section>

        {/* NICHE (UNDER PRESET) with Auto Generate on top-right */}
        <section className="card">
          <div className="cardTop">
            <div>
              <div className="cardTitle">Niche</div>
              <div className="cardHint">Auto Generate akan mengikuti niche yang kamu pilih (tidak loncat).</div>
            </div>

            {/* Auto Generate: kanan atas BOX niche */}
            <button className="btn" onClick={autoGenerate} type="button">
              Auto Generate
            </button>
          </div>

          <div className="chipRow">
            {(['daily', 'lucu', 'kesehatan', 'ugc', 'horror'] as NicheKey[]).map((k) => (
              <button
                key={k}
                className={`chip ${niche === k ? 'active' : ''}`}
                onClick={() => setNiche(k)}
                type="button"
              >
                {NICHE_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="miniBox">
            <div className="miniLabel">Niche hint</div>
            <div className="miniText">{NICHE_GUIDE[niche]}</div>
          </div>
        </section>

        {/* INPUTS */}
        <section className="card">
          <div className="cardTitle">Prompt Utama</div>
          <div className="cardHint">Isi inti adegan/cerita. Ini yang paling penting.</div>
          <textarea
            className="textarea"
            value={main}
            onChange={(e) => setMain(e.target.value)}
            placeholder="Contoh: Sweepy sedang membersihkan selokan penuh sampah plastik, lalu menemukan anak kucing dan menolongnya..."
            rows={5}
          />
        </section>

        <section className="card">
          <div className="cardTitle">Extra (Opsional)</div>
          <div className="cardHint">Camera, lighting, mood, lokasi, gerakan kamera, dll.</div>
          <textarea
            className="textarea"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Contoh: handheld phone camera, soft daylight, close-up reaction, quick cut transitions..."
            rows={3}
          />
        </section>

        {/* OUTPUT */}
        <section className="card">
          <div className="cardTop">
            <div>
              <div className="cardTitle">Final Prompt</div>
              <div className="cardHint">Gabungan preset + niche + prompt utama + extra.</div>
            </div>
            <button className="btn ghost" onClick={saveCurrent} type="button">
              Save Prompt
            </button>
          </div>

          <div className="outputBox">{finalPrompt || 'Isi Prompt Utama dulu…'}</div>

          <div className="btnRow">
            <button className="btn wide" onClick={onCopyPrompt} type="button" disabled={!finalPrompt.trim()}>
              Copy Prompt
            </button>
          </div>
        </section>

        <section className="card">
          <div className="cardTitle">Caption + Hashtags</div>
          <div className="cardHint">Auto caption + 5 hashtag (copy sekali tap).</div>

          <div className="outputBox">{captionWithHashtags || 'Isi Prompt Utama dulu…'}</div>

          <div className="btnRow">
            <button className="btn wide" onClick={onCopyCaption} type="button" disabled={!captionWithHashtags.trim()}>
              Copy Caption
            </button>
          </div>
        </section>

        {/* SAVED */}
        <section className="card">
          <div className="cardTop">
            <div>
              <div className="cardTitle">Saved Prompts</div>
              <div className="cardHint">Yang kamu simpan manual (local).</div>
            </div>
            <button className="btn ghost" onClick={clearSaved} type="button" disabled={!saved.length}>
              Clear Saved
            </button>
          </div>

          {saved.length === 0 ? (
            <div className="empty">Belum ada saved. Tekan “Save Prompt” untuk menyimpan.</div>
          ) : (
            <div className="list">
              {saved.map((s) => (
                <div key={s.id} className="listItem">
                  <div className="listLeft">
                    <div className="listTitle">{s.name}</div>
                    <div className="listMeta">
                      {PRESET_LABEL[s.data.preset]} • {NICHE_LABEL[s.data.niche]}
                    </div>
                  </div>
                  <div className="listActions">
                    <button className="btn tiny" onClick={() => loadItem(s.data)} type="button">
                      Load
                    </button>
                    <button className="btn tiny ghost" onClick={() => deleteSaved(s.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HISTORY */}
        <section className="card">
          <div className="cardTop">
            <div>
              <div className="cardTitle">History</div>
              <div className="cardHint">Terisi otomatis saat kamu Copy Prompt/Caption. (Max 30)</div>
            </div>
            <button className="btn ghost" onClick={clearHistory} type="button" disabled={!history.length}>
              Clear History
            </button>
          </div>

          {history.length === 0 ? (
            <div className="empty">Belum ada history. Coba Copy Prompt atau Copy Caption.</div>
          ) : (
            <div className="list">
              {history.map((h) => (
                <div key={h.id} className="listItem">
                  <div className="listLeft">
                    <div className="listTitle">{h.main.length > 60 ? h.main.slice(0, 60) + '…' : h.main}</div>
                    <div className="listMeta">
                      {PRESET_LABEL[h.preset]} • {NICHE_LABEL[h.niche]}
                    </div>
                  </div>
                  <div className="listActions">
                    <button className="btn tiny" onClick={() => loadItem(h)} type="button">
                      Load
                    </button>
                    <button className="btn tiny ghost" onClick={() => deleteHistory(h.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          <div className="footerNote">Tips: pilih Preset → pilih Niche → isi Prompt Utama → Copy.</div>
        </footer>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
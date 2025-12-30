'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type PresetKey = 'sweepy' | 'hanz26' | 'general';
type TagKey = 'daily' | 'horror' | 'review' | 'lucu';

type HistoryItem = {
  id: string;
  createdAt: number;
  preset: PresetKey;
  prompt: string;
  finalPrompt?: string;
  caption?: string;
  tags: TagKey[];
};

const STORAGE_KEY = 'soraLite.history.v3.tags_caption';
const MAX_HISTORY = 40;

const TAGS: { key: TagKey; label: string }[] = [
  { key: 'daily', label: 'daily' },
  { key: 'horror', label: 'horror' },
  { key: 'review', label: 'review' },
  { key: 'lucu', label: 'lucu' },
];

export default function Page() {
  const [preset, setPreset] = useState<PresetKey>('sweepy');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [copiedFinal, setCopiedFinal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<TagKey[]>(['daily']);
  const [filterTag, setFilterTag] = useState<TagKey | 'all'>('all');

  const finalRef = useRef<HTMLDivElement | null>(null);

  const presetLabel: Record<PresetKey, { title: string; sub: string; emoji: string }> = {
    sweepy: { title: 'Sweepy', sub: '@mockey.mo', emoji: '🐵' },
    hanz26: { title: 'Hanz', sub: '@hanz26 (AI)', emoji: '🧑' },
    general: { title: 'General', sub: 'Random Character', emoji: '🎲' },
  };

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

  /* =======================
     localStorage load/save
     ======================= */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // ignore
    }
  }, [history]);

  function addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>) {
    const entry: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      ...item,
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }

  function removeFromHistory(id: string) {
    setHistory((prev) => prev.filter((x) => x.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  function toggleTag(list: TagKey[], t: TagKey) {
    return list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
  }

  function formatDate(ms: number) {
    try {
      return new Date(ms).toLocaleString();
    } catch {
      return String(ms);
    }
  }

  /* =======================
     Caption + hashtags
     ======================= */

  function getPrimaryTag(tags: TagKey[]): TagKey {
    // urutan prioritas
    const order: TagKey[] = ['review', 'horror', 'lucu', 'daily'];
    for (const t of order) if (tags.includes(t)) return t;
    return 'daily';
  }

  function buildHashtags(preset: PresetKey, tags: TagKey[]) {
    const t = getPrimaryTag(tags);

    const base = ['#soralite', '#aicontent', '#aivideo'];
    const presetTags =
      preset === 'sweepy'
        ? ['#mockeymo', '#sweepy']
        : preset === 'hanz26'
          ? ['#hanz26', '#ugc']
          : ['#randomcharacter', '#creativeai'];

    const mood =
      t === 'review'
        ? ['#review', '#softselling']
        : t === 'horror'
          ? ['#horor', '#creepy']
          : t === 'lucu'
            ? ['#lucu', '#komedi']
            : ['#daily', '#vlog'];

    // Ambil 5 saja, unik
    const all = [...base, ...presetTags, ...mood];
    const uniq: string[] = [];
    for (const x of all) {
      if (!uniq.includes(x)) uniq.push(x);
      if (uniq.length >= 5) break;
    }
    return uniq;
  }

  function buildCaption(preset: PresetKey, tags: TagKey[], idea: string, finalP: string) {
    const t = getPrimaryTag(tags);

    // Judul singkat (1 baris)
    const titlesByTag: Record<TagKey, string[]> = {
      daily: ['Daily vibe yang simpel tapi enak ditonton', 'Momen kecil, feel besar', 'Konten harian yang relatable'],
      horror: ['Horor tipis tapi bikin merinding', 'Ada yang “hampir” kejadian…', 'Tegang sebentar, aman kok'],
      review: ['Review singkat, no hard sell', 'Yang penting: jujur & jelas', 'Soft selling yang nggak ganggu'],
      lucu: ['Kocak natural, bukan lebay', 'Reaksi kecil tapi ngakak', 'Komedi tipis yang pas'],
    };

    const tone =
      preset === 'hanz26'
        ? 'Santai, rapi, trendi.'
        : preset === 'sweepy'
          ? 'Lucu, natural, ekspresif.'
          : 'Unik, random, tetap jelas.';

    // CTA ringan
    const ctaByTag: Record<TagKey, string[]> = {
      daily: ['Kalau suka konten daily begini, lanjut Part 2?', 'Team daily vlog atau team cinematic?'],
      horror: ['Berani lanjut versi lebih tegang?', 'Mau Part 2 yang lebih creepy tapi tetap aman?'],
      review: ['Kalau kamu mau aku review versi lain, komen ya.', 'Mau aku bikin versi 2 dengan angle berbeda?'],
      lucu: ['Tag temen yang bakal ketawa.', 'Kalau kamu relate, drop emoji 😂'],
    };

    // 1 kalimat ringkas tentang ide (diambil dari idea/prompt user)
    const gist = (idea || finalP || '').trim().slice(0, 140);

    const title = pick(titlesByTag[t]);
    const cta = pick(ctaByTag[t]);

    return `${title}\n${tone}\n\n${gist}${gist.length >= 140 ? '…' : ''}\n\n${cta}`;
  }

  const autoCaption = useMemo(() => {
    if (!prompt.trim() && !finalPrompt) return '';
    const tags = activeTags.length ? activeTags : ['daily'];
    const cap = buildCaption(preset, tags, prompt.trim(), finalPrompt);
    const hash = buildHashtags(preset, tags).join(' ');
    return `${cap}\n\n${hash}`;
  }, [preset, activeTags, prompt, finalPrompt]);

  /* =======================
     Auto idea generators
     ======================= */

  function makeSweepyIdea() {
    const places = ['teras rumah sore hari', 'ruang tamu dengan TV tua', 'dapur sederhana malam hari', 'halaman kecil belakang rumah'];
    const actions = ['duduk santai sambil ngopi', 'nonton TV sambil ngemil', 'menyapu halaman dengan ekspresi malas tapi lucu', 'membereskan meja kecil terlalu serius'];
    const twistsDaily = ['ngopi sambil denger musik pelan', 'rapihin barang kecil biar rapi', 'cek HP lalu senyum tipis', 'jalan santai sebentar'];
    const twistsHorror = ['TV jadi statis sebentar lalu normal', 'pintu berderit, ternyata angin', 'bayangan pantulan bikin kaget tipis', 'suara kecil bikin salah fokus (aman)'];
    const twistsFunny = ['gelas hampir jatuh lalu diselamatkan panik', 'sadar kamera lalu sok cool', 'salah pencet remote jadi mute lalu bengong', 'kaget notifikasi lalu pura-pura tidak terjadi apa-apa'];

    const wantsHorror = activeTags.includes('horror');
    const wantsFunny = activeTags.includes('lucu');
    const wantsReview = activeTags.includes('review');

    if (wantsReview) {
      return `@mockey.mo (Sweepy) review singkat gaya lucu: pegang produk sederhana (misal botol minum / snack) dan jelaskan 1 kelebihan dengan ekspresi polos. ONE SCENE ONLY, natural, durasi 10–12 detik.`;
    }
    if (wantsHorror) {
      return `@mockey.mo (Sweepy) berada di ${pick(places)}. ${pick(actions)}. Horor ringan aman: ${pick(
        twistsHorror
      )}. Ending lucu tipis (Sweepy lega/nyengir). ONE SCENE ONLY, durasi 10–12 detik.`;
    }
    if (wantsFunny) {
      return `@mockey.mo (Sweepy) berada di ${pick(places)}. ${pick(actions)}. Twist lucu: ${pick(
        twistsFunny
      )}. ONE SCENE ONLY, ekspresi jelas, durasi 10–12 detik.`;
    }
    return `@mockey.mo (Sweepy) berada di ${pick(places)}. ${pick(pick([actions, twistsDaily]))}. Suasana hangat, natural. ONE SCENE ONLY, durasi 10–12 detik.`;
  }

  function makeHanzIdea() {
    const outfits = [
      'clean minimal outfit: kaos polos premium + celana rapi + sneakers putih',
      'smart casual: kemeja linen netral + chino',
      'jaket tipis modern warna earthy + celana rapi',
    ];
    const places = ['kamar rapi dengan cahaya jendela', 'kafe minimalis yang tenang', 'teras rumah sore hari'];

    const hooksDaily = [
      '“Gue dulu sering mager… tapi ini cara paling simpel yang bikin gue jalan.”',
      '“Kalau lagi drop, gue cuma fokus 1 hal ini.”',
      '“Bukan motivasi, tapi kebiasaan kecil yang bikin konsisten.”',
    ];

    const topicsDaily = [
      'tips singkat biar tetap konsisten hidup sehat',
      'rutinitas 1 menit yang bikin mood naik',
      'cara bikin sistem biar gak ngandelin niat',
      'pengingat progress kecil tapi konsisten',
    ];

    const topicsReview = [
      'soft review produk (tanpa nyebut brand): 1 manfaat + 1 cara pakai',
      'review singkat barang daily: kenyamanan + alasan rekomendasi',
      'soft selling halus: cocok buat siapa + kapan dipakai',
    ];

    const wantsHorror = activeTags.includes('horror');
    const wantsFunny = activeTags.includes('lucu');
    const wantsReview = activeTags.includes('review');

    if (wantsHorror) {
      return `@hanz26 tampil rapi dengan ${pick(outfits)} di ${pick(
        places
      )}. Nuansa misterius ringan (bukan jumpscare): ambience tenang, Hanz menoleh pelan lalu senyum tipis menutup. ONE SCENE ONLY, durasi 10–12 detik, tetap tenang.`;
    }
    if (wantsFunny) {
      return `@hanz26 tampil rapi dengan ${pick(outfits)} di ${pick(
        places
      )}. Komedi subtle: salah ucap kecil lalu ketawa tipis, tetap cool dan trendi. ONE SCENE ONLY, durasi 10–12 detik.`;
    }
    if (wantsReview) {
      return `@hanz26 tampil rapi dengan ${pick(outfits)} di ${pick(
        places
      )}. Gaya UGC tenang. Bahas: ${pick(
        topicsReview
      )}. Bahasa Indonesia, natural, tidak hard sell. ONE SCENE ONLY, durasi 10–12 detik.`;
    }
    return `@hanz26 tampil rapi dan trendi dengan ${pick(outfits)} di ${pick(
      places
    )}. Buka dengan hook: ${pick(hooksDaily)} Lalu bahas: ${pick(
      topicsDaily
    )}. Nada tenang, santai, percaya diri. ONE SCENE ONLY, durasi 10–12 detik.`;
  }

  function makeGeneralIdea() {
    const characters = [
      'seekor monyet realistis dengan ekspresi santai',
      'seekor monyet kartunis lucu',
      'seorang pria anonim tanpa identitas spesifik',
      'seorang wanita anonim dengan tampilan sederhana',
      'makhluk humanoid aneh tapi bersahabat',
      'karakter manusia semi-kartun',
      'makhluk absurd unik yang tidak nyata',
      'sosok misterius silhouette tanpa wajah jelas',
    ];
    const actions = ['duduk santai sambil minum kopi', 'mengamati sekitar dengan ekspresi penasaran', 'berjalan pelan lalu berhenti', 'melakukan aktivitas harian sederhana', 'bereaksi kecil terhadap suara atau gerakan'];
    const places = ['kafe minimalis', 'ruang indoor sederhana', 'gang kecil habis hujan', 'latar netral studio', 'ruangan dengan cahaya dramatis'];

    const vibe = activeTags.includes('horror')
      ? 'misterius ringan dan aman (tanpa jumpscare ekstrem)'
      : activeTags.includes('lucu')
        ? 'absurd lucu tapi tetap readable'
        : activeTags.includes('review')
          ? 'review singkat barang random (tanpa brand)'
          : 'daily natural';

    const reviewAdd = activeTags.includes('review')
      ? ' Pegang satu objek sederhana (misal botol minum / snack) dan tunjukkan 1 kelebihan dengan cara natural.'
      : '';

    return `GENERAL RANDOM. Vibe: ${vibe}. Character: ${pick(characters)}. Action: ${pick(actions)}.${reviewAdd} Location: ${pick(
      places
    )}. ONE SCENE ONLY, durasi 10–15 detik. No real person identity, no text overlay.`;
  }

  function makeAutoIdea() {
    if (preset === 'sweepy') return makeSweepyIdea();
    if (preset === 'hanz26') return makeHanzIdea();
    return makeGeneralIdea();
  }

  /* =======================
     API
     ======================= */

  async function generateWithText(text: string) {
    const p = text.trim();
    if (!p) {
      setErr('Prompt tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setErr('');
    setResult(null);
    setCopiedFinal(false);
    setCopiedJson(false);
    setCopiedCaption(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, preset, tags: activeTags }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request gagal');

      setResult(data);

      const fp = data?.output?.finalPrompt ? String(data.output.finalPrompt) : '';
      const cap = buildCaption(preset, activeTags.length ? activeTags : ['daily'], p, fp);
      const hash = buildHashtags(preset, activeTags.length ? activeTags : ['daily']).join(' ');
      const capFull = `${cap}\n\n${hash}`;

      addToHistory({
        preset,
        prompt: p,
        finalPrompt: fp,
        caption: capFull,
        tags: activeTags.length ? activeTags : ['daily'],
      });

      setTimeout(() => finalRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
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
    await generateWithText(idea);
  }

  async function onCopyFinal(text?: string) {
    const t = (text ?? finalPrompt ?? '').trim();
    if (!t) return;
    await navigator.clipboard.writeText(t);
    setCopiedFinal(true);
    setTimeout(() => setCopiedFinal(false), 1200);
  }

  async function onCopyCaption(text?: string) {
    const t = (text ?? autoCaption ?? '').trim();
    if (!t) return;
    await navigator.clipboard.writeText(t);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 1200);
  }

  async function onCopyJson() {
    if (!prettyResult) return;
    await navigator.clipboard.writeText(prettyResult);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1200);
  }

  function onClear() {
    setPrompt('');
    setErr('');
  }

  function onSaveManual() {
    const p = prompt.trim();
    if (!p) return;
    addToHistory({
      preset,
      prompt: p,
      finalPrompt: finalPrompt || '',
      caption: autoCaption || '',
      tags: activeTags.length ? activeTags : ['daily'],
    });
  }

  function updateHistoryTags(id: string, tag: TagKey) {
    setHistory((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const nextTags = toggleTag(x.tags || [], tag);
        return { ...x, tags: nextTags.length ? nextTags : ['daily'] };
      })
    );
  }

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((h) => {
      const matchesQ =
        !q ||
        h.prompt.toLowerCase().includes(q) ||
        (h.finalPrompt || '').toLowerCase().includes(q) ||
        (h.caption || '').toLowerCase().includes(q) ||
        h.preset.toLowerCase().includes(q) ||
        (h.tags || []).join(',').toLowerCase().includes(q);

      const matchesTag = filterTag === 'all' ? true : (h.tags || []).includes(filterTag);
      return matchesQ && matchesTag;
    });
  }, [history, query, filterTag]);

  /* =======================
     UI styles
     ======================= */

  const bg = '#0b1220';
  const card = '#0f172a';
  const border = 'rgba(255,255,255,0.12)';
  const text = 'rgba(255,255,255,0.92)';
  const sub = 'rgba(255,255,255,0.68)';

  const chip = (active: boolean) => ({
    padding: '8px 10px',
    borderRadius: 999,
    border: `1px solid ${active ? 'rgba(76,245,219,0.35)' : border}`,
    background: active ? 'rgba(76,245,219,0.10)' : 'rgba(255,255,255,0.06)',
    color: text,
    fontWeight: 900 as const,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, padding: 16, fontFamily: 'system-ui' }}>
      <main style={{ maxWidth: 860, margin: '0 auto' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 0.4 }}>SORA LITE</h1>
          <div style={{ marginTop: 6, color: sub }}>Daily Content Generator · Single Scene · Tags + History + Auto Caption</div>
        </header>

        {/* Preset */}
        <section style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(Object.keys(presetLabel) as PresetKey[]).map((k) => {
              const active = preset === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPreset(k)}
                  disabled={loading}
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    border: `1px solid ${active ? 'rgba(106,169,255,0.35)' : border}`,
                    background: active ? 'rgba(106,169,255,0.10)' : '#0b1220',
                    color: text,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {presetLabel[k].emoji} {presetLabel[k].title}
                  </div>
                  <div style={{ fontSize: 12, color: sub }}>{presetLabel[k].sub}</div>
                </button>
              );
            })}
          </div>

          {/* Tags select */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: sub, fontWeight: 800, marginBottom: 8 }}>Tags (mood & jenis konten)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TAGS.map((t) => {
                const active = activeTags.includes(t.key);
                return (
                  <button key={t.key} type="button" style={chip(active)} onClick={() => setActiveTags((prev) => toggleTag(prev, t.key))}>
                    #{t.label}
                  </button>
                );
              })}
              <button type="button" style={chip(false)} onClick={() => setActiveTags(['daily'])} title="Reset tag ke daily">
                reset
              </button>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (err) setErr('');
            }}
            placeholder="Tulis ide… atau tekan Auto-generate."
            rows={6}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: '#07101f',
              color: text,
              outline: 'none',
              lineHeight: 1.5,
            }}
          />

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <button
              onClick={onAutoGenerate}
              disabled={loading}
              style={{
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: 'rgba(76,245,219,0.18)',
                color: text,
                fontWeight: 900,
              }}
            >
              {loading ? 'Generating…' : 'Auto-generate'}
            </button>

            <button
              onClick={onGenerate}
              disabled={!prompt.trim() || loading}
              style={{
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: !prompt.trim() || loading ? 'rgba(255,255,255,0.06)' : 'rgba(106,169,255,0.18)',
                color: text,
                fontWeight: 900,
                opacity: !prompt.trim() || loading ? 0.7 : 1,
              }}
            >
              Generate
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ fontSize: 12, color: sub }}>
              <span>Selected: </span>
              <span style={{ fontWeight: 900 }}>{activeTags.length ? activeTags.map((t) => `#${t}`).join(' ') : '#daily'}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: sub }}>{prompt.length} chars</div>
              <button type="button" onClick={onClear} disabled={loading || !prompt.length} style={{ background: 'transparent', border: 'none', color: 'rgba(76,245,219,0.95)', fontWeight: 900 }}>
                Clear
              </button>
              <button type="button" onClick={onSaveManual} disabled={loading || !prompt.trim()} style={{ background: 'transparent', border: 'none', color: 'rgba(106,169,255,0.95)', fontWeight: 900 }}>
                Save
              </button>
            </div>
          </div>

          {err ? <div style={{ marginTop: 10, color: 'rgba(255,120,120,0.95)', fontWeight: 900 }}>{err}</div> : null}
        </section>

        {/* Final prompt + caption */}
        <section ref={finalRef} style={{ marginTop: 12, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 12 }}>
          {/* Final Prompt */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Final Prompt</div>
              <div style={{ fontSize: 12, color: sub }}>Copy ini ke Sora (bukan JSON).</div>
            </div>
            <button
              type="button"
              onClick={() => onCopyFinal()}
              disabled={!finalPrompt}
              style={{
                padding: '10px 12px',
                borderRadius: 999,
                border: `1px solid ${border}`,
                background: 'rgba(255,255,255,0.06)',
                color: text,
                fontWeight: 900,
                opacity: finalPrompt ? 1 : 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              {copiedFinal ? 'Copied ✅' : 'Copy Final'}
            </button>
          </div>

          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${border}`, background: '#07101f', minHeight: 110 }}>
            {!finalPrompt && !loading ? <div style={{ color: sub }}>Belum ada hasil. Tekan Generate / Auto-generate.</div> : null}
            {loading ? <div style={{ color: sub }}>Sedang proses…</div> : null}
            {finalPrompt ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>{finalPrompt}</pre> : null}
          </div>

          {/* Caption */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Auto Caption + 5 Hashtags</div>
              <div style={{ fontSize: 12, color: sub }}>Copy buat TikTok/IG (caption + hashtag otomatis).</div>
            </div>
            <button
              type="button"
              onClick={() => onCopyCaption()}
              disabled={!autoCaption}
              style={{
                padding: '10px 12px',
                borderRadius: 999,
                border: `1px solid ${border}`,
                background: 'rgba(76,245,219,0.10)',
                color: text,
                fontWeight: 900,
                opacity: autoCaption ? 1 : 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              {copiedCaption ? 'Copied ✅' : 'Copy Caption'}
            </button>
          </div>

          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${border}`, background: '#07101f', minHeight: 110 }}>
            {!autoCaption && !loading ? <div style={{ color: sub }}>Caption akan muncul setelah ada prompt/final prompt.</div> : null}
            {autoCaption ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>{autoCaption}</pre> : null}
          </div>
        </section>

        {/* JSON */}
        <section style={{ marginTop: 12, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Response JSON</div>
              <div style={{ fontSize: 12, color: sub }}>Kalau mau inspect output, copy JSON.</div>
            </div>
            <button
              type="button"
              onClick={onCopyJson}
              disabled={!prettyResult}
              style={{
                padding: '10px 12px',
                borderRadius: 999,
                border: `1px solid ${border}`,
                background: 'rgba(255,255,255,0.06)',
                color: text,
                fontWeight: 900,
                opacity: prettyResult ? 1 : 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              {copiedJson ? 'Copied ✅' : 'Copy JSON'}
            </button>
          </div>

          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${border}`, background: '#07101f', minHeight: 110 }}>
            {!prettyResult && !loading ? <div style={{ color: sub }}>Belum ada hasil.</div> : null}
            {loading ? <div style={{ color: sub }}>Sedang proses…</div> : null}
            {prettyResult ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>{prettyResult}</pre> : null}
          </div>
        </section>

        {/* HISTORY */}
        <section style={{ marginTop: 12, background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>History</div>
              <div style={{ fontSize: 12, color: sub }}>Tersimpan di device kamu. Max {MAX_HISTORY} item.</div>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              disabled={!history.length}
              style={{
                padding: '10px 12px',
                borderRadius: 999,
                border: `1px solid ${border}`,
                background: 'rgba(255,120,120,0.10)',
                color: text,
                fontWeight: 900,
                opacity: history.length ? 1 : 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              Clear all
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search… (prompt/final/caption/tag)"
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: '#07101f',
                color: text,
                outline: 'none',
              }}
            />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as any)}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: '#07101f',
                color: text,
                outline: 'none',
              }}
              title="Filter history by tag"
            >
              <option value="all">Filter tag: all</option>
              {TAGS.map((t) => (
                <option key={t.key} value={t.key}>
                  #{t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {!filteredHistory.length ? (
              <div style={{ color: sub }}>Belum ada history.</div>
            ) : (
              filteredHistory.map((h) => (
                <div key={h.id} style={{ border: `1px solid ${border}`, background: '#07101f', borderRadius: 14, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 900 }}>
                      {presetLabel[h.preset].emoji} {presetLabel[h.preset].title}{' '}
                      <span style={{ fontSize: 12, color: sub, fontWeight: 700 }}>· {formatDate(h.createdAt)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setPreset(h.preset);
                          setPrompt(h.prompt);
                          setErr('');
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 999,
                          border: `1px solid ${border}`,
                          background: 'rgba(255,255,255,0.06)',
                          color: text,
                          fontWeight: 900,
                        }}
                      >
                        Use
                      </button>

                      <button
                        type="button"
                        onClick={() => onCopyFinal(h.finalPrompt || h.prompt)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 999,
                          border: `1px solid ${border}`,
                          background: 'rgba(106,169,255,0.10)',
                          color: text,
                          fontWeight: 900,
                        }}
                      >
                        Copy Prompt
                      </button>

                      <button
                        type="button"
                        onClick={() => onCopyCaption(h.caption || '')}
                        disabled={!h.caption}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 999,
                          border: `1px solid ${border}`,
                          background: 'rgba(76,245,219,0.10)',
                          color: text,
                          fontWeight: 900,
                          opacity: h.caption ? 1 : 0.6,
                        }}
                      >
                        Copy Caption
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromHistory(h.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 999,
                          border: `1px solid ${border}`,
                          background: 'rgba(255,120,120,0.10)',
                          color: text,
                          fontWeight: 900,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* item tags editable */}
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TAGS.map((t) => {
                      const on = (h.tags || []).includes(t.key);
                      return (
                        <button key={t.key} type="button" style={chip(on)} onClick={() => updateHistoryTags(h.id, t.key)} title="Toggle tag untuk item ini">
                          #{t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: sub, fontWeight: 800 }}>Prompt</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{h.prompt}</div>

                  {h.finalPrompt ? (
                    <>
                      <div style={{ marginTop: 10, fontSize: 12, color: sub, fontWeight: 800 }}>Final Prompt</div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{h.finalPrompt}</div>
                    </>
                  ) : null}

                  {h.caption ? (
                    <>
                      <div style={{ marginTop: 10, fontSize: 12, color: sub, fontWeight: 800 }}>Caption</div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{h.caption}</div>
                    </>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <div style={{ height: 28 }} />
      </main>
    </div>
  );
}
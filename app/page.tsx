"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite — STRICT LOCKED CAST (FULL REPLACE)
 *
 * LOCK RULES (as requested):
 * - Preset @hanzonk26 => ONLY Niche Personal (@hanzonk26)
 * - Preset Sweepy (@mockey.mo) => ONLY Niche Sweepy
 * - Preset @hanz26 => ONLY Niche Colab (with Sweepy nonverbal)
 *
 * Niches:
 * - Personal (@hanzonk26): UGC Daily / Kesehatan / Story Telling
 * - Sweepy Only: UGC Daily Sweepy
 * - Colab (@hanz26 + @mockey.mo): Indoor / Outdoor / Nusantara Random
 */

type NicheKey =
  | "personal_daily"
  | "personal_health"
  | "personal_story"
  | "sweepy_daily"
  | "colab";

type PresetKey = "hanzonk26" | "mockey" | "hanz26";
type LocationMode = "indoor" | "outdoor" | "nusantara";

type SavedPrompt = {
  id: string;
  title: string;
  niche: NicheKey;
  preset: PresetKey;
  locationMode: LocationMode;
  promptUtama: string;
  autoBlock: string;
  extra: string;
  finalPrompt: string;
  caption: string;
  hashtags: string[];
  createdAt: number;
};

type HistoryItem = {
  id: string;
  niche: NicheKey;
  preset: PresetKey;
  locationMode: LocationMode;
  autoBlock: string;
  createdAt: number;
};

const LS_SAVED = "soraLite.savedPrompts.locked.v2";
const LS_HISTORY = "soraLite.history.locked.v2";

const NICHE_LABEL: Record<NicheKey, string> = {
  personal_daily: "Personal — UGC Daily (@hanzonk26)",
  personal_health: "Personal — Kesehatan (@hanzonk26)",
  personal_story: "Personal — Story Telling (@hanzonk26)",
  sweepy_daily: "Sweepy — UGC Daily (@mockey.mo)",
  colab: "Colab — @hanz26 × @mockey.mo",
};

const PRESET_LABEL: Record<PresetKey, string> = {
  hanzonk26: "@hanzonk26",
  mockey: "@mockey.mo (Sweepy)",
  hanz26: "@hanz26 (Colab only)",
};

const LOCATION_LABEL: Record<LocationMode, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  nusantara: "Nusantara (Random Indonesia)",
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampText(s: string) {
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function token() {
  return Math.random().toString(36).slice(2, 8);
}

/** ---------------- STRICT LOCK ---------------- */

function enforcedPreset(niche: NicheKey): PresetKey {
  if (niche.startsWith("personal_")) return "hanzonk26";
  if (niche === "sweepy_daily") return "mockey";
  return "hanz26"; // colab niche uses @hanz26 (and Sweepy appears as partner in prompt rules)
}

function allowedLocationModes(niche: NicheKey): LocationMode[] {
  return niche === "colab" ? ["indoor", "outdoor", "nusantara"] : ["indoor", "outdoor"];
}

function enforceLocationMode(niche: NicheKey, mode: LocationMode): LocationMode {
  const allowed = allowedLocationModes(niche);
  return allowed.includes(mode) ? mode : allowed[0];
}

/** ---------------- Location Pools ---------------- */

const INDOOR = [
  "di meja kerja dengan laptop",
  "di kamar sederhana dengan cahaya natural",
  "di dapur rumah (vibe santai)",
  "di ruang keluarga sederhana",
  "di coffee shop kecil yang tenang",
];

const OUTDOOR = [
  "di teras rumah sore hari",
  "di pinggir jalan kompleks (vlog feel)",
  "di taman kota yang ramai",
  "di area car free day",
  "di pinggir lapangan kecil",
];

const NUSANTARA = [
  "Malioboro, Yogyakarta",
  "Braga, Bandung",
  "Kota Tua Jakarta",
  "Ubud, Bali",
  "Kuta, Bali",
  "Danau Toba, Sumatera Utara",
  "Bukittinggi, Sumbar",
  "Tunjungan, Surabaya",
  "Alun-alun Malang",
  "Labuan Bajo",
  "Lombok (pantai & street vibe)",
];

const CAMERA = [
  "UGC vertical 9:16, handheld ringan (subtle shake), natural",
  "UGC vertical 9:16, tripod statis base + quick handheld reaction inserts",
  "UGC vertical 9:16, eye-level candid, framing dada-ke-atas",
];

function pickLocation(mode: LocationMode) {
  if (mode === "indoor") return pick(INDOOR);
  if (mode === "outdoor") return pick(OUTDOOR);
  return pick(NUSANTARA);
}

/** ---------------- Sweepy rules (nonverbal) ---------------- */

function sweepyRule() {
  return `RULE SWEEPY (WAJIB):
- Sweepy (@mockey.mo) paham bahasa manusia tapi TIDAK berbicara bahasa manusia.
- Respon hanya nonverbal: gesture, ekspresi, menunjuk, angguk/geleng, suara monyet kecil (chitter).
- Subtitle hanya untuk kalimat manusia (bukan Sweepy).`;
}

/** ---------------- Prompt Utama template ---------------- */

function defaultPromptUtama(niche: NicheKey, mode: LocationMode) {
  const loc = pickLocation(mode);
  const cam = pick(CAMERA);

  const base = `Durasi total ±20 detik, 2 scene (±10 detik + ±10 detik), DIGABUNG jadi 1 video utuh.
Gaya: UGC natural, relatable, ekspresi autentik.
Hook kuat 0–2 detik. Ending punchline/reveal bikin replay.
Kontinuitas: lokasi/outfit/karakter konsisten di dua scene.
Lokasi: ${loc}.
Kamera: ${cam}.`;

  if (niche === "personal_daily") {
    return clampText(`${base}
Cast: @hanzonk26 (human).

SCENE 1 (0–10 detik):
Situasi normal + konflik kecil muncul cepat (0–2 detik).

SCENE 2 (10–20 detik):
Konflik naik tapi masih believable.
Ending punchline (1 kalimat / visual) lalu cut pas lucu.`);
  }

  if (niche === "personal_health") {
    return clampText(`${base}
Cast: @hanzonk26 (human).

KESEHATAN (NON-MEDICAL):
- Jangan klaim “menyembuhkan/pasti”.
- 1 kebiasaan kecil yang gampang dicoba.

SCENE 1:
Hook masalah umum.

SCENE 2:
1–2 langkah praktis + contoh real.
Closing: “kalau ada kondisi khusus, konsultasi profesional.”`);
  }

  if (niche === "personal_story") {
    return clampText(`${base}
Cast: @hanzonk26 (human).

STORY TELLING:
SCENE 1:
Cerita first-person singkat (detail spesifik biar terasa nyata).

SCENE 2:
Twist/pelajaran ringan, tutup 1 kalimat nempel + ekspresi natural.`);
  }

  if (niche === "sweepy_daily") {
    return clampText(`${base}
Cast: @mockey.mo (Sweepy) solo (nonverbal).
${sweepyRule()}
Catatan: boleh ada suara off-camera manusia untuk konteks (tanpa dialog Sweepy).

SCENE 1:
Sweepy melakukan aksi harian yang terlihat “pintar” tapi lucu (hook cepat).

SCENE 2:
Aksi makin absurd, punchline visual, cut tepat saat lucu.`);
  }

  // colab
  return clampText(`${base}
Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.
${sweepyRule()}

SCENE 1:
Hook konflik kecil (0–2s). @hanz26 ngomong 1–2 kalimat singkat.
Sweepy respon nonverbal.

SCENE 2:
Konflik makin absurd tapi believable.
Ending punchline + cut tepat saat lucu.`);
}

/** ---------------- Auto generators (STRICT: no Sweepy in Personal) ---------------- */

const PERSONAL_DAILY_BASE = [
  "lagi setting kamera buat konten",
  "lagi kerja di laptop (deadline vibe)",
  "lagi bikin kopi",
  "lagi beres-beres meja",
  "lagi jalan santai sambil vlog",
];

const PERSONAL_CONFLICT = [
  "notifikasi masuk terus pas lagi serius",
  "ketinggalan barang kecil tapi bikin panik lucu",
  "salah ucap lalu berusaha tetap pede",
  "tiba-tiba kebanyakan orang lewat (awkward) tapi tetap lanjut",
];

const HEALTH_TOPICS = [
  "minum air lebih konsisten (trik simpel)",
  "napas 60 detik buat nurunin tegang",
  "jalan kaki 10 menit setelah makan",
  "sleep routine simpel",
  "kurangi gula pelan-pelan",
];

const STORY_THEMES = [
  "kejadian kecil yang bikin sadar sesuatu",
  "momen random yang relate banget",
  "gue kira begini, ternyata begitu",
  "gagal lucu yang jadi pelajaran",
];

const SWEEPY_BASE = [
  "Sweepy penasaran tombol/remote dan sok jadi operator",
  "Sweepy merapikan barang dengan gaya ‘perfeksionis’",
  "Sweepy meniru rutinitas manusia (pura-pura serius)",
  "Sweepy ‘ngehost’ vlog tanpa suara, cuma gesture",
];

const SWEEPY_REACTIONS = [
  "angguk cepat lalu menunjuk-nunjuk (seolah paham)",
  "geleng keras sambil chitter kecil",
  "tatap kamera → tatap manusia off-camera → pose bangga",
  "pura-pura serius: lipat tangan, angguk pelan, lalu jahil",
];

const COLAB_CONFLICT = [
  "Sweepy photobomb pas momen serius",
  "Sweepy ngambil barang penting dan pura-pura polos",
  "Sweepy ngatur-ngatur kayak ‘manager’ pakai gesture",
  "Sweepy meniru gaya @hanz26 secara berlebihan",
];

const TRAVEL_CONFLICT = [
  "Sweepy menunjuk arah yang salah dengan percaya diri",
  "Sweepy ngotot foto dulu (gesture stop) padahal @hanz26 mau jalan",
  "Sweepy kepincut jajanan, lalu kabur kecil sambil peluk bungkusan",
  "Sweepy tiba-tiba ‘minta cameo’ dengan pose lucu di depan landmark",
];

const PUNCHLINES = [
  "Ending: @hanz26 ketawa pasrah, cut pas Sweepy angguk puas.",
  "Ending: freeze 0.5 detik tatap-tatapan, cut lucu.",
  "Ending: reveal singkat ternyata Sweepy yang rekam dari tadi.",
  "Ending: @hanz26: “Oke, kamu yang host.” cut pas Sweepy pose.",
];

function autoCommon(mode: LocationMode) {
  return clampText(`
Format: vertical 9:16, UGC natural
Camera: ${pick(CAMERA)}
Location: ${pickLocation(mode)}
Audio: natural room tone
Uniqueness token: ${token()}
`);
}

function autoPersonalDaily(mode: LocationMode) {
  return clampText(`
AUTO BLOCK (PERSONAL — NO SWEEPY):
Cast: @hanzonk26 (human).
Base: ${pick(PERSONAL_DAILY_BASE)}.
Conflict: ${pick(PERSONAL_CONFLICT)}.
Timing: hook 0–2s → build 2–10s → payoff 10–18s → punchline 18–20s.
${autoCommon(mode)}
`);
}

function autoPersonalHealth(mode: LocationMode) {
  return clampText(`
AUTO BLOCK (PERSONAL HEALTH — NO SWEEPY):
Cast: @hanzonk26 (human).
Rules: non-medical, no “menyembuhkan/pasti”.
Topic: ${pick(HEALTH_TOPICS)}.
Structure: 1 problem → 1 habit → 1–2 steps demo → reminder consult professional.
${autoCommon(mode)}
`);
}

function autoPersonalStory(mode: LocationMode) {
  return clampText(`
AUTO BLOCK (PERSONAL STORY — NO SWEEPY):
Cast: @hanzonk26 (human).
Theme: ${pick(STORY_THEMES)}.
Pacing: hook 2s → story → twist kecil → closing hangat.
${autoCommon(mode)}
`);
}

function autoSweepyDaily(mode: LocationMode) {
  return clampText(`
AUTO BLOCK (SWEEPY SOLO — NONVERBAL):
Cast: @mockey.mo (Sweepy) solo.
${sweepyRule()}
Base: ${pick(SWEEPY_BASE)}.
Sweepy reaction: ${pick(SWEEPY_REACTIONS)}.
Timing: hook 0–2s → build 2–10s → absurd peak 10–18s → punchline 18–20s.
${autoCommon(mode)}
`);
}

function autoColab(mode: LocationMode) {
  const conflict = mode === "nusantara" ? pick(TRAVEL_CONFLICT) : pick(COLAB_CONFLICT);
  return clampText(`
AUTO BLOCK (COLAB — @hanz26 + SWEEPY NONVERBAL):
Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.
${sweepyRule()}
Conflict: ${conflict}
Punchline: ${pick(PUNCHLINES)}
Timing: hook 0–2s → build 2–10s → chaos 10–18s → punchline 18–20s.
${autoCommon(mode)}
`);
}

function buildAuto(niche: NicheKey, mode: LocationMode) {
  switch (niche) {
    case "personal_daily":
      return autoPersonalDaily(mode);
    case "personal_health":
      return autoPersonalHealth(mode);
    case "personal_story":
      return autoPersonalStory(mode);
    case "sweepy_daily":
      return autoSweepyDaily(mode);
    case "colab":
      return autoColab(mode);
  }
}

/** ---------------- Caption + tags ---------------- */

function captionTags(niche: NicheKey) {
  const captions: Record<NicheKey, string[]> = {
    personal_daily: ["Daily tapi chaos dikit 😅", "Niat produktif… reality check.", "Receh tapi nagih."],
    personal_health: ["Kebiasaan kecil, efeknya kerasa. 💧", "Pelan-pelan yang penting jalan.", "Reminder halus hari ini."],
    personal_story: ["Cerita kecil, tapi relate. 😅", "Kejadian receh… tapi ngena.", "Yang simpel itu nempel."],
    sweepy_daily: ["Sweepy mode pintar: ON 🐵", "Dia paham, tapi gak ngomong 😂", "Nonverbal tapi rame."],
    colab: ["Duo chaos nonverbal 🤣", "Yang satu ngomong, yang satu paham.", "Chaos mode: ON."],
  };

  const tags: Record<NicheKey, string[]> = {
    personal_daily: ["hanzonk26", "ugc", "daily", "reels", "fyp"],
    personal_health: ["hanzonk26", "kesehatan", "habit", "sehat", "fyp"],
    personal_story: ["hanzonk26", "storytime", "ugc", "relate", "fyp"],
    sweepy_daily: ["mockeymo", "sweepy", "lucu", "reels", "fyp"],
    colab: ["hanz26", "mockeymo", "sweepy", "lucu", "fyp"],
  };

  return {
    caption: pick(captions[niche]),
    hashtags: shuffle(tags[niche]).slice(0, 5).map((t) => `#${t}`),
  };
}

/** ---------------- UI ---------------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("personal_daily");
  const [preset, setPreset] = useState<PresetKey>("hanzonk26");
  const [locationMode, setLocationMode] = useState<LocationMode>("indoor");

  const [promptUtama, setPromptUtama] = useState("");
  const [autoBlock, setAutoBlock] = useState("");
  const [extra, setExtra] = useState("");

  const [finalPrompt, setFinalPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastAutoRef = useRef("");

  const lockedPreset = useMemo(() => enforcedPreset(niche), [niche]);
  const allowedModes = useMemo(() => allowedLocationModes(niche), [niche]);
  const lockedMode = useMemo(() => enforceLocationMode(niche, locationMode), [niche, locationMode]);

  useEffect(() => {
    setSaved(safeParse(localStorage.getItem(LS_SAVED), []));
    setHistory(safeParse(localStorage.getItem(LS_HISTORY), []));
  }, []);

  useEffect(() => {
    // enforce locks
    if (preset !== lockedPreset) setPreset(lockedPreset);
    if (locationMode !== lockedMode) setLocationMode(lockedMode);

    setPromptUtama((prev) => (prev.trim().length > 10 ? prev : defaultPromptUtama(niche, lockedMode)));

    const ch = captionTags(niche);
    setCaption(ch.caption);
    setHashtags(ch.hashtags);

    setAutoBlock("");
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const merged = clampText(`
PRESET (LOCKED): ${PRESET_LABEL[lockedPreset]}
NICHE: ${NICHE_LABEL[niche]}
LOCATION MODE: ${LOCATION_LABEL[lockedMode]}

PROMPT UTAMA (MANUAL):
${promptUtama.trim() || "(Isi Prompt Utama dulu)"}

AUTO BLOCK (FRESH):
${autoBlock.trim() || "(Klik Auto Generate)"}

EXTRA (OPTIONAL):
${extra.trim() || "-"}

OUTPUT RULES:
- One coherent ~20s video, 2 scenes merged (0–10s and 10–20s).
- Keep continuity of location/outfit/characters between scenes.
- STRICT CAST LOCK:
  - Personal niche => ONLY @hanzonk26 (NO Sweepy).
  - Sweepy niche   => ONLY @mockey.mo (nonverbal).
  - Colab niche    => @hanz26 + @mockey.mo (Sweepy nonverbal).
- Sweepy NEVER speaks human language; nonverbal only.
- Vertical 9:16, UGC natural feel.
`);
    setFinalPrompt(merged);
  }, [promptUtama, autoBlock, extra, niche, lockedMode, lockedPreset]);

  function persistSaved(next: SavedPrompt[]) {
    setSaved(next);
    localStorage.setItem(LS_SAVED, JSON.stringify(next));
  }

  function persistHistory(next: HistoryItem[]) {
    setHistory(next);
    localStorage.setItem(LS_HISTORY, JSON.stringify(next));
  }

  function doAutoGenerate() {
    let out = "";
    for (let i = 0; i < 10; i++) {
      out = buildAuto(niche, lockedMode);
      if (clampText(out) !== clampText(lastAutoRef.current)) break;
    }
    lastAutoRef.current = out;
    setAutoBlock(out);

    const item: HistoryItem = {
      id: uid("hist"),
      niche,
      preset: lockedPreset,
      locationMode: lockedMode,
      autoBlock: out,
      createdAt: Date.now(),
    };
    persistHistory([item, ...history].slice(0, 150));
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  function doSave() {
    const ch = captionTags(niche);

    const item: SavedPrompt = {
      id: uid("save"),
      title: `${NICHE_LABEL[niche]} • ${LOCATION_LABEL[lockedMode]} • ${new Date().toLocaleString("id-ID")}`,
      niche,
      preset: lockedPreset,
      locationMode: lockedMode,
      promptUtama,
      autoBlock,
      extra,
      finalPrompt,
      caption: ch.caption,
      hashtags: ch.hashtags,
      createdAt: Date.now(),
    };
    persistSaved([item, ...saved].slice(0, 300));
    setCaption(ch.caption);
    setHashtags(ch.hashtags);
  }

  function removeSaved(id: string) {
    persistSaved(saved.filter((x) => x.id !== id));
  }
  function clearHistory() {
    persistHistory([]);
  }

  /** soft blue pro theme */
  const shell =
    "min-h-screen bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(59,130,246,0.22),transparent),radial-gradient(900px_600px_at_80%_30%,rgba(99,102,241,0.16),transparent),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(15,23,42,1),rgba(2,6,23,1))] text-slate-100";
  const card =
    "border border-blue-900/40 rounded-2xl p-4 md:p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] bg-blue-950/35 backdrop-blur";
  const cardTitle = "text-sm font-semibold text-blue-200 tracking-wide";
  const subText = "text-xs text-blue-300/70";
  const btn = "px-3 py-2 rounded-xl border border-blue-900/40 hover:bg-blue-900/25 active:scale-[0.99] transition";
  const btnPrimary =
    "px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99] transition shadow-md shadow-blue-500/20";
  const btnGhost =
    "px-3 py-2 rounded-xl border border-blue-900/30 bg-transparent hover:bg-blue-900/20 active:scale-[0.99] transition";
  const pill =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-900/40 bg-blue-950/30 text-xs text-blue-200";
  const textarea =
    "mt-3 w-full rounded-xl border border-blue-900/40 bg-blue-950/40 p-3 text-sm text-slate-100 outline-none focus:border-blue-400 placeholder:text-blue-300/50";
  const preBox =
    "mt-3 whitespace-pre-wrap rounded-xl border border-blue-900/40 p-3 text-sm bg-blue-950/40 text-slate-100";
  const smallPre =
    "mt-3 whitespace-pre-wrap rounded-xl border border-blue-900/40 p-3 text-xs bg-blue-950/25 text-slate-100";

  const canCopyFinal = finalPrompt.trim().length > 0;
  const canCopyAuto = autoBlock.trim().length > 0;

  const presetButtons: { key: PresetKey; locked: boolean; reason: string }[] = [
    { key: "hanzonk26", locked: lockedPreset !== "hanzonk26", reason: "Hanya untuk niche Personal" },
    { key: "mockey", locked: lockedPreset !== "mockey", reason: "Hanya untuk niche Sweepy" },
    { key: "hanz26", locked: lockedPreset !== "hanz26", reason: "Hanya untuk niche Colab" },
  ];

  return (
    <div className={shell}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Sora Lite — Strict Locked Cast</h1>
              <p className="text-sm text-blue-300/60 mt-1">
                Personal=@hanzonk26 • Sweepy=@mockey.mo • Colab=@hanz26 + Sweepy (nonverbal)
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className={pill}>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Cast Locked
              </span>
              <span className="text-xs text-blue-300/60">20 detik • 2 scene • 1 video utuh</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={pill}>
              Niche: <b className="text-blue-100">{NICHE_LABEL[niche]}</b>
            </span>
            <span className={pill}>
              Preset (locked): <b className="text-blue-100">{PRESET_LABEL[lockedPreset]}</b>
            </span>
            <span className={pill}>
              Lokasi: <b className="text-blue-100">{LOCATION_LABEL[lockedMode]}</b>
            </span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="md:col-span-1 space-y-4">
            <section className={card}>
              <div className={cardTitle}>Niche</div>
              <div className={subText}>Niche menentukan preset (Sweepy tidak akan nyasar ke personal).</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(Object.keys(NICHE_LABEL) as NicheKey[]).map((k) => (
                  <button
                    key={k}
                    className={`${btn} ${niche === k ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""}`}
                    onClick={() => setNiche(k)}
                  >
                    {NICHE_LABEL[k]}
                  </button>
                ))}
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Preset (Locked)</div>
              <div className={subText}>Ditampilkan untuk info, dikunci sesuai niche.</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {presetButtons.map((p) => (
                  <button
                    key={p.key}
                    className={`${btn} ${lockedPreset === p.key ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""} ${
                      p.locked ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {}}
                    title={p.locked ? p.reason : PRESET_LABEL[p.key]}
                  >
                    <div className="flex items-center justify-between">
                      <span>{PRESET_LABEL[p.key]}</span>
                      {p.locked ? <span className="text-xs">🔒</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Mode Lokasi</div>
              <div className={subText}>Colab bisa Nusantara; lainnya indoor/outdoor.</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {allowedModes.map((m) => (
                  <button
                    key={m}
                    className={`${btn} ${locationMode === m ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""}`}
                    onClick={() => setLocationMode(m)}
                  >
                    {LOCATION_LABEL[m]}
                  </button>
                ))}
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Auto Generate</div>
              <div className={subText}>Mengisi Auto Block (fresh). Personal generator = NO Sweepy.</div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className={btnPrimary} onClick={doAutoGenerate}>
                  Auto Generate
                </button>
                <button
                  className={btnGhost}
                  onClick={() => {
                    const ch = captionTags(niche);
                    setCaption(ch.caption);
                    setHashtags(ch.hashtags);
                  }}
                >
                  Refresh Caption/Tags
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className={`${btn} ${!canCopyAuto ? "opacity-40 cursor-not-allowed" : ""}`} disabled={!canCopyAuto} onClick={() => copyText(autoBlock)}>
                  Copy Auto Block
                </button>
                <button
                  className={`${btn} ${!canCopyAuto ? "opacity-40 cursor-not-allowed" : ""}`}
                  disabled={!canCopyAuto}
                  onClick={() => setExtra((prev) => clampText(`${prev}\n\n# AUTO BLOCK (appended)\n${autoBlock}`))}
                >
                  Append to Extra
                </button>
              </div>

              <pre className={smallPre}>{autoBlock || "Belum ada Auto Block. Klik Auto Generate."}</pre>
            </section>

            <section className={card}>
              <div className={cardTitle}>Caption + 5 Hashtags</div>
              <div className="mt-2 text-sm text-slate-100">{caption}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {hashtags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full border border-blue-900/40 text-blue-200 bg-blue-900/10">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className={btn} onClick={() => copyText(`${caption}\n\n${hashtags.join(" ")}`)}>
                  Copy Caption+Tags
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-2 space-y-4">
            <section className={card}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={cardTitle}>Prompt Utama (Manual)</div>
                  <div className={subText}>Template mengikuti niche + cast lock. Kamu bebas edit.</div>
                </div>
                <div className="flex gap-2">
                  <button className={btn} onClick={() => setPromptUtama(defaultPromptUtama(niche, lockedMode))}>
                    Reset Template
                  </button>
                  <button className={btn} onClick={() => setPromptUtama("")}>
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                className={`${textarea} min-h-[280px]`}
                value={promptUtama}
                onChange={(e) => setPromptUtama(e.target.value)}
                placeholder="Tulis prompt manual kamu di sini..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={pill}>Hook 0–2 detik</span>
                <span className={pill}>2 scene merged</span>
                <span className={pill}>Strict cast lock</span>
                <span className={pill}>Cut pas punchline</span>
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Extra (optional)</div>
              <div className={subText}>Outfit, subtitle style, props, dll.</div>
              <textarea
                className={`${textarea} min-h-[120px]`}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Contoh: outfit hoodie hitam, subtitle minimal, close-up saat punchline..."
              />
            </section>

            <section className={card}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={cardTitle}>Final Prompt</div>
                  <div className={subText}>Manual + Auto + Extra + aturan.</div>
                </div>

                <div className="flex gap-2">
                  <button className={`${btn} ${!canCopyFinal ? "opacity-40 cursor-not-allowed" : ""}`} disabled={!canCopyFinal} onClick={() => copyText(finalPrompt)}>
                    Copy Final Prompt
                  </button>
                  <button className={btnPrimary} onClick={doSave}>
                    Save
                  </button>
                </div>
              </div>

              <pre className={preBox}>{finalPrompt}</pre>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <section className={card}>
                <div className="flex items-center justify-between">
                  <div className={cardTitle}>Saved Prompts</div>
                  <div className="text-xs text-blue-300/70">{saved.length}</div>
                </div>

                <div className="mt-3 space-y-2 max-h-[360px] overflow-auto pr-1">
                  {saved.length === 0 ? (
                    <div className="text-sm text-blue-300/70">Belum ada. Klik Save.</div>
                  ) : (
                    saved.map((s) => (
                      <div key={s.id} className="rounded-xl border border-blue-900/40 p-3 bg-blue-950/25">
                        <div className="text-sm font-medium text-slate-100">{s.title}</div>
                        <div className="text-xs text-blue-300/70 mt-1">
                          {NICHE_LABEL[s.niche]} • {LOCATION_LABEL[s.locationMode]} • {PRESET_LABEL[s.preset]}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className={btn} onClick={() => copyText(s.finalPrompt)}>
                            Copy Prompt
                          </button>
                          <button className={btn} onClick={() => copyText(`${s.caption}\n\n${s.hashtags.join(" ")}`)}>
                            Copy Caption+Tags
                          </button>
                          <button
                            className={btn}
                            onClick={() => {
                              setNiche(s.niche);
                              setLocationMode(s.locationMode);
                              setPromptUtama(s.promptUtama);
                              setAutoBlock(s.autoBlock);
                              setExtra(s.extra);
                            }}
                          >
                            Load
                          </button>
                          <button className={btn} onClick={() => removeSaved(s.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className={card}>
                <div className="flex items-center justify-between">
                  <div className={cardTitle}>History (Auto Block)</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-blue-300/70">{history.length}</div>
                    <button className={btn} onClick={clearHistory}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-[360px] overflow-auto pr-1">
                  {history.length === 0 ? (
                    <div className="text-sm text-blue-300/70">Klik Auto Generate untuk mulai.</div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} className="rounded-xl border border-blue-900/40 p-3 bg-blue-950/25">
                        <div className="text-xs text-blue-300/70">
                          {NICHE_LABEL[h.niche]} • {LOCATION_LABEL[h.locationMode]} • {PRESET_LABEL[h.preset]}
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-blue-950/40 border border-blue-900/40 rounded-xl p-2 text-slate-100">
                          {h.autoBlock}
                        </pre>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className={btn} onClick={() => copyText(h.autoBlock)}>
                            Copy
                          </button>
                          <button className={btn} onClick={() => setAutoBlock(h.autoBlock)}>
                            Use Auto Block
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <footer className="text-xs text-blue-300/60 pt-2">
          Strict lock aktif: Personal tidak akan pernah menyebut Sweepy. Sweepy solo tidak akan menyebut @hanzonk26/@hanz26. Colab selalu @hanz26 + Sweepy nonverbal.
        </footer>
      </div>
    </div>
  );
}
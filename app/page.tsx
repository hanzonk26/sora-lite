"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite — Pro Prompt Builder (FULL REPLACE)
 *
 * Presets (ONLY):
 * - @hanzonk26
 * - @mockey.mo (Sweepy)  // NONVERBAL
 * - @hanz26 × @mockey.mo // Colab, Sweepy NONVERBAL
 *
 * Niches:
 * - UGC Daily (funny/absurd)
 * - Kesehatan (non-medical)
 * - Story Telling
 * - Colab Nusantara (ONLY colab) -> Indoor / Outdoor / Nusantara random
 *
 * Location Mode:
 * - For UGC Daily / Kesehatan / Story: Indoor | Outdoor
 * - For Colab Nusantara: Indoor | Outdoor | Nusantara (random Indonesia)
 *
 * UX:
 * - Prompt Utama = clean director brief (20s, 2 scenes merged)
 * - Auto Block = idea engine (fresh, detailed)
 * - Final Prompt = Prompt Utama + Auto Block + Extra + Output Rules
 * - Copy buttons: Auto Block, Final Prompt, Caption+Tags
 * - Save + History in localStorage
 */

type NicheKey = "ugc_daily" | "kesehatan" | "story" | "colab_nusantara";
type PresetKey = "hanzonk26" | "mockey" | "colab";
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

const LS_SAVED = "soraLite.savedPrompts.v5";
const LS_HISTORY = "soraLite.history.v5";

const NICHE_LABEL: Record<NicheKey, string> = {
  ugc_daily: "UGC Daily (Absurd/Funny)",
  kesehatan: "Kesehatan",
  story: "Story Telling",
  colab_nusantara: "Colab Nusantara (Khusus Colab)",
};

const PRESET_LABEL: Record<PresetKey, string> = {
  hanzonk26: "@hanzonk26",
  mockey: "@mockey.mo (Sweepy)",
  colab: "@hanz26 × @mockey.mo (Colab)",
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

function uniquenessToken() {
  return Math.random().toString(36).slice(2, 8);
}

/** ---------------- Rules ---------------- */

function allowedPresetsForNiche(niche: NicheKey): PresetKey[] {
  switch (niche) {
    case "colab_nusantara":
      return ["colab"]; // ONLY colab
    case "ugc_daily":
    case "kesehatan":
    case "story":
      return ["hanzonk26", "mockey", "colab"];
  }
}

function enforcePreset(niche: NicheKey, preset: PresetKey): PresetKey {
  const allowed = allowedPresetsForNiche(niche);
  if (allowed.includes(preset)) return preset;
  return allowed[0];
}

function allowedLocationModes(niche: NicheKey): LocationMode[] {
  switch (niche) {
    case "colab_nusantara":
      return ["indoor", "outdoor", "nusantara"];
    default:
      return ["indoor", "outdoor"];
  }
}

function enforceLocationMode(niche: NicheKey, mode: LocationMode): LocationMode {
  const allowed = allowedLocationModes(niche);
  if (allowed.includes(mode)) return mode;
  return allowed[0];
}

/** ---------------- Location Pools ---------------- */

const INDOOR_LOCATIONS = [
  "di meja kerja dengan laptop",
  "di kamar sederhana dengan cahaya natural",
  "di dapur rumah (vibe santai)",
  "di ruang keluarga sederhana",
  "di coffee shop kecil yang tenang",
];

const OUTDOOR_LOCATIONS = [
  "di teras rumah sore hari",
  "di pinggir jalan kompleks (vlog feel)",
  "di taman kota yang ramai",
  "di area car free day",
  "di pinggir lapangan kecil",
];

const NUSANTARA_LOCATIONS = [
  "Ubud, Bali (jalan kecil estetik)",
  "Pantai Kuta, Bali (keramaian)",
  "Malioboro, Yogyakarta (street vibe)",
  "Tugu Jogja (spot ikonik)",
  "Danau Toba, Sumatera Utara (view luas)",
  "Bukittinggi, Sumbar (vibe sejuk)",
  "Kota Tua Jakarta (heritage)",
  "Braga, Bandung (street aesthetic)",
  "Alun-alun Malang (ramai santai)",
  "Surabaya Tunjungan (city walk)",
  "Lombok (pantai dan jalan kecil)",
  "Labuan Bajo (harbor vibe)",
];

const CAMERA_STYLES = [
  "UGC vertical 9:16, handheld ringan (subtle shake), natural",
  "UGC vertical 9:16, tripod statis base + quick handheld reaction inserts",
  "UGC vertical 9:16, eye-level candid, framing dada-ke-atas",
];

function pickLocation(mode: LocationMode) {
  if (mode === "indoor") return pick(INDOOR_LOCATIONS);
  if (mode === "outdoor") return pick(OUTDOOR_LOCATIONS);
  return pick(NUSANTARA_LOCATIONS);
}

/** ---------------- Prompt Utama Templates (clean & manual-friendly) ---------------- */

function defaultPromptUtama(niche: NicheKey, preset: PresetKey, mode: LocationMode) {
  const loc = pickLocation(mode);
  const camera = pick(CAMERA_STYLES);

  const base = `Durasi total ±20 detik, dibagi 2 scene (masing-masing ±10 detik), DIGABUNG jadi 1 video utuh.
Gaya: UGC natural, relatable, ekspresi autentik.
Hook kuat 0–2 detik. Ending punchline/reveal bikin replay.
Kontinuitas: lokasi/outfit/karakter konsisten di dua scene.
Lokasi: ${loc}.
Kamera: ${camera}.`;

  const sweepyRule = `RULE SWEEPY (WAJIB):
- @mockey.mo (Sweepy) paham bahasa manusia tapi TIDAK berbicara bahasa manusia.
- Sweepy hanya merespon nonverbal: gesture, ekspresi, menunjuk, angguk/geleng, suara monyet kecil (chitter).
- Subtitle hanya untuk kalimat manusia (bukan Sweepy).`;

  const castLine =
    preset === "hanzonk26"
      ? "Cast: @hanzonk26 (human)."
      : preset === "mockey"
      ? "Cast: @mockey.mo (Sweepy) saja (nonverbal). Gunakan suara off-camera manusia bila perlu."
      : "Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.";

  if (niche === "kesehatan") {
    return clampText(`${base}
${castLine}
${sweepyRule}

KONTEN KESEHATAN (NON-MEDICAL):
- Jangan klaim menyembuhkan/pasti.
- 1 kebiasaan kecil yang gampang dicoba.

SCENE 1 (0–10 detik):
Hook masalah umum (contoh: susah tidur / kurang minum / gampang tegang).
Kalimat singkat, jelas.

SCENE 2 (10–20 detik):
Tunjukin 1–2 langkah praktis + contoh real.
Closing: “kalau punya kondisi khusus, konsultasi profesional.”`);
  }

  if (niche === "story") {
    return clampText(`${base}
${castLine}
${sweepyRule}

STORY TELLING:
SCENE 1 (0–10 detik):
Cerita first-person singkat, ada detail spesifik biar terasa nyata.

SCENE 2 (10–20 detik):
Twist/pelajaran ringan, tutup dengan 1 kalimat yang nempel + ekspresi natural.`);
  }

  if (niche === "ugc_daily") {
    return clampText(`${base}
${castLine}
${sweepyRule}

UGC DAILY (FUNNY/ABSURD):
SCENE 1 (0–10 detik):
Situasi normal sehari-hari + konflik kecil muncul cepat (0–2 detik).

SCENE 2 (10–20 detik):
Konflik makin absurd tapi masih believable.
Ending punchline visual / 1 kalimat singkat (cut pas lucu).`);
  }

  // colab_nusantara (ONLY colab enforced)
  return clampText(`${base}
Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.
${sweepyRule}

COLAB NUSANTARA (JALAN-JALAN INDONESIA):
SCENE 1 (0–10 detik):
Hook: “Kita lagi di ${mode === "nusantara" ? loc : "spot random"}…”
Sweepy bereaksi nonverbal terhadap suasana/keramaian (takjub/jahil/penasaran).

SCENE 2 (10–20 detik):
Ada momen lucu/konflik kecil khas traveling (salah arah, rebutan jajanan, photobomb).
Ending: punchline + cut tepat saat lucu.`);
}

/** ---------------- Auto Block Idea Engines ---------------- */

const DAILY_SITUATIONS = [
  "lagi setting kamera buat konten",
  "lagi kerja di laptop (deadline vibe)",
  "lagi bikin kopi",
  "lagi beres-beres meja biar rapi",
  "lagi jalan santai sambil vlog",
  "lagi cari angle foto/video",
];

const CONFLICT_TRIGGERS = [
  "Sweepy ngambil barang penting dan pura-pura polos",
  "Sweepy photobomb pas momen serius",
  "Sweepy ngatur-ngatur kayak ‘manager’",
  "Sweepy meniru gaya @hanz26/@hanzonk26 secara berlebihan",
  "Sweepy bikin ‘aturan’ aneh pakai gesture",
];

const NONVERBAL_REACTIONS = [
  "Sweepy mengangguk cepat lalu menunjuk-nunjuk (seolah paham)",
  "Sweepy geleng keras sambil chitter kecil",
  "Sweepy tatap kamera → tatap manusia → pose bangga",
  "Sweepy pura-pura serius: lipat tangan, angguk pelan, lalu jahil",
  "Sweepy menunjuk objek, lalu kabur pelan (teasing)",
];

const TRAVEL_CONFLICTS = [
  "Sweepy menunjuk arah yang salah dengan percaya diri",
  "Sweepy ngotot foto dulu (gesture stop) padahal manusia mau jalan",
  "Sweepy kepincut jajanan, lalu kabur kecil sambil peluk bungkusan",
  "Sweepy tiba-tiba ‘minta cameo’ dengan pose lucu di depan landmark",
  "Sweepy meniru guide lokal dengan gesture dramatis",
];

const PUNCHLINES = [
  "Ending: manusia pasrah sambil ketawa kecil, cut pas Sweepy angguk puas.",
  "Ending: freeze 0.5 detik tatap-tatapan, cut lucu.",
  "Ending: reveal singkat ternyata Sweepy yang rekam dari tadi.",
  "Ending: manusia: “Oke, kamu yang host.” cut pas Sweepy pose.",
];

function autoBlockCommon(mode: LocationMode) {
  const loc = pickLocation(mode);
  const cam = pick(CAMERA_STYLES);
  return `Setting: ${loc}.
Camera: ${cam}.
Tech: vertical 9:16, natural room tone, no cinematic exaggeration.
Uniqueness token: ${uniquenessToken()}`;
}

function autoBlockUGCDaily(preset: PresetKey, mode: LocationMode) {
  const situation = pick(DAILY_SITUATIONS);
  const trigger = pick(CONFLICT_TRIGGERS);
  const reaction = pick(NONVERBAL_REACTIONS);
  const ending = pick(PUNCHLINES);

  const cast =
    preset === "hanzonk26"
      ? "Cast: @hanzonk26 (human)."
      : preset === "mockey"
      ? "Cast: @mockey.mo (Sweepy) only, nonverbal. Allow off-camera human voice for context."
      : "Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.";

  return clampText(`
AUTO BLOCK (IDEA ENGINE — UGC DAILY):
${cast}
Nonverbal rule: Sweepy does NOT speak human language; gestures/expressions/chitter only. Subtitle only for human lines.
Base: ${situation}.
Conflict: ${trigger}.
Sweepy reaction: ${reaction}.
Timing: 0–2s hook → 2–10s escalation → 10–18s chaos peak → 18–20s punchline.
${ending}
${autoBlockCommon(mode)}
`);
}

function autoBlockHealth(preset: PresetKey, mode: LocationMode) {
  const topic = pick([
    "minum air lebih konsisten (trik simpel)",
    "napas 60 detik buat nurunin tegang",
    "jalan kaki 10 menit setelah makan",
    "sleep routine simpel (tanpa ribet)",
    "kurangi gula pelan-pelan",
  ]);

  const cast =
    preset === "hanzonk26"
      ? "Cast: @hanzonk26 (human)."
      : preset === "mockey"
      ? "Cast: @mockey.mo (Sweepy) only, nonverbal. Off-camera human voice can guide."
      : "Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.";

  return clampText(`
AUTO BLOCK (IDEA ENGINE — KESEHATAN):
${cast}
Rules: non-medical, no “menyembuhkan/pasti”, friendly like advice from a friend.
Nonverbal rule: Sweepy does NOT speak human language; gestures/expressions/chitter only. Subtitle only for human lines.
Topic: ${topic}.
Structure: 1 problem → 1 habit → 1–2 steps demo → reminder consult professional if needed.
${autoBlockCommon(mode)}
`);
}

function autoBlockStory(preset: PresetKey, mode: LocationMode) {
  const theme = pick([
    "kejadian kecil yang bikin sadar sesuatu",
    "momen random yang relate banget",
    "gue kira begini, ternyata begitu",
    "gagal lucu yang jadi pelajaran",
  ]);

  const cast =
    preset === "hanzonk26"
      ? "Cast: @hanzonk26 (human)."
      : preset === "mockey"
      ? "Cast: @mockey.mo (Sweepy) only, nonverbal. Off-camera human voice can narrate."
      : "Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.";

  return clampText(`
AUTO BLOCK (IDEA ENGINE — STORY):
${cast}
Nonverbal rule: Sweepy does NOT speak human language; gestures/expressions/chitter only. Subtitle only for human lines.
Theme: ${theme}.
Pacing: hook 2 detik → cerita singkat → twist kecil → closing hangat.
${autoBlockCommon(mode)}
`);
}

function autoBlockColabNusantara(mode: LocationMode) {
  const loc = pickLocation(mode);
  const travelConflict = pick(TRAVEL_CONFLICTS);
  const reaction = pick(NONVERBAL_REACTIONS);
  const ending = pick(PUNCHLINES);

  return clampText(`
AUTO BLOCK (IDEA ENGINE — COLAB NUSANTARA):
Cast: @hanz26 (human) + @mockey.mo (Sweepy) nonverbal.
STRICT: Sweepy understands human speech but NEVER speaks human language. Gestures/expressions/chitter only. Subtitle only for @hanz26.
Location: ${loc}.
Travel beat: walking/vlogging, candid crowd ambience, believable.
Conflict: ${travelConflict}.
Sweepy reaction: ${reaction}.
Timing: hook 0–2s mention place → 2–10s setup → 10–18s travel chaos → 18–20s punchline.
${ending}
Camera: UGC vertical 9:16, handheld natural, quick reaction cuts.
Uniqueness token: ${uniquenessToken()}
`);
}

function buildAutoBlock(niche: NicheKey, preset: PresetKey, mode: LocationMode) {
  switch (niche) {
    case "ugc_daily":
      return autoBlockUGCDaily(preset, mode);
    case "kesehatan":
      return autoBlockHealth(preset, mode);
    case "story":
      return autoBlockStory(preset, mode);
    case "colab_nusantara":
      return autoBlockColabNusantara(mode);
  }
}

/** ---------------- Caption & tags ---------------- */

function generateCaptionAndHashtags(niche: NicheKey, preset: PresetKey) {
  const baseCaption: Record<NicheKey, string[]> = {
    ugc_daily: ["Chaos kecil tapi relate 😂", "Konten receh, tapi nagih.", "Yang niat dikit… malah chaos."],
    kesehatan: ["Kebiasaan kecil, efeknya kerasa. 💧", "Pelan-pelan yang penting jalan.", "Reminder halus buat hari ini."],
    story: ["Cerita kecil, tapi ngena. 😅", "Ini kejadian receh… tapi relate.", "Kadang yang simpel itu paling nempel."],
    colab_nusantara: ["Jalan-jalan + duo chaos 🤣", "Nusantara vibes, chaosnya bonus.", "Travel santai… sampai Sweepy mulai aksi."],
  };

  const tagPool: Record<NicheKey, string[]> = {
    ugc_daily: ["ugc", "daily", "lucu", "reels", "fyp"],
    kesehatan: ["kesehatan", "sehat", "habit", "selfimprovement", "fyp"],
    story: ["storytime", "ugc", "relate", "kontenharian", "fyp"],
    colab_nusantara: ["nusantara", "jalanjalan", "travel", "lucu", "fyp"],
  };

  const presetTag =
    preset === "hanzonk26"
      ? ["hanzonk26"]
      : preset === "mockey"
      ? ["mockeymo", "sweepy"]
      : ["hanz26", "mockeymo", "sweepy"];

  const caption = pick(baseCaption[niche]);
  const tags = shuffle([...tagPool[niche], ...presetTag]).slice(0, 5).map((t) => `#${t}`);
  return { caption, hashtags: tags };
}

/** ---------------- UI ---------------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("ugc_daily");
  const [preset, setPreset] = useState<PresetKey>("colab");
  const [locationMode, setLocationMode] = useState<LocationMode>("indoor");

  const [promptUtama, setPromptUtama] = useState<string>("");
  const [autoBlock, setAutoBlock] = useState<string>("");
  const [extra, setExtra] = useState<string>("");

  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const lastAutoRef = useRef<string>("");

  const enforcedPreset = useMemo(() => enforcePreset(niche, preset), [niche, preset]);
  const allowedPresets = useMemo(() => allowedPresetsForNiche(niche), [niche]);

  const enforcedMode = useMemo(() => enforceLocationMode(niche, locationMode), [niche, locationMode]);
  const allowedModes = useMemo(() => allowedLocationModes(niche), [niche]);

  useEffect(() => {
    const s = safeParse<SavedPrompt[]>(localStorage.getItem(LS_SAVED), []);
    const h = safeParse<HistoryItem[]>(localStorage.getItem(LS_HISTORY), []);
    setSaved(s);
    setHistory(h);
  }, []);

  useEffect(() => {
    if (enforcedPreset !== preset) setPreset(enforcedPreset);
    if (enforcedMode !== locationMode) setLocationMode(enforcedMode);

    setPromptUtama((prev) =>
      prev.trim().length > 10 ? prev : defaultPromptUtama(niche, enforcePreset(niche, preset), enforceLocationMode(niche, locationMode))
    );

    const ch = generateCaptionAndHashtags(niche, enforcePreset(niche, preset));
    setCaption(ch.caption);
    setHashtags(ch.hashtags);

    setAutoBlock("");
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (preset !== enforcedPreset) setPreset(enforcedPreset);
  }, [enforcedPreset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (locationMode !== enforcedMode) setLocationMode(enforcedMode);
  }, [enforcedMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const merged = clampText(`
PROMPT UTAMA (MANUAL / DIRECTOR BRIEF):
${promptUtama.trim() || "(Isi Prompt Utama dulu)"}

AUTO BLOCK (FRESH IDEA ENGINE):
${autoBlock.trim() || "(Klik Auto Generate)"}

EXTRA (OPTIONAL):
${extra.trim() || "-"}

OUTPUT RULES:
- One coherent ~20s video, 2 scenes merged (0–10s and 10–20s).
- Keep continuity of location/outfit/characters between scenes.
- Keep one core conflict thread (no conflicting main gags).
- Sweepy (@mockey.mo) understands humans but NEVER speaks human language; nonverbal only.
- Vertical 9:16, UGC natural feel, authentic reactions.
`);
    setFinalPrompt(merged);
  }, [promptUtama, autoBlock, extra]);

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
      out = buildAutoBlock(niche, preset, locationMode);
      if (clampText(out) !== clampText(lastAutoRef.current)) break;
    }
    lastAutoRef.current = out;
    setAutoBlock(out);

    const item: HistoryItem = {
      id: uid("hist"),
      niche,
      preset: enforcePreset(niche, preset),
      locationMode: enforceLocationMode(niche, locationMode),
      autoBlock: out,
      createdAt: Date.now(),
    };
    persistHistory([item, ...history].slice(0, 140));
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
    const titleBase = `${NICHE_LABEL[niche]} • ${PRESET_LABEL[enforcePreset(niche, preset)]} • ${LOCATION_LABEL[enforceLocationMode(niche, locationMode)]}`;
    const ch = generateCaptionAndHashtags(niche, enforcePreset(niche, preset));

    const item: SavedPrompt = {
      id: uid("save"),
      title: `${titleBase} • ${new Date().toLocaleString("id-ID")}`,
      niche,
      preset: enforcePreset(niche, preset),
      locationMode: enforceLocationMode(niche, locationMode),
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

  /** ---------------- Pro Soft Blue Theme ---------------- */

  const shell =
    "min-h-screen bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(59,130,246,0.22),transparent),radial-gradient(900px_600px_at_80%_30%,rgba(99,102,241,0.16),transparent),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(15,23,42,1),rgba(2,6,23,1))] text-slate-100";

  const card =
    "border border-blue-900/40 rounded-2xl p-4 md:p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] bg-blue-950/35 backdrop-blur";
  const cardTitle = "text-sm font-semibold text-blue-200 tracking-wide";
  const subText = "text-xs text-blue-300/70";

  const btn =
    "px-3 py-2 rounded-xl border border-blue-900/40 hover:bg-blue-900/25 active:scale-[0.99] transition";
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

  return (
    <div className={shell}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Sora Lite — Nusantara & Daily Builder</h1>
              <p className="text-sm text-blue-300/60 mt-1">
                Preset hanya: <b className="text-blue-200">@hanzonk26</b>, <b className="text-blue-200">@mockey.mo</b> (nonverbal),
                dan <b className="text-blue-200">@hanz26 × @mockey.mo</b> (colab).
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className={pill}>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Manual Prompt Ready
              </span>
              <span className="text-xs text-blue-300/60">20 detik • 2 scene • 1 video utuh</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={pill}>
              Niche: <b className="text-blue-100">{NICHE_LABEL[niche]}</b>
            </span>
            <span className={pill}>
              Preset: <b className="text-blue-100">{PRESET_LABEL[enforcedPreset]}</b>
            </span>
            <span className={pill}>
              Lokasi: <b className="text-blue-100">{LOCATION_LABEL[enforcedMode]}</b>
            </span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="md:col-span-1 space-y-4">
            <section className={card}>
              <div className={cardTitle}>Niche</div>
              <div className={subText}>
                Colab Nusantara khusus preset colab. Lainnya bisa @hanzonk26 / @mockey.mo / colab.
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(["ugc_daily", "kesehatan", "story", "colab_nusantara"] as NicheKey[]).map((k) => (
                  <button
                    key={k}
                    className={`${btn} ${
                      niche === k ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""
                    }`}
                    onClick={() => setNiche(k)}
                  >
                    {NICHE_LABEL[k]}
                  </button>
                ))}
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Preset Karakter</div>
              <div className={subText}>Yang tidak cocok niche akan terkunci otomatis.</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(["hanzonk26", "mockey", "colab"] as PresetKey[]).map((k) => {
                  const allowed = allowedPresets.includes(k);
                  const selected = preset === k && enforcedPreset === k;
                  const locked = !allowed;

                  return (
                    <button
                      key={k}
                      className={`${btn} ${
                        selected ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""
                      } ${locked ? "opacity-40 cursor-not-allowed" : ""}`}
                      onClick={() => {
                        if (!locked) setPreset(k);
                      }}
                      title={locked ? "Preset ini tidak tersedia untuk niche ini" : PRESET_LABEL[k]}
                    >
                      <div className="flex items-center justify-between">
                        <span>{PRESET_LABEL[k]}</span>
                        {locked ? <span className="text-xs">🔒</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {enforcedPreset !== preset && (
                <div className="mt-2 text-xs text-amber-300">
                  Preset disesuaikan otomatis ke: <b>{PRESET_LABEL[enforcedPreset]}</b>
                </div>
              )}
            </section>

            <section className={card}>
              <div className={cardTitle}>Mode Lokasi</div>
              <div className={subText}>
                UGC/Kesehatan/Story: indoor/outdoor. Colab Nusantara: indoor/outdoor/nusantara.
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {allowedModes.map((m) => {
                  const selected = locationMode === m && enforcedMode === m;
                  return (
                    <button
                      key={m}
                      className={`${btn} ${
                        selected ? "border-blue-300/70 bg-blue-900/20 ring-1 ring-blue-400/25" : ""
                      }`}
                      onClick={() => setLocationMode(m)}
                    >
                      {LOCATION_LABEL[m]}
                    </button>
                  );
                })}
              </div>

              {enforcedMode !== locationMode && (
                <div className="mt-2 text-xs text-amber-300">
                  Mode lokasi disesuaikan otomatis ke: <b>{LOCATION_LABEL[enforcedMode]}</b>
                </div>
              )}
            </section>

            <section className={card}>
              <div className={cardTitle}>Auto Generate</div>
              <div className={subText}>
                Mengisi <b>Auto Block</b> (fresh idea). Prompt Utama tetap clean dan bisa kamu edit manual.
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className={btnPrimary} onClick={doAutoGenerate}>
                  Auto Generate
                </button>
                <button
                  className={btnGhost}
                  onClick={() => {
                    const ch = generateCaptionAndHashtags(niche, enforcePreset(niche, preset));
                    setCaption(ch.caption);
                    setHashtags(ch.hashtags);
                  }}
                >
                  Refresh Caption/Tags
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  className={`${btn} ${!canCopyAuto ? "opacity-40 cursor-not-allowed" : ""}`}
                  disabled={!canCopyAuto}
                  onClick={() => copyText(autoBlock)}
                >
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
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full border border-blue-900/40 text-blue-200 bg-blue-900/10"
                  >
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
                  <div className={cardTitle}>Prompt Utama (Manual / Clean & Detail)</div>
                  <div className={subText}>
                    Kamu bisa tulis manual bebas. Default template sudah 20 detik, 2 scene digabung.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={btn}
                    onClick={() =>
                      setPromptUtama(defaultPromptUtama(niche, enforcePreset(niche, preset), enforceLocationMode(niche, locationMode)))
                    }
                  >
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
                <span className={pill}>Sweepy nonverbal</span>
                <span className={pill}>Cut pas punchline</span>
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Extra (optional)</div>
              <div className={subText}>Tambahan: outfit, detail prop, style subtitle, dll.</div>

              <textarea
                className={`${textarea} min-h-[120px]`}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Contoh: outfit hoodie hitam, subtitle style minimal, close-up saat punchline..."
              />
            </section>

            <section className={card}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={cardTitle}>Final Prompt</div>
                  <div className={subText}>Prompt Utama + Auto Block + Extra + aturan output.</div>
                </div>

                <div className="flex gap-2">
                  <button
                    className={`${btn} ${!canCopyFinal ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={!canCopyFinal}
                    onClick={() => copyText(finalPrompt)}
                  >
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
              {/* Saved */}
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
                          {NICHE_LABEL[s.niche]} • {PRESET_LABEL[s.preset]} • {LOCATION_LABEL[s.locationMode]}
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
                              setPreset(s.preset);
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

              {/* History */}
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
                          {NICHE_LABEL[h.niche]} • {PRESET_LABEL[h.preset]} • {LOCATION_LABEL[h.locationMode]}
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
          Tips: Untuk Colab Nusantara, pilih mode <b>Nusantara</b> lalu Auto Generate berkali-kali sampai dapat konflik travel paling lucu.
        </footer>
      </div>
    </div>
  );
}
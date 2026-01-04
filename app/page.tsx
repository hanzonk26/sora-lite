"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite — CLEAN UI (Dropdowns) + CLEAN JSON OUTPUT (FULL REPLACE)
 *
 * ✅ CLEAN PAGE:
 * - Niche: dropdown
 * - Preset model: dropdown (auto-locked by niche; options disabled if not allowed)
 * - Location mode: dropdown (options depend on niche)
 *
 * ✅ CLEAN OUTPUT:
 * - Final output is a compact JSON prompt (copy-friendly)
 * - Saved JSON stores the cleaned JSON output
 *
 * ✅ LOCK RULES (unchanged):
 * - Personal niches => ONLY @hanzonk26
 * - Sweepy niche    => ONLY @mockey.mo (Sweepy) nonverbal
 * - Colab niche     => @hanz26 + Sweepy nonverbal
 *
 * Min Choi detail presets:
 * - ACTIVE for @hanzonk26 + Colab (@hanz26)
 * - DISABLED for Sweepy solo
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

  // ✅ store clean JSON output
  finalJson: any;
  finalJsonText: string;

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

// bump keys to avoid parsing older shape
const LS_SAVED = "soraLite.savedPrompts.locked.v3";
const LS_HISTORY = "soraLite.history.locked.v3";

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
  hanz26: "@hanz26 (Colab)",
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
  return "hanz26";
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
  return `RULE SWEEPY:
- Sweepy (@mockey.mo) paham bahasa manusia tapi TIDAK berbicara bahasa manusia.
- Respon hanya nonverbal: gesture, ekspresi, menunjuk, angguk/geleng, suara monyet kecil (chitter).
- Subtitle hanya untuk kalimat manusia (bukan Sweepy).`;
}

/** ---------------- Prompt Utama template (shorter, less noisy) ---------------- */

function defaultPromptUtama(niche: NicheKey, mode: LocationMode) {
  const loc = pickLocation(mode);
  const cam = pick(CAMERA);

  if (niche.startsWith("personal_")) {
    return clampText(`
Hook kuat 0–2 detik. Ending punchline/reveal bikin replay.
Lokasi: ${loc}.
Kamera: ${cam}.
SCENE 1: Situasi normal + konflik kecil muncul cepat.
SCENE 2: Konflik naik (masih believable) → punchline → cut pas lucu.
`);
  }

  if (niche === "sweepy_daily") {
    return clampText(`
Visual nonverbal, fokus gesture & ekspresi lucu (no dialogue Sweepy).
Lokasi: ${loc}.
Kamera: ${cam}.
SCENE 1: Aksi harian “pintar” tapi lucu (hook cepat).
SCENE 2: Makin absurd → punchline visual → cut pas lucu.
`);
  }

  // colab
  return clampText(`
Hook 0–2 detik. @hanz26 ngomong 1–2 kalimat singkat, Sweepy respon nonverbal.
Lokasi: ${loc}.
Kamera: ${cam}.
SCENE 1: Konflik kecil.
SCENE 2: Chaos naik → punchline → cut pas lucu.
`);
}

/** ---------------- Auto generators ---------------- */

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
  "Freeze 0.5 detik tatap-tatapan → cut lucu.",
  "Reveal singkat: ternyata Sweepy yang rekam dari tadi → cut.",
  "@hanz26: “Oke, kamu yang host.” → Sweepy pose → cut.",
  "@hanz26 ketawa pasrah → Sweepy angguk puas → cut.",
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
Base: ${pick(PERSONAL_DAILY_BASE)}.
Conflict: ${pick(PERSONAL_CONFLICT)}.
Timing: hook 0–2s → build 2–10s → payoff 10–18s → punchline 18–20s.
${autoCommon(mode)}
`);
}

function autoPersonalHealth(mode: LocationMode) {
  return clampText(`
Topic: ${pick(HEALTH_TOPICS)}.
Rules: non-medical, no “menyembuhkan/pasti”.
Structure: 1 problem → 1 habit → 1–2 steps demo → reminder consult professional.
${autoCommon(mode)}
`);
}

function autoPersonalStory(mode: LocationMode) {
  return clampText(`
Theme: ${pick(STORY_THEMES)}.
Pacing: hook 2s → story → twist kecil → closing hangat.
${autoCommon(mode)}
`);
}

function autoSweepyDaily(mode: LocationMode) {
  return clampText(`
${sweepyRule()}
Base: ${pick(SWEEPY_BASE)}.
Reaction: ${pick(SWEEPY_REACTIONS)}.
Timing: hook 0–2s → build 2–10s → absurd peak 10–18s → punchline 18–20s.
${autoCommon(mode)}
`);
}

function autoColab(mode: LocationMode) {
  const conflict = mode === "nusantara" ? pick(TRAVEL_CONFLICT) : pick(COLAB_CONFLICT);
  return clampText(`
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

/** ---------------- Min Choi (compact lines) ---------------- */

type MinChoiGroup =
  | "hair"
  | "outfit"
  | "location"
  | "action"
  | "lighting"
  | "camera"
  | "mood"
  | "quality";

type MinChoiItem = { id: string; label: string; text: string };

const MINCHOI_PRESETS: Record<MinChoiGroup, MinChoiItem[]> = {
  hair: [
    { id: "fade_clean", label: "Short clean fade", text: "short clean fade" },
    { id: "messy_texture", label: "Messy textured", text: "messy textured" },
    { id: "wavy_medium", label: "Medium wavy", text: "medium wavy" },
    { id: "slick_back", label: "Slick back", text: "modern slick back" },
    { id: "cap_covered", label: "Cap/covered", text: "covered by cap/hoodie" },
  ],
  outfit: [
    { id: "streetwear", label: "Streetwear", text: "casual streetwear, realistic folds" },
    { id: "smart_casual", label: "Smart casual", text: "smart casual, clean fit" },
    { id: "techwear", label: "Techwear", text: "minimalist techwear, matte materials" },
    { id: "sporty", label: "Sporty", text: "sporty activewear, natural movement" },
    { id: "formal", label: "Formal modern", text: "modern formal, tailored fit" },
  ],
  location: [
    { id: "room_minimal", label: "Room minimal", text: "modern minimal room" },
    { id: "cafe", label: "Cafe aesthetic", text: "aesthetic cafe, subtle bokeh" },
    { id: "studio", label: "Creator studio", text: "creator studio setup" },
    { id: "street", label: "Urban street", text: "urban street, city textures" },
    { id: "rooftop", label: "Rooftop", text: "rooftop with skyline" },
    { id: "neon", label: "Night neon", text: "night neon, wet reflections" },
  ],
  action: [
    { id: "talk", label: "Talk natural", text: "talking casually, natural gestures" },
    { id: "walk", label: "Walk", text: "slow confident walk" },
    { id: "sit", label: "Sit relaxed", text: "sitting relaxed, micro-expressions" },
    { id: "demo", label: "Demo item", text: "demonstrate item naturally" },
    { id: "react", label: "React funny", text: "subtle comedic reaction" },
  ],
  lighting: [
    { id: "daylight", label: "Soft daylight", text: "soft daylight, balanced shadows" },
    { id: "window", label: "Window side", text: "window side light, gentle falloff" },
    { id: "golden", label: "Golden hour", text: "golden hour glow" },
    { id: "softbox", label: "Indoor soft", text: "indoor soft light, clean exposure" },
    { id: "night", label: "Night ambient", text: "night ambient practical lights" },
  ],
  camera: [
    { id: "35mm", label: "35mm cine", text: "35mm, shallow DOF, smooth movement" },
    { id: "50mm", label: "50mm portrait", text: "50mm, creamy bokeh" },
    { id: "iphone", label: "iPhone UGC", text: "iPhone-style UGC, stabilized" },
    { id: "tripod", label: "Tripod", text: "tripod static, clean framing" },
    { id: "handheld", label: "Handheld smooth", text: "smooth handheld, subtle motion" },
  ],
  mood: [
    { id: "premium", label: "Clean premium", text: "clean & premium color grading" },
    { id: "warm", label: "Warm friendly", text: "warm, natural tones" },
    { id: "dramatic", label: "Dramatic cine", text: "dramatic cinematic contrast" },
    { id: "calm", label: "Calm minimal", text: "calm minimal vibe" },
    { id: "fun", label: "Fun comedy", text: "fun comedic timing" },
  ],
  quality: [
    { id: "lock", label: "Quality lock", text: "ultra-realistic, natural movement, looks like real footage (no distortion)" },
  ],
};

const MINCHOI_DEFAULT: Record<PresetKey, Partial<Record<MinChoiGroup, string>>> = {
  hanzonk26: {
    hair: "fade_clean",
    outfit: "techwear",
    location: "studio",
    action: "talk",
    lighting: "window",
    camera: "35mm",
    mood: "premium",
    quality: "lock",
  },
  hanz26: {
    hair: "fade_clean",
    outfit: "streetwear",
    location: "cafe",
    action: "react",
    lighting: "softbox",
    camera: "35mm",
    mood: "fun",
    quality: "lock",
  },
  mockey: {}, // not used
};

function getMinChoiLabel(group: MinChoiGroup, id?: string) {
  if (!id) return "";
  const item = MINCHOI_PRESETS[group].find((x) => x.id === id);
  return item?.text || "";
}

/** ---------------- CLEANERS -> CLEAN JSON ---------------- */

function compressAutoBlock(s: string) {
  const lines = s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((l) => !l.toLowerCase().includes("uniqueness token"))
    .filter((l) => !l.toLowerCase().startsWith("format:"))
    .filter((l) => !l.toLowerCase().startsWith("camera:"))
    .filter((l) => !l.toLowerCase().startsWith("location:"))
    .filter((l) => !l.toLowerCase().startsWith("audio:"))
    .filter((l) => !l.toLowerCase().startsWith("cast:"));

  // keep only key lines
  const keys = ["Base:", "Conflict:", "Topic:", "Theme:", "Reaction:", "Punchline:", "Timing:", "Rules:", "Structure:"];
  const picked = lines.filter((l) => keys.some((k) => l.startsWith(k)));
  return clampText((picked.length ? picked : lines.slice(0, 6)).join("\n"));
}

function compressPrompt(s: string) {
  const lines = s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const keepStarts = ["Visual", "Hook", "Ending", "Lokasi:", "Kamera:", "SCENE"];
  const picked = lines.filter((l) => keepStarts.some((k) => l.toLowerCase().startsWith(k.toLowerCase())));
  return clampText((picked.length ? picked : lines.slice(0, 6)).join("\n"));
}

function buildRules(niche: NicheKey) {
  const isPersonal = niche.startsWith("personal_");
  const isSweepy = niche === "sweepy_daily";
  const isColab = niche === "colab";

  const out: string[] = [];
  if (isPersonal) out.push("Cast: ONLY @hanzonk26.");
  if (isSweepy) {
    out.push("Cast: ONLY Sweepy (@mockey.mo).");
    out.push("Sweepy: nonverbal only (no human speech).");
  }
  if (isColab) {
    out.push("Cast: @hanz26 + Sweepy (@mockey.mo).");
    out.push("Sweepy: nonverbal only (no human speech).");
  }
  out.push("Format: vertical 9:16, ~20s, 2 scenes merged, continuity ON.");
  return out;
}

function buildMinChoiObject(
  enabled: boolean,
  sel: Partial<Record<MinChoiGroup, string>>
) {
  if (!enabled) return null;

  const obj = {
    hair: getMinChoiLabel("hair", sel.hair),
    outfit: getMinChoiLabel("outfit", sel.outfit),
    location: getMinChoiLabel("location", sel.location),
    action: getMinChoiLabel("action", sel.action),
    lighting: getMinChoiLabel("lighting", sel.lighting),
    camera: getMinChoiLabel("camera", sel.camera),
    mood: getMinChoiLabel("mood", sel.mood),
    quality: getMinChoiLabel("quality", sel.quality),
  };

  // remove empty values
  const cleaned: Record<string, string> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v && v.trim()) cleaned[k] = v.trim();
  });

  return Object.keys(cleaned).length ? cleaned : null;
}

/** ---------------- UI ---------------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("personal_daily");
  const [preset, setPreset] = useState<PresetKey>("hanzonk26");
  const [locationMode, setLocationMode] = useState<LocationMode>("indoor");

  const [promptUtama, setPromptUtama] = useState("");
  const [autoBlock, setAutoBlock] = useState("");
  const [extra, setExtra] = useState("");

  const [minChoiSel, setMinChoiSel] = useState<Partial<Record<MinChoiGroup, string>>>({});

  const [finalJson, setFinalJson] = useState<any>(null);
  const [finalJsonText, setFinalJsonText] = useState("");

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastAutoRef = useRef("");

  const lockedPreset = useMemo(() => enforcedPreset(niche), [niche]);
  const allowedModes = useMemo(() => allowedLocationModes(niche), [niche]);
  const lockedMode = useMemo(() => enforceLocationMode(niche, locationMode), [niche, locationMode]);

  const minChoiEnabled = useMemo(
    () => lockedPreset === "hanzonk26" || lockedPreset === "hanz26",
    [lockedPreset]
  );

  useEffect(() => {
    setSaved(safeParse(localStorage.getItem(LS_SAVED), []));
    setHistory(safeParse(localStorage.getItem(LS_HISTORY), []));
  }, []);

  useEffect(() => {
    // enforce locks
    if (preset !== lockedPreset) setPreset(lockedPreset);
    if (locationMode !== lockedMode) setLocationMode(lockedMode);

    // default prompt template
    setPromptUtama((prev) => (prev.trim().length > 10 ? prev : defaultPromptUtama(niche, lockedMode)));

    // caption/tags
    const ch = captionTags(niche);
    setCaption(ch.caption);
    setHashtags(ch.hashtags);

    // init Min Choi defaults only if enabled
    if (minChoiEnabled) {
      setMinChoiSel((prev) => (Object.keys(prev).length ? prev : (MINCHOI_DEFAULT[lockedPreset] || {})));
    } else {
      setMinChoiSel({});
    }

    setAutoBlock("");
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // build clean JSON prompt
    const promptClean = compressPrompt(promptUtama) || "(Isi Prompt Utama dulu)";
    const autoClean = autoBlock.trim() ? compressAutoBlock(autoBlock) : "";
    const minChoiObj = buildMinChoiObject(minChoiEnabled, minChoiSel);

    const out = {
      preset: lockedPreset,
      presetLabel: PRESET_LABEL[lockedPreset],
      niche,
      nicheLabel: NICHE_LABEL[niche],
      locationMode: lockedMode,
      locationModeLabel: LOCATION_LABEL[lockedMode],

      prompt: promptClean,
      auto: autoClean || null,

      // keep extra manual small; if empty -> null
      extra: extra.trim() ? clampText(extra).slice(0, 800) : null,

      // only when enabled
      minChoi: minChoiObj,

      rules: buildRules(niche),

      // convenience content
      caption,
      hashtags,
    };

    setFinalJson(out);
    setFinalJsonText(JSON.stringify(out, null, 2));
  }, [
    promptUtama,
    autoBlock,
    extra,
    niche,
    lockedMode,
    lockedPreset,
    minChoiEnabled,
    minChoiSel,
    caption,
    hashtags,
  ]);

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
    const item: SavedPrompt = {
      id: uid("save"),
      title: `${NICHE_LABEL[niche]} • ${LOCATION_LABEL[lockedMode]} • ${new Date().toLocaleString("id-ID")}`,
      niche,
      preset: lockedPreset,
      locationMode: lockedMode,
      promptUtama,
      autoBlock,
      extra,
      finalJson,
      finalJsonText,
      caption,
      hashtags,
      createdAt: Date.now(),
    };
    persistSaved([item, ...saved].slice(0, 300));
  }

  function removeSaved(id: string) {
    persistSaved(saved.filter((x) => x.id !== id));
  }

  function clearHistory() {
    persistHistory([]);
  }

  // --- UI theme ---
  const shell =
    "min-h-screen bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(59,130,246,0.22),transparent),radial-gradient(900px_600px_at_80%_30%,rgba(99,102,241,0.16),transparent),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(15,23,42,1),rgba(2,6,23,1))] text-slate-100";
  const card =
    "border border-blue-900/40 rounded-2xl p-4 md:p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] bg-blue-950/35 backdrop-blur";
  const cardTitle = "text-sm font-semibold text-blue-200 tracking-wide";
  const subText = "text-xs text-blue-300/70";
  const btn = "px-3 py-2 rounded-xl border border-blue-900/40 hover:bg-blue-900/25 active:scale-[0.99] transition";
  const btnPrimary =
    "px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99] transition shadow-md shadow-blue-500/20";
  const textarea =
    "mt-3 w-full rounded-xl border border-blue-900/40 bg-blue-950/40 p-3 text-sm text-slate-100 outline-none focus:border-blue-400 placeholder:text-blue-300/50";
  const preBox =
    "mt-3 whitespace-pre-wrap rounded-xl border border-blue-900/40 p-3 text-sm bg-blue-950/40 text-slate-100";
  const smallPre =
    "mt-3 whitespace-pre-wrap rounded-xl border border-blue-900/40 p-3 text-xs bg-blue-950/25 text-slate-100";
  const pill =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-900/40 bg-blue-950/30 text-xs text-blue-200";
  const selectCls =
    "mt-2 w-full rounded-xl border border-blue-900/40 bg-blue-950/40 p-2 text-sm text-slate-100 outline-none focus:border-blue-400";

  const canCopyFinal = finalJsonText.trim().length > 0;

  // dropdown options
  const nicheOptions: { key: NicheKey; label: string }[] = [
    { key: "personal_daily", label: "Personal — Daily" },
    { key: "personal_health", label: "Personal — Kesehatan" },
    { key: "personal_story", label: "Personal — Story" },
    { key: "sweepy_daily", label: "Sweepy — Daily" },
    { key: "colab", label: "Colab — @hanz26 × Sweepy" },
  ];

  const presetOptions: { key: PresetKey; label: string; enabled: boolean }[] = [
    { key: "hanzonk26", label: PRESET_LABEL.hanzonk26, enabled: lockedPreset === "hanzonk26" },
    { key: "mockey", label: PRESET_LABEL.mockey, enabled: lockedPreset === "mockey" },
    { key: "hanz26", label: PRESET_LABEL.hanz26, enabled: lockedPreset === "hanz26" },
  ];

  return (
    <div className={shell}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Sora Lite — Clean UI + Clean JSON</h1>
              <p className="text-sm text-blue-300/60 mt-1">
                Niche & Preset dropdown • Output: compact JSON prompt
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className={pill}>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Cast Locked
              </span>
              <span className="text-xs text-blue-300/60">~20 detik • 2 scene • 1 video</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={pill}>
              Niche: <b className="text-blue-100">{NICHE_LABEL[niche]}</b>
            </span>
            <span className={pill}>
              Preset: <b className="text-blue-100">{PRESET_LABEL[lockedPreset]}</b>
            </span>
            <span className={pill}>
              Mode: <b className="text-blue-100">{LOCATION_LABEL[lockedMode]}</b>
            </span>
            <span className={pill}>
              Min Choi: <b className="text-blue-100">{minChoiEnabled ? "ON" : "OFF"}</b>
            </span>
          </div>
        </header>

        {/* Clean Controls */}
        <section className={card}>
          <div className="grid md:grid-cols-3 gap-3">
            {/* Niche dropdown */}
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Niche</div>
              <div className={subText}>Pilih niche (preset terkunci otomatis)</div>
              <select className={selectCls} value={niche} onChange={(e) => setNiche(e.target.value as NicheKey)}>
                {nicheOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preset dropdown (locked, options disabled) */}
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Preset Model</div>
              <div className={subText}>Dropdown tetap ada, tapi dikunci oleh niche</div>
              <select className={selectCls} value={preset} onChange={(e) => setPreset(e.target.value as PresetKey)}>
                {presetOptions.map((p) => (
                  <option key={p.key} value={p.key} disabled={!p.enabled}>
                    {p.label} {!p.enabled ? " (locked)" : ""}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-blue-300/70">
                Aktif: <b className="text-blue-100">{PRESET_LABEL[lockedPreset]}</b>
              </div>
            </div>

            {/* Location mode dropdown */}
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Location Mode</div>
              <div className={subText}>Pilihan menyesuaikan niche</div>
              <select
                className={selectCls}
                value={locationMode}
                onChange={(e) => setLocationMode(e.target.value as LocationMode)}
              >
                {allowedModes.map((m) => (
                  <option key={m} value={m}>
                    {LOCATION_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Prompt Utama */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Prompt Utama (Manual)</div>
              <div className={subText}>Template pendek otomatis (lebih clean)</div>
            </div>
            <button className={btn} onClick={() => setPromptUtama(defaultPromptUtama(niche, lockedMode))}>
              Reset Template
            </button>
          </div>

          <textarea
            className={textarea}
            value={promptUtama}
            onChange={(e) => setPromptUtama(e.target.value)}
            rows={6}
            placeholder="Tulis prompt utama di sini…"
          />
        </section>

        {/* Auto Block */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Auto Block</div>
              <div className={subText}>Klik untuk random (tetap patuh aturan cast)</div>
            </div>
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={doAutoGenerate}>
                Auto Generate
              </button>
              <button className={btn} onClick={() => copyText(autoBlock)} disabled={!autoBlock.trim()}>
                Copy Auto
              </button>
            </div>
          </div>

          <pre className={preBox}>{autoBlock.trim() || "(Klik Auto Generate)"}</pre>
        </section>

        {/* Min Choi (only for @hanzonk26 + @hanz26) */}
        {minChoiEnabled && (
          <section className={card}>
            <div>
              <div className={cardTitle}>Min Choi Detail (Optional)</div>
              <div className={subText}>Dipakai untuk Personal + Colab. Sweepy solo: OFF.</div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(
                ["hair", "outfit", "location", "action", "lighting", "camera", "mood", "quality"] as MinChoiGroup[]
              ).map((group) => (
                <label key={group} className="text-xs text-blue-200">
                  {group}
                  <select
                    className={selectCls}
                    value={minChoiSel[group] || ""}
                    onChange={(e) =>
                      setMinChoiSel((prev) => ({
                        ...prev,
                        [group]: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">(none)</option>
                    {MINCHOI_PRESETS[group].map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                className={btn}
                onClick={() => setMinChoiSel(MINCHOI_DEFAULT[lockedPreset] || {})}
                title="Reset ke default preset"
              >
                Reset Min Choi Defaults
              </button>
            </div>
          </section>
        )}

        {/* Extra manual */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Extra (Manual, optional)</div>
              <div className={subText}>Akan masuk ke JSON sebagai extra (ringkas)</div>
            </div>
            <button className={btn} onClick={() => setExtra("")}>
              Clear
            </button>
          </div>

          <textarea
            className={textarea}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={4}
            placeholder="Tambahan singkat… (misal overlay text, pacing, dll)"
          />
        </section>

        {/* FINAL JSON OUTPUT */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Final JSON Prompt (Clean)</div>
              <div className={subText}>Copy ini ke tools / simpan. Ini sudah rapi & minim noise.</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className={btnPrimary} disabled={!canCopyFinal} onClick={() => copyText(finalJsonText)}>
                Copy Final JSON
              </button>
              <button className={btn} onClick={doSave}>
                Save
              </button>
            </div>
          </div>

          <pre className={preBox}>{finalJsonText}</pre>
        </section>

        {/* Caption & Hashtags quick copy */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Caption + Hashtags</div>
              <div className={subText}>Sudah ikut masuk JSON juga</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className={btn} onClick={() => copyText(caption)}>
                Copy Caption
              </button>
              <button className={btn} onClick={() => copyText(hashtags.join(" "))}>
                Copy Hashtags
              </button>
            </div>
          </div>

          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className="text-xs text-blue-200 font-semibold">Caption</div>
              <div className="mt-2 text-sm text-blue-100">{caption}</div>
            </div>
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className="text-xs text-blue-200 font-semibold">Hashtags</div>
              <div className="mt-2 text-sm text-blue-100">{hashtags.join(" ")}</div>
            </div>
          </div>
        </section>

        {/* Saved & History */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className={cardTitle}>Saved</div>
                <div className={subText}>Menyimpan JSON output yang sudah clean</div>
              </div>
              <button className={btn} onClick={() => copyText(JSON.stringify(saved, null, 2))} disabled={saved.length === 0}>
                Copy JSON Saved
              </button>
            </div>

            {saved.length === 0 ? (
              <div className="mt-3 text-sm text-blue-300/70">Belum ada yang disimpan.</div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[520px] overflow-auto pr-1">
                {saved.map((s) => (
                  <div key={s.id} className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-blue-100">{s.title}</div>
                        <div className="text-xs text-blue-300/70 mt-1">
                          {NICHE_LABEL[s.niche]} • {PRESET_LABEL[s.preset]} • {LOCATION_LABEL[s.locationMode]}
                        </div>
                      </div>
                      <button className={btn} onClick={() => removeSaved(s.id)} title="Hapus">
                        Delete
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button className={btnPrimary} onClick={() => copyText(s.finalJsonText)}>
                        Copy Final JSON
                      </button>
                      <button className={btn} onClick={() => copyText(s.caption)}>
                        Copy Caption
                      </button>
                      <button className={btn} onClick={() => copyText(s.hashtags.join(" "))}>
                        Copy Tags
                      </button>
                    </div>

                    <details className="mt-2">
                      <summary className="text-xs text-blue-200 cursor-pointer select-none">Preview JSON</summary>
                      <pre className={smallPre}>{s.finalJsonText}</pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className={cardTitle}>History (Auto)</div>
                <div className={subText}>Menyimpan auto block raw untuk referensi</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className={btn} onClick={clearHistory} disabled={history.length === 0}>
                  Clear
                </button>
                <button className={btn} onClick={() => copyText(JSON.stringify(history, null, 2))} disabled={history.length === 0}>
                  Copy JSON History
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="mt-3 text-sm text-blue-300/70">Belum ada history. Klik Auto Generate.</div>
            ) : (
              <div className="mt-3 space-y-3 max-h-[520px] overflow-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
                    <div className="text-xs text-blue-300/70">
                      {NICHE_LABEL[h.niche]} • {PRESET_LABEL[h.preset]} • {LOCATION_LABEL[h.locationMode]}
                    </div>
                    <pre className={smallPre}>{h.autoBlock}</pre>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button className={btnPrimary} onClick={() => copyText(h.autoBlock)}>
                        Copy Auto
                      </button>
                      <button className={btn} onClick={() => setAutoBlock(h.autoBlock)}>
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-blue-300/50">
          Sora Lite — Clean UI (dropdowns) • Clean JSON output • Locked Cast enforced
        </footer>
      </div>
    </div>
  );
}
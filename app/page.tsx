"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite — STRICT LOCKED CAST + Min Choi Modular Preset (FULL REPLACE)
 *
 * LOCK RULES (as requested):
 * - Preset @hanzonk26 => ONLY Niche Personal (@hanzonk26)
 * - Preset Sweepy (@mockey.mo) => ONLY Niche Sweepy
 * - Preset @hanz26 => ONLY Niche Colab (with Sweepy nonverbal)
 *
 * Min Choi detail presets:
 * - ACTIVE for @hanzonk26 (Personal niches) + Colab (@hanz26 × Sweepy)
 * - DISABLED for Sweepy solo (standard only, as before)
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

/** ---------------- Min Choi Preset Pack (ONLY for hanzonk26 + colab/hanz26) ---------------- */

type MinChoiGroup =
  | "hair"
  | "outfit"
  | "location"
  | "action"
  | "lighting"
  | "camera"
  | "mood"
  | "qualityLock";

type MinChoiItem = { id: string; label: string; text: string };

const MINCHOI_PRESETS: Record<MinChoiGroup, MinChoiItem[]> = {
  hair: [
    { id: "fade_clean", label: "Short clean fade", text: "Hair: short clean fade, realistic hair texture, subtle natural hair movement." },
    { id: "messy_texture", label: "Messy textured", text: "Hair: messy textured, natural strands, realistic volume, subtle motion." },
    { id: "wavy_medium", label: "Medium wavy", text: "Hair: medium wavy hair, soft natural movement, realistic shine." },
    { id: "slick_back", label: "Slick back modern", text: "Hair: modern slick back style, clean silhouette, realistic texture." },
    { id: "cap_covered", label: "Cap / covered", text: "Hair: mostly covered by cap/hoodie, minimal hair visible, natural look." },
  ],
  outfit: [
    { id: "streetwear", label: "Casual streetwear", text: "Outfit: casual streetwear, layered tee/jacket, realistic fabric folds and stitching." },
    { id: "smart_casual", label: "Smart casual", text: "Outfit: smart casual (shirt + neat outer), clean fit, premium textile texture." },
    { id: "techwear", label: "Minimalist techwear", text: "Outfit: minimalist techwear, matte materials, functional silhouette, realistic seams." },
    { id: "sporty", label: "Sporty activewear", text: "Outfit: sporty activewear, breathable fabric texture, natural stretch and movement." },
    { id: "formal_modern", label: "Formal modern", text: "Outfit: modern formal, tailored fit, realistic cloth drape and highlights." },
  ],
  location: [
    { id: "room_minimal", label: "Indoor: modern minimal room", text: "Location: modern minimal indoor room, clean background, realistic depth and scale." },
    { id: "cafe_aesthetic", label: "Indoor: cafe aesthetic", text: "Location: modern aesthetic cafe, warm details, subtle background activity, realistic bokeh." },
    { id: "studio_creator", label: "Indoor: creator studio", text: "Location: creator studio setup, soft practical lights, tidy props, realistic environment." },
    { id: "street_urban", label: "Outdoor: urban street", text: "Location: urban street, concrete + city textures, natural passersby blur, believable scale." },
    { id: "rooftop_city", label: "Outdoor: rooftop city view", text: "Location: rooftop with city skyline, realistic perspective and depth." },
    { id: "night_neon", label: "Outdoor: night neon", text: "Location: night city with neon signage, wet reflections, realistic glow and contrast." },
  ],
  action: [
    { id: "talk_camera", label: "Talk: casual to camera", text: "Action: talking casually to camera, natural facial expressions, subtle hand gestures, non-posed." },
    { id: "walk_confident", label: "Walk: slow confident", text: "Action: slow confident walking, relaxed shoulders, natural gait, believable motion." },
    { id: "sit_relaxed", label: "Sit: relaxed", text: "Action: sitting relaxed, realistic micro-expressions, natural posture." },
    { id: "show_product", label: "Show: demonstrate item", text: "Action: demonstrating an item naturally, close-up moments, realistic grip and hand motion." },
    { id: "react_funny", label: "React: subtle comedic", text: "Action: subtle comedic reaction (small pause, side glance, smirk), timing feels natural." },
  ],
  lighting: [
    { id: "soft_daylight", label: "Soft daylight", text: "Lighting: soft natural daylight, balanced highlights and shadows, realistic light direction." },
    { id: "window_side", label: "Window side light", text: "Lighting: window side lighting, gentle falloff, cinematic contrast, natural skin tones." },
    { id: "golden_hour", label: "Golden hour", text: "Lighting: golden hour sunlight, warm highlights, soft shadows, cinematic glow." },
    { id: "indoor_softbox", label: "Indoor cinematic soft", text: "Lighting: indoor cinematic soft lighting (softbox feel), clean exposure, premium look." },
    { id: "night_ambient", label: "Night ambient", text: "Lighting: night ambient practical lights, realistic reflections, controlled contrast." },
  ],
  camera: [
    { id: "35mm_cine", label: "Lens: 35mm cinematic", text: "Camera: shot on 35mm lens, shallow depth of field, smooth cinematic movement, professional stabilization." },
    { id: "50mm_portrait", label: "Lens: 50mm portrait", text: "Camera: shot on 50mm lens, creamy bokeh, steady framing, premium portrait feel." },
    { id: "iphone_ugc", label: "iPhone-style UGC", text: "Camera: iPhone-style cinematic UGC, natural handheld but stabilized, realistic exposure." },
    { id: "tripod_clean", label: "Tripod clean", text: "Camera: static tripod shot, clean framing, minimal shake, crisp focus." },
    { id: "handheld_smooth", label: "Handheld smooth", text: "Camera: smooth handheld camera, subtle natural motion, cinematic pacing, no jitter." },
  ],
  mood: [
    { id: "clean_premium", label: "Clean & premium", text: "Mood: clean and premium, professional cinematic color grading, high detail, looks like real footage." },
    { id: "warm_friendly", label: "Warm & friendly", text: "Mood: warm and friendly, natural tones, realistic skin texture, looks authentic." },
    { id: "dramatic_cine", label: "Dramatic cinematic", text: "Mood: dramatic cinematic tone, controlled contrast, film-like grading, realistic textures." },
    { id: "calm_minimal", label: "Calm & minimal", text: "Mood: calm minimal vibe, uncluttered composition, gentle grading, premium realism." },
    { id: "fun_comedy", label: "Fun comedic", text: "Mood: fun comedic timing, subtle punchline pacing, still realistic and cinematic." },
  ],
  qualityLock: [
    {
      id: "minchoi_lock",
      label: "Min Choi Quality Lock",
      text:
        "Ultra-realistic, natural movement, realistic textures, no distortion, no deformed hands, no uncanny face. Professional cinematic color grading. Looks like real footage, not AI generated.",
    },
  ],
};

const MINCHOI_DEFAULT_BY_PRESET: Partial<Record<PresetKey, Record<MinChoiGroup, string>>> = {
  hanzonk26: {
    hair: "fade_clean",
    outfit: "techwear",
    location: "studio_creator",
    action: "talk_camera",
    lighting: "window_side",
    camera: "35mm_cine",
    mood: "clean_premium",
    qualityLock: "minchoi_lock",
  },
  hanz26: {
    hair: "fade_clean",
    outfit: "streetwear",
    location: "cafe_aesthetic",
    action: "react_funny",
    lighting: "indoor_softbox",
    camera: "35mm_cine",
    mood: "fun_comedy",
    qualityLock: "minchoi_lock",
  },
  // Sweepy solo = standard => no MinChoi defaults
};

const MINCHOI_ORDER: MinChoiGroup[] = [
  "hair",
  "outfit",
  "location",
  "action",
  "lighting",
  "camera",
  "mood",
  "qualityLock",
];

function getMinChoiText(group: MinChoiGroup, id?: string) {
  if (!id) return "";
  const item = MINCHOI_PRESETS[group]?.find((x) => x.id === id);
  return item?.text?.trim() || "";
}

function buildMinChoiExtra(sel: Partial<Record<MinChoiGroup, string>>) {
  const lines: string[] = [];
  for (const g of MINCHOI_ORDER) {
    const t = getMinChoiText(g, sel[g]);
    if (t) lines.push(t);
  }
  return clampText(lines.join("\n"));
}

/** ---------------- UI ---------------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("personal_daily");
  const [preset, setPreset] = useState<PresetKey>("hanzonk26");
  const [locationMode, setLocationMode] = useState<LocationMode>("indoor");

  const [promptUtama, setPromptUtama] = useState("");
  const [autoBlock, setAutoBlock] = useState("");
  const [extra, setExtra] = useState("");

  // Min Choi selections (only for hanzonk26 + colab/hanz26)
  const [minChoiSel, setMinChoiSel] = useState<Partial<Record<MinChoiGroup, string>>>({});

  const [finalPrompt, setFinalPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastAutoRef = useRef("");

  const lockedPreset = useMemo(() => enforcedPreset(niche), [niche]);
  const allowedModes = useMemo(() => allowedLocationModes(niche), [niche]);
  const lockedMode = useMemo(() => enforceLocationMode(niche, locationMode), [niche, locationMode]);

  const isMinChoi = useMemo(
    () => lockedPreset === "hanzonk26" || lockedPreset === "hanz26",
    [lockedPreset]
  );

  const minChoiExtra = useMemo(() => {
    if (!isMinChoi) return "";
    return buildMinChoiExtra(minChoiSel);
  }, [isMinChoi, minChoiSel]);

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

    // init Min Choi defaults when applicable
    const defaults = MINCHOI_DEFAULT_BY_PRESET[lockedPreset];
    if (defaults && (lockedPreset === "hanzonk26" || lockedPreset === "hanz26")) {
      setMinChoiSel(defaults);
    } else {
      setMinChoiSel({});
    }

    setAutoBlock("");
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const combinedExtra = clampText([minChoiExtra, extra].filter(Boolean).join("\n\n"));

    const merged = clampText(`
PRESET (LOCKED): ${PRESET_LABEL[lockedPreset]}
NICHE: ${NICHE_LABEL[niche]}
LOCATION MODE: ${LOCATION_LABEL[lockedMode]}

PROMPT UTAMA (MANUAL):
${promptUtama.trim() || "(Isi Prompt Utama dulu)"}

AUTO BLOCK (FRESH):
${autoBlock.trim() || "(Klik Auto Generate)"}

EXTRA (OPTIONAL):
${combinedExtra || "-"}

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
  }, [promptUtama, autoBlock, extra, minChoiExtra, niche, lockedMode, lockedPreset]);

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
              <h1 className="text-2xl md:text-3xl font-semibold">
                Sora Lite — Strict Locked Cast <span className="text-blue-300/60">+ Min Choi Detail</span>
              </h1>
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
              Location mode: <b className="text-blue-100">{LOCATION_LABEL[lockedMode]}</b>
            </span>
            {isMinChoi ? (
              <span className={pill}>
                Min Choi: <b className="text-blue-100">ON</b>
              </span>
            ) : (
              <span className={pill}>
                Min Choi: <b className="text-blue-100">OFF</b> <span className="text-blue-300/70">(Sweepy standar)</span>
              </span>
            )}
          </div>
        </header>

        {/* Controls */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Niche</div>
              <div className={subText}>Preset terkunci otomatis sesuai niche</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NICHE_LABEL) as NicheKey[]).map((k) => (
                <button
                  key={k}
                  className={k === niche ? btnPrimary : btnGhost}
                  onClick={() => setNiche(k)}
                >
                  {NICHE_LABEL[k].split(" — ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Niche Detail</div>
              <div className="mt-2 text-sm text-blue-100">{NICHE_LABEL[niche]}</div>
              <div className="mt-1 text-xs text-blue-300/70">
                {niche === "colab"
                  ? "Colab punya mode Nusantara (random Indonesia)."
                  : "Personal/Sweepy hanya indoor/outdoor."}
              </div>
            </div>

            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Preset (Locked)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {presetButtons.map((p) => (
                  <button
                    key={p.key}
                    className={p.locked ? "opacity-60 cursor-not-allowed " + btn : btnPrimary}
                    disabled={p.locked}
                    title={p.locked ? p.reason : "Aktif"}
                    onClick={() => setPreset(p.key)}
                  >
                    {PRESET_LABEL[p.key]}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-blue-300/70">
                Aktif: <b className="text-blue-100">{PRESET_LABEL[lockedPreset]}</b>
              </div>
            </div>

            <div className="rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className={cardTitle}>Location Mode</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allowedModes.map((m) => (
                  <button
                    key={m}
                    className={m === lockedMode ? btnPrimary : btnGhost}
                    onClick={() => setLocationMode(m)}
                  >
                    {LOCATION_LABEL[m]}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-blue-300/70">
                Mode tersedia: {allowedModes.map((m) => LOCATION_LABEL[m]).join(", ")}
              </div>
            </div>
          </div>
        </section>

        {/* Prompt Utama */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Prompt Utama (Manual)</div>
              <div className={subText}>Template auto akan muncul kalau masih kosong</div>
            </div>
            <button
              className={btn}
              onClick={() => setPromptUtama(defaultPromptUtama(niche, lockedMode))}
              title="Reset template prompt utama"
            >
              Reset Template
            </button>
          </div>

          <textarea
            className={textarea}
            value={promptUtama}
            onChange={(e) => setPromptUtama(e.target.value)}
            rows={10}
            placeholder="Tulis prompt utama kamu di sini…"
          />
        </section>

        {/* Auto Block */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Auto Block (Fresh)</div>
              <div className={subText}>Klik untuk random, tapi tetap patuh lock rules</div>
            </div>
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={doAutoGenerate}>
                Auto Generate
              </button>
              <button className={btn} disabled={!canCopyAuto} onClick={() => copyText(autoBlock)}>
                Copy Auto
              </button>
            </div>
          </div>

          <pre className={preBox}>{autoBlock.trim() || "(Klik Auto Generate)"}</pre>
        </section>

        {/* Extra */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Extra (Optional)</div>
              <div className={subText}>
                Min Choi detail aktif untuk @hanzonk26 & Colab. Sweepy solo tetap standar.
              </div>
            </div>
            <button className={btn} onClick={() => setExtra("")}>
              Clear Extra Manual
            </button>
          </div>

          {/* Min Choi Preset UI */}
          {isMinChoi && (
            <div className="mt-3 rounded-xl border border-blue-900/40 bg-blue-950/25 p-3">
              <div className="text-xs text-blue-200 font-semibold">Min Choi Detail Preset</div>
              <div className="text-xs text-blue-300/70 mt-1">
                Aktif untuk <b>@hanzonk26</b> & <b>Colab (@hanz26 × Sweepy)</b>. Sweepy solo tetap standar.
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {MINCHOI_ORDER.map((group) => (
                  <label key={group} className="text-xs text-blue-200">
                    {group}
                    <select
                      className="mt-2 w-full rounded-xl border border-blue-900/40 bg-blue-950/40 p-2 text-sm text-slate-100 outline-none focus:border-blue-400"
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

              <div className="mt-3">
                <div className="text-xs text-blue-200 font-semibold">Extra (auto)</div>
                <pre className={smallPre}>{minChoiExtra || "(pilih preset di atas)"}</pre>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    className={btn}
                    onClick={() => copyText(minChoiExtra)}
                    disabled={!minChoiExtra.trim()}
                    title="Copy Extra auto Min Choi"
                  >
                    Copy Min Choi Extra
                  </button>
                  <button
                    className={btn}
                    onClick={() => setMinChoiSel(MINCHOI_DEFAULT_BY_PRESET[lockedPreset] || {})}
                    title="Reset Min Choi defaults"
                  >
                    Reset Min Choi Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual extra stays available for all */}
          <textarea
            className={textarea}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={6}
            placeholder="Tambahan manual (opsional). Misal: tone suara, pacing, overlay text, aturan khusus…"
          />
        </section>

        {/* Output Final Prompt */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Final Prompt (Copy ke Sora)</div>
              <div className={subText}>Sudah gabung: Prompt Utama + Auto Block + Extra</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className={btnPrimary} disabled={!canCopyFinal} onClick={() => copyText(finalPrompt)}>
                Copy Final Prompt
              </button>
              <button className={btn} onClick={doSave} title="Simpan ke Saved">
                Save
              </button>
            </div>
          </div>

          <pre className={preBox}>{finalPrompt}</pre>
        </section>

        {/* Caption & Hashtags */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={cardTitle}>Caption + Hashtags</div>
              <div className={subText}>Auto sesuai niche (bisa copy cepat)</div>
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
          {/* Saved */}
          <div className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className={cardTitle}>Saved</div>
                <div className={subText}>Tersimpan di localStorage</div>
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
                      <button className={btnPrimary} onClick={() => copyText(s.finalPrompt)}>
                        Copy Final
                      </button>
                      <button className={btn} onClick={() => copyText(s.caption)}>
                        Copy Caption
                      </button>
                      <button className={btn} onClick={() => copyText(s.hashtags.join(" "))}>
                        Copy Tags
                      </button>
                    </div>

                    <details className="mt-2">
                      <summary className="text-xs text-blue-200 cursor-pointer select-none">Preview</summary>
                      <pre className={smallPre}>{s.finalPrompt}</pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className={cardTitle}>History (Auto Generate)</div>
                <div className={subText}>Hanya potongan Auto Block</div>
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
                      <button
                        className={btn}
                        onClick={() => {
                          setAutoBlock(h.autoBlock);
                        }}
                      >
                        Load to Auto Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-blue-300/50">
          Sora Lite — Locked Cast v2 • Min Choi Preset ON (Personal + Colab), OFF (Sweepy)
        </footer>
      </div>
    </div>
  );
}
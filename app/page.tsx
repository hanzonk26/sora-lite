"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite - page.tsx (FULL REPLACE) — SOFT BLUE THEME
 * - Niche rebuilt:
 *   1) UGC Story Telling
 *   2) Kesehatan
 *   3) Trik Sulap
 *   4) Lucu (KHUSUS COLAB @hanz26 x Sweepy) -> auto-generate ALWAYS new
 * - Rules:
 *   - Sweepy only appears in niche "Lucu (Hanz x Sweepy)" (enforced)
 *   - Auto generate injects randomness & avoids repeating last output
 * - UX:
 *   - Copy/Save disabled until Prompt Utama filled
 *   - Caption + 5 hashtags: single clean output
 *   - Save Prompts + History stored in localStorage
 * - Theme:
 *   - Dark glass + soft blue accents (mobile friendly)
 */

type NicheKey = "ugc_story" | "kesehatan" | "sulap" | "lucu_colab";
type PresetKey = "general" | "hanz26" | "sweepy" | "colab";

type SavedPrompt = {
  id: string;
  title: string;
  niche: NicheKey;
  preset: PresetKey;
  prompt: string;
  caption: string;
  hashtags: string[];
  createdAt: number;
};

type HistoryItem = {
  id: string;
  niche: NicheKey;
  preset: PresetKey;
  prompt: string;
  createdAt: number;
};

const LS_SAVED = "soraLite.savedPrompts.v1";
const LS_HISTORY = "soraLite.history.v1";

const NICHE_LABEL: Record<NicheKey, string> = {
  ugc_story: "UGC Story Telling",
  kesehatan: "Kesehatan",
  sulap: "Trik Sulap",
  lucu_colab: "Lucu (Hanz × Sweepy)",
};

const PRESET_LABEL: Record<PresetKey, string> = {
  general: "General (tanpa karakter spesifik)",
  hanz26: "@hanz26",
  sweepy: "Sweepy",
  colab: "Colab (Hanz × Sweepy)",
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

/** ---------- Random Pools (anti-monoton) ---------- */

const UGC_LOCATIONS = [
  "di kamar sederhana dengan cahaya natural pagi",
  "di teras rumah sore hari",
  "di coffee shop kecil yang tenang",
  "di pinggir jalan dengan vibe kota (handheld)",
  "di dalam mobil parkir (vlog feel)",
  "di dapur rumah, suasana santai",
];

const UGC_EMOTIONS = ["tenang", "excited", "reflektif", "kocak tipis", "serius tapi santai"];

const UGC_CAMERA = [
  "eye-level, handheld ringan, sedikit goyang natural",
  "tripod statis, framing dada ke atas",
  "sedikit close-up, fokus ekspresi wajah",
  "angle sedikit samping, terasa candid",
];

const UGC_STORY_THEMES = [
  "momen kecil yang bikin kamu sadar sesuatu",
  "cerita gagal lucu yang berakhir jadi pelajaran",
  "kejadian random hari ini yang ternyata relate banget",
  "pengalaman singkat yang bikin mood berubah",
  "cerita 'gue kira begini, ternyata begitu'",
];

const HEALTH_TOPICS = [
  "cara simpel minum air lebih konsisten",
  "tips tidur lebih rapi tanpa ribet",
  "jalan kaki 10 menit setelah makan",
  "ngurangin gula pelan-pelan tanpa stres",
  "cara napas 60 detik buat nurunin tegang",
  "strategi 'piring sehat' versi gampang",
];

const HEALTH_CONTEXT = [
  "tanpa klaim medis, cuma kebiasaan yang membantu",
  "bahas dengan bahasa ringan, kayak ngobrol sama teman",
  "ingatkan: kalau ada kondisi khusus, konsultasi profesional",
];

const MAGIC_PROPS = ["koin", "kartu", "tisu", "karet gelang", "pulpen", "HP", "gelas plastik"];

const MAGIC_TWISTS = [
  "objek tiba-tiba pindah posisi padahal kamera terus merekam",
  "koin lenyap lalu muncul di tempat yang mustahil",
  "kartu berubah jadi kartu lain dalam 1 detik",
  "tisu sobek tiba-tiba utuh lagi",
  "karet gelang tembus jari dengan close-up",
];

const COLAB_SITUATIONS = [
  "lagi masak mie instan tapi Sweepy sok jadi chef",
  "lagi nyapu rumah tapi Sweepy malah ngasih 'teknik' aneh",
  "lagi bikin konten, Sweepy nyelonong minta cameo",
  "lagi kerja di laptop, Sweepy jadi 'manager' nyuruh-nyuruh",
  "lagi siap-siap olahraga, Sweepy ngerjain pemanasan absurd",
  "lagi ngopi, Sweepy ngaku-ngaku barista dan bikin drama",
];

const SWEEPY_ROLE = ["ngeyel", "sok pintar", "jail", "terlalu percaya diri", "super random", "jahil tapi gemes"];

const COLAB_ENDINGS = [
  "ending: @hanz26 kalah debat dan ketawa pasrah",
  "ending: Sweepy berhasil 'menang' tapi bikin berantakan",
  "ending: tiba-tiba keduanya freeze dan saling tatap, cut lucu",
  "ending: @hanz26 ngomel halus, Sweepy senyum puas",
  "ending: reveal kalau Sweepy diam-diam ngerekam semuanya",
];

/** ---------- Caption + Hashtag Generator ---------- */

function generateCaptionAndHashtags(niche: NicheKey) {
  const captionPool: Record<NicheKey, string[]> = {
    ugc_story: [
      "Kadang ceritanya simpel, tapi maknanya nyangkut. 😅",
      "Gue baru sadar ini… dan kok relate banget ya?",
      "Kejadian kecil, tapi efeknya lumayan bikin mikir.",
      "Ini tipe cerita yang bikin: “lah kok gue juga?”",
    ],
    kesehatan: [
      "Kebiasaan kecil, kalau konsisten, efeknya kerasa. 💧",
      "Gak harus perfect — yang penting jalan dulu.",
      "Reminder halus buat diri sendiri (dan kamu).",
      "Sehat itu maraton, bukan sprint.",
    ],
    sulap: [
      "Oke… ini kok bisa?! 😳",
      "Jangan kedip. Serius.",
      "Kalau kamu bisa nebak, kamu jago.",
      "Ini trik kecil tapi bikin kepala nge-lag.",
    ],
    lucu_colab: [
      "Duo chaos lagi beraksi… 🐵🤣",
      "Hari ini Sweepy kebanyakan ide.",
      "Yang satu serius, yang satu… ya gitu deh.",
      "Cuma mau bikin konten… malah jadi rame.",
    ],
  };

  const hashtagPool: Record<NicheKey, string[]> = {
    ugc_story: ["ugc", "storytime", "relate", "kontenharian", "fyp"],
    kesehatan: ["kesehatan", "sehat", "healthyhabit", "selfimprovement", "fyp"],
    sulap: ["sulap", "magic", "illusion", "trik", "fyp"],
    lucu_colab: ["lucu", "komedi", "sweepy", "hanz26", "fyp"],
  };

  const caption = pick(captionPool[niche]);
  const tags = shuffle(hashtagPool[niche]).slice(0, 5).map((t) => `#${t}`);
  return { caption, hashtags: tags };
}

/** ---------- Prompt Builders ---------- */

function baseVideoSpec() {
  const r = Math.random().toString(36).slice(2, 8);
  return [
    "Format: vertical 9:16, UGC social media feel",
    "Audio: natural room tone (no music mandated)",
    `Uniqueness token: ${r}`,
  ];
}

function buildUGCStoryPrompt(preset: PresetKey) {
  const loc = pick(UGC_LOCATIONS);
  const emo = pick(UGC_EMOTIONS);
  const cam = pick(UGC_CAMERA);
  const theme = pick(UGC_STORY_THEMES);

  const characterLine =
    preset === "hanz26"
      ? "Character: @hanz26 (same consistent look), speaks directly to camera."
      : "Character: a friendly Indonesian male creator, speaks directly to camera.";

  return clampText(`
UGC-style storytelling video.
${characterLine}
Tone: ${emo}, conversational, first-person.
Setting: ${loc}.
Camera: ${cam}.
Story theme: ${theme}.
Delivery: natural pauses, authentic expressions, subtle hand gestures.
No cinematic exaggeration. Feels like real TikTok/IG Reels.

${baseVideoSpec().join("\n")}
`);
}

function buildHealthPrompt(preset: PresetKey) {
  const loc = pick(UGC_LOCATIONS);
  const cam = pick(UGC_CAMERA);
  const topic = pick(HEALTH_TOPICS);
  const ctx = pick(HEALTH_CONTEXT);

  const characterLine =
    preset === "hanz26"
      ? "Character: @hanz26 (same consistent look), casual healthy vibe."
      : "Character: Indonesian creator, clean and calm look, casual outfit.";

  return clampText(`
UGC health content (light, friendly, non-medical).
${characterLine}
Topic: ${topic}.
Rule: ${ctx}.
Setting: ${loc}.
Camera: ${cam}.
Style: practical, easy-to-follow, like advice from a friend.
Avoid claims like “menyembuhkan” or “pasti sembuh”.

${baseVideoSpec().join("\n")}
`);
}

function buildMagicPrompt(preset: PresetKey) {
  const prop = pick(MAGIC_PROPS);
  const twist = pick(MAGIC_TWISTS);
  const cam = pick([
    "close-up on hands, quick refocus to face reaction",
    "over-shoulder angle, then snap zoom to reveal",
    "tight framing, stable shot, very clear object visibility",
  ]);

  const characterLine =
    preset === "hanz26"
      ? "Character: @hanz26 (same consistent look), playful magician vibe."
      : "Character: Indonesian creator, playful magician vibe.";

  return clampText(`
Short-form magic trick video (do NOT explain the method).
${characterLine}
Prop: ${prop}.
Core illusion: ${twist}.
Camera: ${cam}.
Pacing: fast, engaging, one clean reveal at the end.
Ending: character reacts (smirk / surprised / laughs) to sell the illusion.

${baseVideoSpec().join("\n")}
`);
}

function buildColabFunnyPrompt() {
  const situation = pick(COLAB_SITUATIONS);
  const role = pick(SWEEPY_ROLE);
  const ending = pick(COLAB_ENDINGS);
  const loc = pick([
    "ruang keluarga sederhana",
    "dapur rumah",
    "teras rumah",
    "coffee shop",
    "meja kerja dengan laptop",
  ]);

  const camera = pick([
    "handheld vlog feel, natural shakiness",
    "static tripod, then quick handheld cut-ins",
    "over-the-shoulder shot alternating to reaction shots",
  ]);

  return clampText(`
Funny UGC-style collaboration video.
Characters: @hanz26 (human) and Sweepy (cute monkey) on screen together, interacting naturally.
Scenario: ${situation}.
Sweepy personality: ${role} (slightly chaotic but adorable).
Setting: ${loc}.
Camera: ${camera}.
Dialog style: quick back-and-forth, natural Indonesian casual vibe (no narrator).
Humor: absurd-but-believable everyday chaos.
${ending}.

${baseVideoSpec().join("\n")}
`);
}

function enforcePresetForNiche(niche: NicheKey, preset: PresetKey): PresetKey {
  if (niche === "lucu_colab") return "colab";
  if (preset === "sweepy" || preset === "colab") return "hanz26";
  return preset;
}

function generatePrompt(niche: NicheKey, preset: PresetKey) {
  const enforced = enforcePresetForNiche(niche, preset);
  switch (niche) {
    case "ugc_story":
      return buildUGCStoryPrompt(enforced);
    case "kesehatan":
      return buildHealthPrompt(enforced);
    case "sulap":
      return buildMagicPrompt(enforced);
    case "lucu_colab":
      return buildColabFunnyPrompt();
  }
}

/** ---------- UI Component ---------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("ugc_story");
  const [preset, setPreset] = useState<PresetKey>("hanz26");

  const [promptUtama, setPromptUtama] = useState<string>("");
  const [extra, setExtra] = useState<string>("");

  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedPrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const lastAutoRef = useRef<string>("");

  const effectivePreset = useMemo(() => enforcePresetForNiche(niche, preset), [niche, preset]);
  const canCopySave = promptUtama.trim().length > 0;

  useEffect(() => {
    const s = safeParse<SavedPrompt[]>(localStorage.getItem(LS_SAVED), []);
    const h = safeParse<HistoryItem[]>(localStorage.getItem(LS_HISTORY), []);
    setSaved(s);
    setHistory(h);
  }, []);

  useEffect(() => {
    if (effectivePreset !== preset) setPreset(effectivePreset);
    const ch = generateCaptionAndHashtags(niche);
    setCaption(ch.caption);
    setHashtags(ch.hashtags);
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const scene = promptUtama.trim() ? promptUtama.trim() : "[EMPTY] (Write Prompt Utama first)";
    const autoBlock = generatePrompt(niche, preset);
    const merged = clampText(`
SCENE:
${scene}

AUTO STYLE BLOCK:
${autoBlock}

EXTRA (optional):
${extra.trim() || "-"}
`);
    setFinalPrompt(merged);
  }, [promptUtama, extra, niche, preset]);

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
    for (let i = 0; i < 6; i++) {
      out = generatePrompt(niche, preset);
      if (clampText(out) !== clampText(lastAutoRef.current)) break;
    }
    lastAutoRef.current = out;

    if (!promptUtama.trim()) {
      setPromptUtama(out);
    } else {
      setExtra((prev) => clampText(`${prev}\n\n# Auto Variation\n${out}`));
    }

    const item: HistoryItem = {
      id: uid("hist"),
      niche,
      preset: enforcePresetForNiche(niche, preset),
      prompt: out,
      createdAt: Date.now(),
    };
    persistHistory([item, ...history].slice(0, 80));
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
    if (!canCopySave) return;

    const titleBase = `${NICHE_LABEL[niche]} • ${PRESET_LABEL[enforcePresetForNiche(niche, preset)]}`;
    const ch = generateCaptionAndHashtags(niche);

    const item: SavedPrompt = {
      id: uid("save"),
      title: `${titleBase} • ${new Date().toLocaleString("id-ID")}`,
      niche,
      preset: enforcePresetForNiche(niche, preset),
      prompt: finalPrompt,
      caption: ch.caption,
      hashtags: ch.hashtags,
      createdAt: Date.now(),
    };

    persistSaved([item, ...saved].slice(0, 200));
    setCaption(ch.caption);
    setHashtags(ch.hashtags);
  }

  function removeSaved(id: string) {
    persistSaved(saved.filter((x) => x.id !== id));
  }

  function clearHistory() {
    persistHistory([]);
  }

  // ---------- SOFT BLUE THEME CLASSES ----------
  const boxStyle =
    "border border-blue-900/40 rounded-2xl p-4 shadow-lg bg-blue-950/40 backdrop-blur";
  const btn =
    "px-3 py-2 rounded-xl border border-blue-900/40 hover:bg-blue-900/30 active:scale-[0.99] transition";
  const btnPrimary =
    "px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.99] transition";
  const label = "text-sm font-medium text-blue-200";
  const subText = "text-xs text-blue-300/70";
  const paraText = "text-sm text-blue-300/60";

  const textareaBase =
    "mt-3 w-full rounded-xl border border-blue-900/40 bg-blue-950/40 p-3 text-sm text-slate-100 outline-none focus:border-blue-400 placeholder:text-blue-300/50";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold">Sora Lite — Niche Rebuild</h1>
          <p className={paraText}>
            Niche: UGC Story Telling • Kesehatan • Trik Sulap • Lucu (Hanz × Sweepy)
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="md:col-span-1 space-y-4">
            <section className={boxStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={label}>Niche</div>
                  <div className={subText}>Sweepy hanya boleh muncul di niche Lucu (colab).</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["ugc_story", "kesehatan", "sulap", "lucu_colab"] as NicheKey[]).map((k) => (
                  <button
                    key={k}
                    className={`${btn} ${niche === k ? "border-blue-300/70 bg-blue-900/20" : ""}`}
                    onClick={() => setNiche(k)}
                  >
                    {NICHE_LABEL[k]}
                  </button>
                ))}
              </div>
            </section>

            <section className={boxStyle}>
              <div className={label}>Preset Karakter</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {(["general", "hanz26", "sweepy", "colab"] as PresetKey[]).map((k) => {
                  const disabled = niche !== "lucu_colab" && (k === "sweepy" || k === "colab");
                  const enforced = enforcePresetForNiche(niche, k);
                  const actuallySelected = effectivePreset === enforced && preset === k;

                  return (
                    <button
                      key={k}
                      className={`${btn} ${actuallySelected ? "border-blue-300/70 bg-blue-900/20" : ""} ${
                        disabled ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      onClick={() => !disabled && setPreset(k)}
                      title={
                        disabled
                          ? "Sweepy/Colab hanya untuk niche Lucu (Hanz × Sweepy)"
                          : PRESET_LABEL[k]
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span>{PRESET_LABEL[k]}</span>
                        {disabled ? <span className="text-xs">🔒</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {effectivePreset !== preset && (
                <div className="mt-2 text-xs text-amber-300">
                  Preset disesuaikan otomatis ke: <b>{PRESET_LABEL[effectivePreset]}</b>
                </div>
              )}
            </section>

            <section className={boxStyle}>
              <div className={label}>Auto Generate</div>
              <p className={subText}>
                Selalu generate prompt baru (anti monoton). Jika Prompt Utama kosong, hasil auto akan
                masuk ke Prompt Utama.
              </p>
              <div className="mt-3 flex gap-2">
                <button className={btnPrimary} onClick={doAutoGenerate}>
                  Auto Generate (Fresh)
                </button>
                <button
                  className={btn}
                  onClick={() => {
                    const ch = generateCaptionAndHashtags(niche);
                    setCaption(ch.caption);
                    setHashtags(ch.hashtags);
                  }}
                >
                  Refresh Caption/Tags
                </button>
              </div>
            </section>

            <section className={boxStyle}>
              <div className={label}>Caption + 5 Hashtags</div>
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
                  Copy Caption + Tags
                </button>
              </div>
            </section>
          </div>

          {/* CENTER */}
          <div className="md:col-span-2 space-y-4">
            <section className={boxStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={label}>Prompt Utama</div>
                  <div className={subText}>Isi ini dulu supaya Copy/Save aktif.</div>
                </div>
                <div className="flex gap-2">
                  <button className={btn} onClick={() => setPromptUtama("")}>
                    Clear
                  </button>
                  <button
                    className={btn}
                    onClick={() => {
                      const demo =
                        "Buat video 10–15 detik, hook kuat di 2 detik pertama, bahasa Indonesia santai, ending punchline.";
                      setPromptUtama((p) => (p.trim() ? p : demo));
                    }}
                  >
                    Quick Fill
                  </button>
                </div>
              </div>
              <textarea
                className={`${textareaBase} min-h-[180px]`}
                placeholder="Contoh: 'Gue mau cerita…' / 'Hari ini gue coba habit...' / 'Jangan kedip...' / atau klik Auto Generate"
                value={promptUtama}
                onChange={(e) => setPromptUtama(e.target.value)}
              />
            </section>

            <section className={boxStyle}>
              <div className={label}>Extra (optional)</div>
              <textarea
                className={`${textareaBase} min-h-[120px]`}
                placeholder="Tambahan: gaya kamera, lokasi spesifik, outfit, dll..."
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </section>

            <section className={boxStyle}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={label}>Final Prompt</div>
                  {!canCopySave && <div className="text-xs text-amber-300 mt-1">Isi Prompt Utama dulu.</div>}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`${btn} ${!canCopySave ? "opacity-40 cursor-not-allowed" : ""}`}
                    onClick={() => canCopySave && copyText(finalPrompt)}
                    disabled={!canCopySave}
                  >
                    Copy
                  </button>
                  <button
                    className={`${btnPrimary} ${!canCopySave ? "opacity-40 cursor-not-allowed" : ""}`}
                    onClick={doSave}
                    disabled={!canCopySave}
                  >
                    Save
                  </button>
                </div>
              </div>

              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-blue-900/40 p-3 text-sm bg-blue-950/40 text-slate-100">
                {finalPrompt}
              </pre>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              {/* SAVED */}
              <section className={boxStyle}>
                <div className="flex items-center justify-between">
                  <div className={label}>Saved Prompts</div>
                  <div className="text-xs text-blue-300/70">{saved.length}</div>
                </div>

                <div className="mt-3 space-y-2 max-h-[360px] overflow-auto pr-1">
                  {saved.length === 0 ? (
                    <div className="text-sm text-blue-300/70">Belum ada. Klik Save dulu.</div>
                  ) : (
                    saved.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-blue-900/40 p-3 bg-blue-950/30"
                      >
                        <div className="text-sm font-medium text-slate-100">{s.title}</div>
                        <div className="text-xs text-blue-300/70 mt-1">
                          {NICHE_LABEL[s.niche]} • {PRESET_LABEL[s.preset]}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className={btn} onClick={() => copyText(s.prompt)}>
                            Copy Prompt
                          </button>
                          <button
                            className={btn}
                            onClick={() => copyText(`${s.caption}\n\n${s.hashtags.join(" ")}`)}
                          >
                            Copy Caption+Tags
                          </button>
                          <button className={btn} onClick={() => setFinalPrompt(s.prompt)}>
                            Load to Final
                          </button>
                          <button
                            className={btn}
                            onClick={() => {
                              setNiche(s.niche);
                              setPreset(s.preset);
                              setPromptUtama(s.prompt);
                              setExtra("");
                            }}
                          >
                            Load to Editor
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

              {/* HISTORY */}
              <section className={boxStyle}>
                <div className="flex items-center justify-between">
                  <div className={label}>History (Auto Generate)</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-blue-300/70">{history.length}</div>
                    <button className={btn} onClick={clearHistory}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-[360px] overflow-auto pr-1">
                  {history.length === 0 ? (
                    <div className="text-sm text-blue-300/70">
                      Klik Auto Generate buat mulai bikin riwayat.
                    </div>
                  ) : (
                    history.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl border border-blue-900/40 p-3 bg-blue-950/30"
                      >
                        <div className="text-xs text-blue-300/70">
                          {NICHE_LABEL[h.niche]} • {PRESET_LABEL[h.preset]}
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-blue-950/40 border border-blue-900/40 rounded-xl p-2 text-slate-100">
                          {h.prompt}
                        </pre>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button className={btn} onClick={() => copyText(h.prompt)}>
                            Copy
                          </button>
                          <button
                            className={btn}
                            onClick={() => {
                              setPromptUtama(h.prompt);
                              setExtra("");
                            }}
                          >
                            Use as Prompt Utama
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

        <footer className="text-xs text-blue-300/70 pt-2">
          Tips: untuk niche <b className="text-blue-200">Lucu (Hanz × Sweepy)</b>, tekan Auto Generate berkali-kali — sistem akan inject variasi scenario + ending biar prompt selalu baru.
        </footer>
      </div>
    </div>
  );
}
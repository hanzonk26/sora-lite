"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sora Lite — Pro Prompt Builder (FULL REPLACE)
 * Focus: UGC Story, Kesehatan, Colab Lucu (Hanz × Sweepy/@mockey.mo)
 *
 * Presets:
 * - General
 * - @hanz26
 * - Sweepy (@mockey.mo)
 * - Colab (@hanz26 × Sweepy)
 *
 * Niches:
 * - UGC Story Telling: ONLY @hanz26
 * - Kesehatan: ONLY @hanz26
 * - Colab Lucu: @hanz26 / Sweepy / Colab
 *
 * Key UX:
 * - Prompt Utama = clean director brief (20s, 2 scenes merged)
 * - Auto Block = idea engine, separated (no messy duplication)
 * - Final Prompt = Prompt Utama + Auto Block + Extra + output rules
 * - Copy buttons for Final Prompt, Auto Block, Caption+Tags
 */

type NicheKey = "ugc_story" | "kesehatan" | "colab_lucu";
type PresetKey = "general" | "hanz26" | "sweepy" | "colab";

type SavedPrompt = {
  id: string;
  title: string;
  niche: NicheKey;
  preset: PresetKey;
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
  autoBlock: string;
  createdAt: number;
};

const LS_SAVED = "soraLite.savedPrompts.v3";
const LS_HISTORY = "soraLite.history.v3";

const NICHE_LABEL: Record<NicheKey, string> = {
  ugc_story: "UGC Story Telling",
  kesehatan: "Kesehatan",
  colab_lucu: "Colab Lucu (Hanz × Sweepy)",
};

const PRESET_LABEL: Record<PresetKey, string> = {
  general: "General (tanpa karakter spesifik)",
  hanz26: "@hanz26",
  sweepy: "Sweepy (@mockey.mo)",
  colab: "Colab (@hanz26 × Sweepy)",
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

/** ---------------- Rules: allowed presets per niche ---------------- */

function allowedPresetsForNiche(niche: NicheKey): PresetKey[] {
  switch (niche) {
    case "ugc_story":
    case "kesehatan":
      return ["hanz26"];
    case "colab_lucu":
      return ["hanz26", "sweepy", "colab"];
  }
}

function enforcePreset(niche: NicheKey, preset: PresetKey): PresetKey {
  const allowed = allowedPresetsForNiche(niche);
  if (allowed.includes(preset)) return preset;
  return allowed[0];
}

/** ---------------- Prompt Utama templates (clean director brief) ---------------- */

function defaultPromptUtama(niche: NicheKey, preset: PresetKey) {
  const base = `Durasi total ±20 detik, dibagi 2 scene (masing-masing ±10 detik), DIGABUNG jadi 1 video utuh.
Bahasa Indonesia santai, UGC natural, tanpa narrator panjang, ekspresi autentik.
Hook kuat di 2 detik pertama. Ending punchline/reveal yang bikin replay.
Kontinuitas: lokasi/outfit/karakter konsisten di dua scene.`;

  if (niche === "ugc_story") {
    return clampText(`${base}

SCENE 1 (0–10 detik):
@hanz26 cerita singkat (first-person) tentang kejadian kecil hari ini yang relate.
Ambil 1 detail spesifik (gesture, benda, situasi) biar terasa nyata.

SCENE 2 (10–20 detik):
Twist/pelajaran ringan yang bikin “oh iya ya”.
Tutup dengan 1 kalimat penutup yang hangat + ekspresi natural (senyum / ketawa kecil).`);
  }

  if (niche === "kesehatan") {
    return clampText(`${base}

SCENE 1 (0–10 detik):
@hanz26 buka dengan masalah umum (contoh: susah tidur / kurang minum / gampang tegang).
Kasih 1 kebiasaan kecil yang gampang dicoba (tanpa klaim medis).

SCENE 2 (10–20 detik):
Tunjukin langkahnya singkat (1–2 step) + contoh real.
Ending: reminder halus “kalau punya kondisi khusus, konsultasi profesional”.`);
  }

  // colab_lucu
  const cast =
    preset === "colab"
      ? "Cast: @hanz26 + Sweepy (@mockey.mo) (duo chaos)."
      : preset === "sweepy"
      ? "Cast: Sweepy (@mockey.mo) saja (monyet lucu super random)."
      : "Cast: @hanz26 saja (komedi natural).";

  return clampText(`${base}
${cast}

SCENE 1 (0–10 detik):
Situasi normal sehari-hari (yang relatable), lalu konflik lucu muncul (gangguan kecil).
Dialog pendek, cepat, natural.

SCENE 2 (10–20 detik):
Konflik makin absurd tapi masih believable.
Reaksi spontan (kaget/ketawa/pasrah).
Ending: punchline visual atau 1 kalimat yang nancep (cut tepat di momen lucu).`);
}

/** ---------------- Random pools for Auto Block (absurd conflict engine) ---------------- */

const UGC_LOCATIONS = [
  "di kamar sederhana dengan cahaya natural pagi",
  "di teras rumah sore hari",
  "di coffee shop kecil yang tenang",
  "di meja kerja dengan laptop",
  "di dapur rumah, suasana santai",
];

const UGC_CAMERA = [
  "handheld vlog feel (subtle shake), quick punchy cuts",
  "static tripod base + quick handheld reaction inserts",
  "over-the-shoulder alternating to reaction shots",
  "eye-level candid, slight side angle, feels real",
];

const COMEDY_VIBES = ["absurd tapi believable", "chaos lucu", "deadpan humor", "fast banter", "awkward silence cut"];

const HZ_ACTIVITIES = [
  "lagi bikin kopi dan mau tampil ‘serius’",
  "lagi kerja di laptop (deadline vibe)",
  "lagi beres-beres meja biar rapi",
  "lagi setting kamera buat bikin konten",
  "lagi siap olahraga tapi malas",
  "lagi masak mie instan ala anak kos",
];

const SWEEPY_MOTIVES = [
  "ngaku jadi ‘manager’",
  "ngaku jadi ‘chef’",
  "ngaku jadi ‘coach’",
  "ngaku jadi ‘sutradara’",
  "ngaku jadi ‘life coach’",
  "ngaku jadi ‘security’",
];

const SWEEPY_TRAITS = ["ngeyel", "sok pintar", "overconfident", "super random", "jail tapi gemes", "serius lucu"];

const ABSURD_ACTIONS = [
  "ngasih aturan aneh yang bikin ribet",
  "nyelonong ambil properti penting terus pura-pura polos",
  "ngubah sesuatu diam-diam pas kamera on",
  "masuk frame pas momen paling serius",
  "nyuruh @hanz26 ngulang take berkali-kali",
  "bikin ‘tes’ absurd yang gak ada hubungannya",
];

const PUNCHLINES = [
  "ending: @hanz26 ketawa pasrah: “yaudah, gue ikut lo…” (cut)",
  "ending: Sweepy senyum puas sambil angguk-angguk (cut pas awkward)",
  "ending: freeze beat 0.5 detik, mereka tatap-tatapan, cut lucu",
  "ending: @hanz26 facepalm ringan: “ini siapa yang ngundang?” (cut)",
  "ending: ternyata Sweepy yang rekam semua dari tadi (reveal cepat)",
];

function uniquenessToken() {
  return Math.random().toString(36).slice(2, 8);
}

/** ---------------- Auto Block builders (style + detailed conflict only) ---------------- */

function autoBlockUGCStory() {
  const loc = pick(UGC_LOCATIONS);
  const cam = pick(["tripod statis, framing dada ke atas", "handheld ringan, natural goyang"]);
  const vibe = pick(["hangat", "relatable", "jujur", "reflektif tapi santai"]);
  const theme = pick(["kejadian kecil yang bikin sadar sesuatu", "momen random yang relate", "gue kira begini, ternyata begitu"]);

  return clampText(`
AUTO BLOCK (STYLE + DETAILS):
Character: @hanz26 (consistent look).
Vibe: ${vibe}, first-person storytelling.
Theme suggestion: ${theme}.
Setting: ${loc}.
Camera: ${cam}.
Pacing: hook 2 detik → cerita singkat → twist kecil → closing hangat.
Tech: vertical 9:16, ~20s, natural room tone.
Uniqueness token: ${uniquenessToken()}
`);
}

function autoBlockHealth() {
  const loc = pick(UGC_LOCATIONS);
  const cam = pick(["tripod statis, framing dada ke atas", "handheld ringan, natural goyang"]);
  const topic = pick([
    "minum air lebih konsisten",
    "sleep routine simpel",
    "jalan kaki 10 menit setelah makan",
    "napas 60 detik buat nurunin tegang",
    "ngurangin gula pelan-pelan",
  ]);

  return clampText(`
AUTO BLOCK (STYLE + DETAILS):
Character: @hanz26 (consistent look), healthy casual vibe.
Topic suggestion: ${topic}.
Tone: friendly, non-medical, no “menyembuhkan/pasti”.
Setting: ${loc}.
Camera: ${cam}.
Structure: 1 problem → 1 habit → 1 step contoh → reminder halus.
Tech: vertical 9:16, ~20s, natural room tone.
Uniqueness token: ${uniquenessToken()}
`);
}

function autoBlockColabFunny(preset: PresetKey) {
  const loc = pick(UGC_LOCATIONS);
  const cam = pick(UGC_CAMERA);
  const vibe = pick(COMEDY_VIBES);

  const activity = pick(HZ_ACTIVITIES);
  const motive = pick(SWEEPY_MOTIVES);
  const trait = pick(SWEEPY_TRAITS);
  const absurd = pick(ABSURD_ACTIONS);
  const ending = pick(PUNCHLINES);

  const cast =
    preset === "colab"
      ? "Cast: @hanz26 (human) + Sweepy (@mockey.mo) (cute monkey). They must interact on screen."
      : preset === "sweepy"
      ? "Cast: Sweepy (@mockey.mo) only. (Monkey POV humor, still UGC style.)"
      : "Cast: @hanz26 only. (Self comedy, still feels real.)";

  // For the user's focus: "konflik lucu absurd yang selalu ada antara hanz & sweepy"
  // We'll bias the prompt to always include conflict even if preset isn't colab.
  const conflictLine =
    preset === "colab"
      ? `Conflict: Sweepy ${motive} dan ${trait}, lalu ${absurd}. @hanz26 bereaksi spontan.`
      : `Conflict: ada gangguan lucu yang memicu reaksi spontan (absurd tapi believable).`;

  return clampText(`
AUTO BLOCK (CONFLICT ENGINE):
${cast}
Vibe: ${vibe}.
Setting: ${loc}.
Camera: ${cam}.
Base situation: @hanz26 ${activity}.
${conflictLine}
Dialog: bahasa Indonesia santai, cepat, back-and-forth (tanpa narrator).
Continuity: scene 1 dan 2 di lokasi yang sama, outfit sama, flow nyambung.
Timing guide: 0–2s hook (gangguan muncul cepat) → 2–10s escalation → 10–18s chaos peak → 18–20s punchline.
${ending}
Tech: vertical 9:16, ~20s, natural room tone.
Uniqueness token: ${uniquenessToken()}
`);
}

function buildAutoBlock(niche: NicheKey, preset: PresetKey) {
  switch (niche) {
    case "ugc_story":
      return autoBlockUGCStory();
    case "kesehatan":
      return autoBlockHealth();
    case "colab_lucu":
      return autoBlockColabFunny(preset);
  }
}

/** ---------------- Caption & tags ---------------- */

function generateCaptionAndHashtags(niche: NicheKey, preset: PresetKey) {
  const baseCaption: Record<NicheKey, string[]> = {
    ugc_story: ["Cerita kecil, tapi relate. 😅", "Ini kejadian receh… tapi ngena.", "Kadang yang simpel itu paling nempel."],
    kesehatan: ["Kebiasaan kecil, efeknya kerasa. 💧", "Nggak harus perfect, yang penting konsisten.", "Reminder halus buat hari ini."],
    colab_lucu: ["Duo chaos lagi beraksi… 😂", "Normalnya sebentar, chaosnya lama.", "Yang satu serius, yang satu random."],
  };

  const tagPool: Record<NicheKey, string[]> = {
    ugc_story: ["ugc", "storytime", "relate", "kontenharian", "fyp"],
    kesehatan: ["kesehatan", "sehat", "habit", "selfimprovement", "fyp"],
    colab_lucu: ["lucu", "komedi", "viral", "reels", "fyp"],
  };

  const presetTag =
    preset === "hanz26"
      ? ["hanz26"]
      : preset === "sweepy"
      ? ["mockeymo", "sweepy"]
      : preset === "colab"
      ? ["hanz26", "mockeymo", "sweepy"]
      : [];

  const caption = pick(baseCaption[niche]);
  const tags = shuffle([...tagPool[niche], ...presetTag]).slice(0, 5).map((t) => `#${t}`);
  return { caption, hashtags: tags };
}

/** ---------------- UI ---------------- */

export default function Page() {
  const [niche, setNiche] = useState<NicheKey>("ugc_story");
  const [preset, setPreset] = useState<PresetKey>("hanz26");

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

  useEffect(() => {
    const s = safeParse<SavedPrompt[]>(localStorage.getItem(LS_SAVED), []);
    const h = safeParse<HistoryItem[]>(localStorage.getItem(LS_HISTORY), []);
    setSaved(s);
    setHistory(h);
  }, []);

  useEffect(() => {
    // enforce preset on niche switch
    if (enforcedPreset !== preset) setPreset(enforcedPreset);

    // set default prompt utama if empty/short
    setPromptUtama((prev) =>
      prev.trim().length > 10 ? prev : defaultPromptUtama(niche, enforcePreset(niche, preset))
    );

    // refresh caption/tags
    const ch = generateCaptionAndHashtags(niche, enforcePreset(niche, preset));
    setCaption(ch.caption);
    setHashtags(ch.hashtags);

    // clear autoBlock when switching niche for cleanliness
    setAutoBlock("");
  }, [niche]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // enforce preset if user tries invalid
    if (preset !== enforcedPreset) setPreset(enforcedPreset);
  }, [enforcedPreset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const merged = clampText(`
PROMPT UTAMA (DIRECTOR BRIEF):
${promptUtama.trim() || "(Isi Prompt Utama dulu)"}

AUTO BLOCK (STYLE + CONFLICT DETAILS):
${autoBlock.trim() || "(Klik Auto Generate)"}

EXTRA (OPTIONAL):
${extra.trim() || "-"}

OUTPUT RULES:
- One coherent ~20s video, 2 scenes merged (0–10s and 10–20s).
- Keep continuity of location/outfit/characters between scenes.
- No conflicting main gags: keep one core conflict thread.
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
      out = buildAutoBlock(niche, preset);
      if (clampText(out) !== clampText(lastAutoRef.current)) break;
    }
    lastAutoRef.current = out;
    setAutoBlock(out);

    const item: HistoryItem = {
      id: uid("hist"),
      niche,
      preset: enforcePreset(niche, preset),
      autoBlock: out,
      createdAt: Date.now(),
    };
    persistHistory([item, ...history].slice(0, 120));
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
    const titleBase = `${NICHE_LABEL[niche]} • ${PRESET_LABEL[enforcePreset(niche, preset)]}`;
    const ch = generateCaptionAndHashtags(niche, enforcePreset(niche, preset));

    const item: SavedPrompt = {
      id: uid("save"),
      title: `${titleBase} • ${new Date().toLocaleString("id-ID")}`,
      niche,
      preset: enforcePreset(niche, preset),
      promptUtama,
      autoBlock,
      extra,
      finalPrompt,
      caption: ch.caption,
      hashtags: ch.hashtags,
      createdAt: Date.now(),
    };

    persistSaved([item, ...saved].slice(0, 250));
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
              <h1 className="text-2xl md:text-3xl font-semibold">Sora Lite — Colab Focus</h1>
              <p className="text-sm text-blue-300/60 mt-1">
                Fokus konflik lucu & absurd antara <b className="text-blue-200">@hanz26</b> dan{" "}
                <b className="text-blue-200">Sweepy (@mockey.mo)</b>, plus niche UGC story & kesehatan.
              </p>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2">
              <span className={pill}>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Clean Prompt Mode
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
              Allowed:{" "}
              <b className="text-blue-100">
                {allowedPresets.map((p) => PRESET_LABEL[p]).join(" • ")}
              </b>
            </span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="md:col-span-1 space-y-4">
            <section className={card}>
              <div className={cardTitle}>Niche</div>
              <div className={subText}>
                UGC Story & Kesehatan khusus @hanz26. Colab Lucu bisa @hanz26 / Sweepy / Colab.
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(["ugc_story", "kesehatan", "colab_lucu"] as NicheKey[]).map((k) => (
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
              <div className={subText}>Preset yang tidak sesuai niche akan terkunci otomatis.</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(["general", "hanz26", "sweepy", "colab"] as PresetKey[]).map((k) => {
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
              <div className={cardTitle}>Auto Generate</div>
              <div className={subText}>
                Auto Generate mengisi <b>Auto Block</b> (style + konflik detail). Prompt Utama tetap clean.
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
                  onClick={() =>
                    setExtra((prev) => clampText(`${prev}\n\n# AUTO BLOCK (appended)\n${autoBlock}`))
                  }
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
                  <div className={cardTitle}>Prompt Utama (Clean & Detail)</div>
                  <div className={subText}>
                    Ini “sutradara”-nya: 20 detik, 2 scene digabung, alur jelas. Konflik detail ada di Auto Block.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={btn} onClick={() => setPromptUtama(defaultPromptUtama(niche, enforcedPreset))}>
                    Reset Template
                  </button>
                  <button className={btn} onClick={() => setPromptUtama("")}>
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                className={`${textarea} min-h-[240px]`}
                value={promptUtama}
                onChange={(e) => setPromptUtama(e.target.value)}
                placeholder="Tulis arahan sutradara: durasi, 2 scene, hook, dialog, ending..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={pill}>Hook 0–2 detik</span>
                <span className={pill}>Konflik naik di scene 1</span>
                <span className={pill}>Payoff punchline di scene 2</span>
                <span className={pill}>Cut tepat saat lucu</span>
              </div>
            </section>

            <section className={card}>
              <div className={cardTitle}>Extra (optional)</div>
              <div className={subText}>Tambahan kecil: outfit, lokasi spesifik, style kamera khusus, dll.</div>

              <textarea
                className={`${textarea} min-h-[120px]`}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Contoh: outfit hoodie hitam, lokasi di meja kerja, close-up saat punchline..."
              />
            </section>

            <section className={card}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={cardTitle}>Final Prompt</div>
                  <div className={subText}>Sudah clean: Prompt Utama + Auto Block + Extra.</div>
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
                          {NICHE_LABEL[s.niche]} • {PRESET_LABEL[s.preset]}
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
                          {NICHE_LABEL[h.niche]} • {PRESET_LABEL[h.preset]}
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
          Fokus colab: klik Auto Generate berkali-kali sampai dapat konflik yang paling lucu. Prompt Utama tetap clean untuk menjaga output video konsisten.
        </footer>
      </div>
    </div>
  );
}
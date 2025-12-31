"use client";

import React, { useEffect, useMemo, useState } from "react";

type StyleKey =
  | "cinematic"
  | "horror"
  | "lucu"
  | "ugc"
  | "doc"
  | "broll"
  | "weird"
  | "sweepy"
  | "hanz";

type TagKey = "horror" | "daily" | "review" | "lucu";

const STYLE_ORDER: StyleKey[] = [
  "cinematic",
  "horror",
  "lucu",
  "ugc",
  "doc",
  "broll",
  "weird",
  "sweepy",
  "hanz",
];

const STYLE_LABEL: Record<StyleKey, string> = {
  cinematic: "Cinematic",
  horror: "Horror",
  lucu: "Lucu",
  ugc: "UGC",
  doc: "Doc",
  broll: "B-roll (No Character)",
  weird: "Weird / Random",
  sweepy: "Sweepy 🧹",
  hanz: "Hanz 👤",
};

const TAGS: { key: TagKey; label: string }[] = [
  { key: "horror", label: "horror" },
  { key: "daily", label: "daily" },
  { key: "review", label: "review" },
  { key: "lucu", label: "lucu" },
];

const STYLE_PRESETS: Record<StyleKey, string> = {
  cinematic:
    "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting, professional color grading",
  horror:
    "cinematic horror, low-key lighting, eerie shadows, suspenseful pacing, cold color temperature, creepy ambience (NO extreme gore), subtle camera shake",
  lucu:
    "light comedy vibe, playful timing, expressive reactions, warm lighting, fun camera moves, short-form viral energy, wholesome humor",
  ugc:
    "UGC style, handheld phone camera, natural lighting, casual authentic vibe, real-life setting, quick cuts, captions-friendly framing",
  doc:
    "documentary style, natural soundscape, steady camera, honest framing, informative tone, realistic details, clean composition",
  broll:
    "high-quality B-roll, product/scene focused, no main character, clean composition, macro details, smooth slow motion, cinematic lighting",
  weird:
    "absurd weird internet vibe, unexpected twist, surreal but grounded visuals, comedic contrast, quick reveal, visually memorable",
  sweepy:
    "cute quirky mascot character named Sweepy, expressive motion, playful cleanup hero vibe, fun camera angles, short viral pacing, realistic lighting",
  hanz:
    "realistic Indonesian male creator named Hanz, confident and expressive, natural UGC delivery, relatable daily setting, handheld feel, modern cinematic grade",
};

type HistoryItem = {
  id: string;
  ts: number;
  preset: StyleKey;
  tags: TagKey[];
  prompt: string;
  extra: string;
  finalPrompt: string;
};

function buildHashtags(preset: StyleKey, tags: TagKey[]) {
  const base = ["#sora", "#soraai", "#aivideo", "#prompt", "#contentcreator"];

  const tagMap: Record<TagKey, string> = {
    horror: "#horor",
    daily: "#dailycontent",
    review: "#reviewproduk",
    lucu: "#lucu",
  };

  const presetMap: Record<StyleKey, string> = {
    cinematic: "#cinematic",
    horror: "#horror",
    lucu: "#comedy",
    ugc: "#ugc",
    doc: "#documentary",
    broll: "#broll",
    weird: "#weird",
    sweepy: "#sweepy",
    hanz: "#hanz",
  };

  const picked = [
    presetMap[preset],
    ...tags.map((t) => tagMap[t]),
    ...base,
  ];

  // unik + ambil 5
  return Array.from(new Set(picked)).slice(0, 5);
}

export default function Page() {
  const [preset, setPreset] = useState<StyleKey>("cinematic");
  const [activeTags, setActiveTags] = useState<TagKey[]>(["daily"]);
  const [prompt, setPrompt] = useState("");
  const [extra, setExtra] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sora_lite_history_v2");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sora_lite_history_v2", JSON.stringify(history));
    } catch {}
  }, [history]);

  const finalPrompt = useMemo(() => {
    const base = STYLE_PRESETS[preset];
    const main = prompt.trim();
    const ex = extra.trim();
    if (!main && !ex) return "";

    return [
      `STYLE: ${base}`,
      main ? `SCENE: ${main}` : "",
      ex ? `DETAILS: ${ex}` : "",
      "OUTPUT: 10–15 seconds, vertical 9:16, high quality, clean motion",
    ]
      .filter(Boolean)
      .join("\n");
  }, [preset, prompt, extra]);

  const captionBlock = useMemo(() => {
    if (!finalPrompt) return "";
    const tags: TagKey[] = activeTags.length ? activeTags : ["daily"];
    const hashtags = buildHashtags(preset, tags).join(" ");
    return `Caption:\n${prompt.trim() || "(isi adegan kamu)"}\n\n${hashtags}`;
  }, [finalPrompt, preset, activeTags, prompt]);

  function toggleTag(tag: TagKey) {
    setActiveTags((prev) => {
      const has = prev.includes(tag);
      const next = has ? prev.filter((t) => t !== tag) : [...prev, tag];
      return next.length ? next : ["daily"];
    });
  }

  async function copyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast("✅ Disalin");
      setTimeout(() => setToast(""), 1200);
    } catch {
      setToast("⚠️ Gagal copy");
      setTimeout(() => setToast(""), 1200);
    }
  }

  function saveHistory() {
    if (!finalPrompt) return;
    const item: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
      preset,
      tags: activeTags.length ? activeTags : ["daily"],
      prompt: prompt.trim(),
      extra: extra.trim(),
      finalPrompt,
    };
    setHistory((prev) => [item, ...prev].slice(0, 30));
    setToast("✅ Tersimpan");
    setTimeout(() => setToast(""), 1200);
  }

  function loadHistory(item: HistoryItem) {
    setPreset(item.preset);
    setActiveTags(item.tags?.length ? item.tags : ["daily"]);
    setPrompt(item.prompt || "");
    setExtra(item.extra || "");
    setToast("↩️ Loaded");
    setTimeout(() => setToast(""), 1200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#0b0f16] text-white">
      {/* soft glow */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-4 pb-28 pt-6">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sora Lite — Prompt Builder
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Preset + Tag + Caption + 5 Hashtag + History (local).
          </p>
        </header>

        {/* preset */}
        <section className="rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Preset Style</h2>
            <button
              onClick={() => setPrompt("")}
              className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {STYLE_ORDER.map((key) => {
              const active = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition ring-1 ring-white/10",
                    active
                      ? "bg-emerald-400/90 text-black"
                      : "bg-white/10 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  {STYLE_LABEL[key]}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold text-white/70">
              Preset detail
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-white/90">
              {STYLE_PRESETS[preset]}
            </div>
          </div>
        </section>

        {/* tags */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">Tag</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const active = activeTags.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => toggleTag(t.key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition ring-1 ring-white/10",
                    active
                      ? "bg-emerald-400/90 text-black"
                      : "bg-white/10 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-white/60">
            * Kalau tidak pilih apa-apa, default: <b>daily</b>
          </p>
        </section>

        {/* input */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">Prompt Utama</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Contoh: Sweepy menonton film horor, sosok di TV mau keluar, Sweepy mengetuk kepala dengan remote..."
            className="mt-3 w-full rounded-2xl bg-black/30 p-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />

          <h3 className="mt-4 text-sm font-semibold">Extra (Opsional)</h3>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={3}
            placeholder="Contoh: kamera dari belakang, slow push-in, teks overlay, NO watermark..."
            className="mt-3 w-full rounded-2xl bg-black/30 p-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </section>

        {/* output */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Output</h2>
            <button
              onClick={saveHistory}
              disabled={!finalPrompt}
              className="rounded-full bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"
            >
              Save
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold text-white/70">Final Prompt</div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-white/90">
              {finalPrompt || "— isi prompt untuk melihat hasil —"}
            </pre>
          </div>

          <div className="mt-3 rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold text-white/70">
              Caption + 5 Hashtag
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-white/90">
              {captionBlock || "— isi prompt untuk melihat caption —"}
            </pre>
          </div>
        </section>

        {/* history */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">History</h2>
          <div className="mt-3 space-y-2">
            {history.length === 0 ? (
              <div className="rounded-2xl bg-black/30 p-3 text-sm text-white/70 ring-1 ring-white/10">
                Belum ada history. Klik <b>Save</b> setelah prompt jadi.
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistory(item)}
                  className="w-full rounded-2xl bg-black/30 p-3 text-left ring-1 ring-white/10 hover:bg-black/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {STYLE_LABEL[item.preset]}
                    </div>
                    <div className="text-xs text-white/60">
                      {new Date(item.ts).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-white/80">
                    {(item.prompt || item.extra || "(tanpa isi)").slice(0, 120)}
                    {(item.prompt || item.extra || "").length > 120 ? "…" : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* toast */}
        {toast ? (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white ring-1 ring-white/10 backdrop-blur">
            {toast}
          </div>
        ) : null}

        {/* bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0f16]/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-3">
            <button
              onClick={() => copyText(finalPrompt)}
              disabled={!finalPrompt}
              className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 disabled:opacity-40"
            >
              Copy Prompt
            </button>
            <button
              onClick={() => copyText(captionBlock)}
              disabled={!captionBlock}
              className="flex-1 rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Copy Caption
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
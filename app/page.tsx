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
    "cute quirky mascot character named Sweepy, expressive cartoon-like motion but realistic lighting, playful cleanup hero vibe, fun camera angles, short viral pacing",
  hanz:
    "realistic Indonesian male creator named Hanz, confident and expressive, natural UGC delivery, relatable daily setting, handheld feel but clean audio vibe, modern cinematic grade",
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

function clampHistory(list: HistoryItem[], max = 30) {
  return list.slice(0, max);
}

function buildHashtags(preset: StyleKey, tags: TagKey[]): string[] {
  const base = new Set<string>([
    "#sora",
    "#soraai",
    "#aivideo",
    "#prompt",
    "#contentcreator",
  ]);

  const tagToHash: Record<TagKey, string> = {
    horror: "#horor",
    daily: "#dailycontent",
    review: "#reviewproduk",
    lucu: "#lucu",
  };
  tags.forEach((t) => base.add(tagToHash[t]));

  const presetHash: Record<StyleKey, string[]> = {
    cinematic: ["#cinematic", "#filmmaking"],
    horror: ["#horror", "#creepy"],
    lucu: ["#comedy", "#viral"],
    ugc: ["#ugc", "#tiktokstyle"],
    doc: ["#documentary", "#storytelling"],
    broll: ["#broll", "#productshot"],
    weird: ["#weird", "#random"],
    sweepy: ["#sweepy", "#mascot"],
    hanz: ["#hanz", "#creator"],
  };
  presetHash[preset].forEach((h) => base.add(h));

  // ambil tepat 5 hashtag teratas yang relevan
  const arr = Array.from(base);
  // prioritas: preset + tag + sora
  const priority = [
    ...presetHash[preset],
    ...tags.map((t) => tagToHash[t]),
    "#sora",
    "#soraai",
  ];
  const sorted = [
    ...new Set(priority.filter((x) => arr.includes(x))),
    ...arr.filter((x) => !priority.includes(x)),
  ];
  return sorted.slice(0, 5);
}

function buildCaption(
  preset: StyleKey,
  tags: TagKey[],
  main: string,
  finalPrompt: string
): string {
  const isReview = tags.includes("review");
  const isHorror = tags.includes("horror");
  const isFunny = tags.includes("lucu");

  const presetLead: Record<StyleKey, string> = {
    cinematic: "Biar keliatan sinematik, coba scene begini:",
    horror: "Ini versi horor yang tetap aman dan seru:",
    lucu: "Versi lucu yang gampang bikin orang senyum:",
    ugc: "Versi UGC yang natural dan relatable:",
    doc: "Versi dokumenter yang berasa nyata:",
    broll: "B-roll clean, fokus detail visual:",
    weird: "Yang absurd tapi masih enak ditonton:",
    sweepy: "Sweepy mode ON — lucu, rapi, dan viral:",
    hanz: "Mode Hanz — creator vibe yang natural:",
  };

  const hook =
    preset === "review" || isReview
      ? "Singkat, jelas, dan enak buat konten."
      : "Singkat, jelas, dan siap ditembak ke Sora.";

  const vibeBits: string[] = [];
  if (isReview) vibeBits.push("soft selling halus");
  if (isHorror) vibeBits.push("vibe horor");
  if (isFunny) vibeBits.push("vibe lucu");
  if (!vibeBits.length) vibeBits.push("vibe daily");

  const vibeLine = `Tag: ${vibeBits.join(" • ")}`;

  // caption ringkas agar mobile-friendly
  return `${presetLead[preset]}\n${hook}\n${vibeLine}\n\n📝 Inti: ${main || "(isi adegan kamu)"}\n\n🎬 Prompt siap pakai:\n${finalPrompt}`;
}

function randomIdeaForPreset(preset: StyleKey): string {
  const common = [
    "adegan 10–15 detik, 1 lokasi, 1 aksi utama, ending punchline",
    "kamera handheld lembut + close-up ekspresi + cut cepat",
    "pakai teks overlay singkat, gaya viral",
  ];

  const ideas: Record<StyleKey, string[]> = {
    cinematic: [
      "Seorang creator membuka pintu rooftop saat golden hour, angin menerpa, kamera dolly-in pelan, ekspresi yakin, lalu cut ke cityscape yang dramatis.",
      "Close-up tangan menyalakan lampu neon di kamar, kamera follow ke wajah, mood tegas, cinematic color grading.",
    ],
    horror: [
      "Kamera dari belakang menonton TV, bayangan di layar mendekat, lalu berhenti saat karakter mengetuk kepala pakai remote—jadi lucu.",
      "Koridor gelap, lampu berkedip, suara langkah, tiba-tiba ada kucing lewat—tension pecah jadi komedi.",
    ],
    lucu: [
      "Karakter salah paham tutorial, malah bikin hasil kocak, reaction berlebihan, ending freeze-frame.",
      "Mukbang ‘sehat’ tapi ekspresi kepedesan, terus caption ‘ini sehat… katanya’.",
    ],
    ugc: [
      "Review singkat: ‘ini yang bikin beda…’ sambil demo 1 fitur, lalu close-up detail, ending CTA halus.",
      "POV pagi hari: bikin kopi, outfit sederhana, kasih 1 tips cepat, cut to result.",
    ],
    doc: [
      "Mini dokumenter 12 detik: before-after sebuah tempat, narasi fakta singkat, ambient sound natural.",
      "Close-up tekstur benda, lalu wide shot lokasi, teks info 1 kalimat.",
    ],
    broll: [
      "B-roll detail: macro tekstur, tilt-up perlahan, highlight pantulan cahaya, 3 shot cepat.",
      "Produk di meja, tangan masuk frame, 2 angle, 1 slow motion, clean look.",
    ],
    weird: [
      "Benda biasa tiba-tiba bertingkah seolah hidup, kamera follow, punchline di akhir.",
      "Orang serius ngobrol dengan benda random (misal sendok), tiba-tiba benda jawab (tanpa suara), teks overlay lucu.",
    ],
    sweepy: [
      "Sweepy bersihin kamar, tapi tiap sapuan bikin ‘sparkle’, tiba-tiba muncul ‘monster debu’ lucu, Sweepy tepok pakai pel—monster kabur.",
      "Sweepy jadi ‘hero kebersihan’ di dapur, slow motion buang sampah, ending pose kemenangan.",
    ],
    hanz: [
      "Hanz UGC: ‘Gue coba ini 3 hari…’ cut cepat day 1–3, ending hasil singkat + CTA halus.",
      "Hanz bikin konten di gang hujan gerimis, lighting soft, voiceover tenang, vibe premium tapi relatable.",
    ],
  };

  const pick = ideas[preset][Math.floor(Math.random() * ideas[preset].length)];
  const hint = common[Math.floor(Math.random() * common.length)];
  return `${pick}\n\nCatatan: ${hint}`;
}

export default function Page() {
  const [preset, setPreset] = useState<StyleKey>("cinematic");
  const [activeTags, setActiveTags] = useState<TagKey[]>(["daily"]);
  const [prompt, setPrompt] = useState("");
  const [extra, setExtra] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string>("");

  // Load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sora_lite_history_v2");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Save history
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

    const parts = [
      `STYLE: ${base}`,
      main ? `SCENE: ${main}` : "",
      ex ? `DETAILS: ${ex}` : "",
      "OUTPUT: 10–15 seconds, vertical 9:16, high quality, clean motion, readable composition",
    ].filter(Boolean);

    return parts.join("\n");
  }, [preset, prompt, extra]);

  const captionAndHashtags = useMemo(() => {
    if (!prompt.trim() && !finalPrompt) return "";
    const tags: TagKey[] = activeTags.length ? activeTags : ["daily"];
    const cap = buildCaption(preset, tags, prompt.trim(), finalPrompt);
    const hash = buildHashtags(preset, tags).join(" ");
    return `${cap}\n\n${hash}`;
  }, [preset, activeTags, prompt, finalPrompt]);

  function toggleTag(tag: TagKey) {
    setActiveTags((prev) => {
      const has = prev.includes(tag);
      const next = has ? prev.filter((t) => t !== tag) : [...prev, tag];
      return next.length ? next : ["daily"];
    });
  }

  async function copy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast("✅ Disalin");
      setTimeout(() => setToast(""), 1200);
    } catch {
      setToast("⚠️ Gagal copy (browser)");
      setTimeout(() => setToast(""), 1200);
    }
  }

  function saveToHistory() {
    if (!finalPrompt.trim()) return;
    const item: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
      preset,
      tags: activeTags.length ? activeTags : ["daily"],
      prompt: prompt.trim(),
      extra: extra.trim(),
      finalPrompt,
    };
    setHistory((prev) => clampHistory([item, ...prev], 30));
    setToast("✅ Tersimpan ke History");
    setTimeout(() => setToast(""), 1200);
  }

  function clearHistory() {
    if (!confirm("Hapus semua history?")) return;
    setHistory([]);
    setToast("🗑️ History dihapus");
    setTimeout(() => setToast(""), 1200);
  }

  function applyHistory(item: HistoryItem) {
    setPreset(item.preset);
    setActiveTags(item.tags?.length ? item.tags : ["daily"]);
    setPrompt(item.prompt || "");
    setExtra(item.extra || "");
    setToast("↩️ Loaded dari History");
    setTimeout(() => setToast(""), 1200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function randomIdea() {
    setPrompt(randomIdeaForPreset(preset));
    setToast("🎲 Random idea dibuat");
    setTimeout(() => setToast(""), 1200);
  }

  return (
    <main className="min-h-screen bg-[#0b0f16] text-white">
      {/* Soft glow background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-4 pb-28 pt-6">
        <header className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Sora Lite — Prompt Builder
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Preset + Tag + Caption + 5 Hashtag + History (local).
              </p>
            </div>
            <button
              onClick={randomIdea}
              className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 active:scale-[0.98]"
            >
              🎲 Random Idea
            </button>
          </div>
        </header>

        {/* Preset */}
        <section className="rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">Preset Style</h2>
          <p className="mt-1 text-sm text-white/70">
            Pilih gaya visual. Ada juga preset <b>B-roll</b> (tanpa karakter),
            <b> Weird</b>, plus karakter <b>Sweepy</b> & <b>Hanz</b>.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {STYLE_ORDER.map((key) => {
              const active = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    "ring-1 ring-white/10",
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
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/90">
              {STYLE_PRESETS[preset]}
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">Tag</h2>
          <p className="mt-1 text-sm text-white/70">Klik untuk aktif/nonaktif.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const active = activeTags.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => toggleTag(t.key)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    "ring-1 ring-white/10",
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

        {/* Prompt inputs */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <h2 className="text-base font-semibold">Prompt Utama</h2>
          <p className="mt-1 text-sm text-white/70">Isi inti adegan / cerita.</p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Contoh: Karakter monyet hoodie lucu sedang membersihkan selokan penuh sampah plastik..."
            className="mt-3 w-full rounded-2xl bg-black/30 p-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />

          <div className="mt-4">
            <h3 className="text-sm font-semibold">Extra (Opsional)</h3>
            <p className="mt-1 text-sm text-white/70">
              Detail tambahan: durasi, angle kamera, lighting, teks overlay, dll.
            </p>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              placeholder="Contoh: 9:16, kamera dari belakang, slow push-in, teks overlay singkat, NO watermark..."
              className="mt-3 w-full rounded-2xl bg-black/30 p-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
          </div>
        </section>

        {/* Output */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Output</h2>
            <div className="flex gap-2">
              <button
                onClick={() => copy(finalPrompt)}
                disabled={!finalPrompt}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/10 disabled:opacity-40"
              >
                Copy Prompt
              </button>
              <button
                onClick={() => copy(captionAndHashtags)}
                disabled={!captionAndHashtags}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/10 disabled:opacity-40"
              >
                Copy Caption+Tag
              </button>
              <button
                onClick={saveToHistory}
                disabled={!finalPrompt}
                className="rounded-full bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"
              >
                Save
              </button>
            </div>
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
              {captionAndHashtags || "— isi prompt untuk melihat caption + hashtag —"}
            </pre>
          </div>
        </section>

        {/* History */}
        <section className="mt-4 rounded-3xl bg-white/5 p-4 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">History</h2>
            <button
              onClick={clearHistory}
              className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {history.length === 0 ? (
              <div className="rounded-2xl bg-black/30 p-3 text-sm text-white/70 ring-1 ring-white/10">
                Belum ada history. Klik <b>Save</b> setelah prompt jadi.
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => applyHistory(item)}
                  className="w-full rounded-2xl bg-black/30 p-3 text-left ring-1 ring-white/10 hover:bg-black/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      {STYLE_LABEL[item.preset]}
                    </div>
                    <div className="text-xs text-white/60">
                      {new Date(item.ts).toLocaleString("id-ID")}
                    </div>
                  </
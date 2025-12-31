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

const STYLE_LABEL: Record<StyleKey, string> = {
  cinematic: "Cinematic",
  horror: "Horror",
  lucu: "Lucu",
  ugc: "UGC",
  doc: "Doc",
  broll: "B-roll (No Character)",
  weird: "Weird / Random",
  sweepy: "Sweepy ✍️",
  hanz: "Hanz 👤",
};

const STYLE_PRESETS: Record<StyleKey, string> = {
  cinematic:
    "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting, professional color grading",
  horror:
    "cinematic horror, low-key lighting, eerie shadows, suspenseful pacing, cold color temperature, creepy ambience (NO extreme gore), subtle camera shake",
  lucu:
    "funny, lighthearted, comedic timing, playful expressions, punchy pacing, satisfying visual gag, friendly vibe",
  ugc:
    "UGC style, handheld phone camera feel, natural lighting, casual authentic tone, quick cuts, relatable everyday scene, minimal cinematic stylization",
  doc: "documentary style, realistic, observational camera, natural lighting, grounded details, informative tone, clean composition",
  broll:
    "B-roll sequence, no character, aesthetic establishing shots, smooth camera movement, product/scene focus, natural light, clean framing",
  weird:
    "absurd surreal idea, unexpected twist, weird-but-funny, dreamlike logic, odd props, surprising reveal, safe and playful",
  sweepy:
    "cute quirky mascot character named Sweepy, playful cleanup hero vibe, expressive motion, fun camera angles, short viral pacing, realistic lighting",
  hanz: "character @hanz26 as the on-camera host, energetic, friendly, confident, natural Indonesian vibe, clear delivery, creator-style pacing, realistic lighting",
};

const TAGS = ["horror", "daily", "review", "lucu"] as const;
type TagKey = (typeof TAGS)[number];

const NICHES = ["general", "kesehatan", "fitness", "skincare", "nutrition"] as const;
type NicheKey = (typeof NICHES)[number];

const NICHE_LABEL: Record<NicheKey, string> = {
  general: "General",
  kesehatan: "Kesehatan",
  fitness: "Fitness",
  skincare: "Skincare",
  nutrition: "Nutrition",
};

const NICHE_HINT: Record<NicheKey, string> = {
  general: "Cocok untuk ide konten apa pun.",
  kesehatan: "Fokus edukasi kesehatan ringan, aman, dan tidak klaim berlebihan.",
  fitness: "Gaya gym/olahraga, form, tips latihan, motivasi.",
  skincare: "Skincare routine, before-after (tanpa klaim medis), tekstur & pemakaian.",
  nutrition: "Makan sehat, meal prep, fakta gizi, tips minum air.",
};

type HistoryItem = {
  id: string;
  ts: number;
  style: StyleKey;
  niche: NicheKey;
  tags: TagKey[];
  prompt: string;
  extra: string;
  finalPrompt: string;
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uniqueTop5Hashtags(base: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of base) {
    const key = h.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(h.startsWith("#") ? h : `#${h}`);
    }
    if (out.length >= 5) break;
  }
  while (out.length < 5) out.push(`#sora`);
  return out.slice(0, 5);
}

function buildHashtags(style: StyleKey, niche: NicheKey, tags: TagKey[]): string[] {
  const base: string[] = ["sora", "soraai", "aivideo", "prompt", "creator"];

  // style
  if (style === "horror") base.push("horror");
  if (style === "ugc") base.push("ugc");
  if (style === "cinematic") base.push("cinematic");
  if (style === "doc") base.push("documentary");
  if (style === "lucu") base.push("lucu");
  if (style === "broll") base.push("broll");
  if (style === "weird") base.push("random");
  if (style === "sweepy") base.push("sweepy");
  if (style === "hanz") base.push("hanz26");

  // niche
  if (niche !== "general") base.push(niche);

  // tags
  base.push(...tags);

  return uniqueTop5Hashtags(base);
}

function buildCaption(style: StyleKey, niche: NicheKey, tags: TagKey[], prompt: string): string {
  const tagText = tags.length ? tags.map((t) => `#${t}`).join(" ") : "#daily";
  const nicheLine = niche !== "general" ? `Niche: ${NICHE_LABEL[niche]}` : "Niche: General";

  const vibe =
    style === "horror"
      ? "Versi horror tapi tetap aman 😄"
      : style === "lucu"
      ? "Versi lucu biar viral 😄"
      : style === "ugc"
      ? "UGC natural, relatable ✨"
      : style === "doc"
      ? "Gaya dokumenter, realistis 🎥"
      : style === "broll"
      ? "B-roll estetik, no character 📸"
      : style === "weird"
      ? "Ide absurd tapi seru 🤯"
      : style === "sweepy"
      ? "Sweepy mode ON ✍️"
      : "Host @hanz26 mode ON 👤";

  const short = prompt.trim().slice(0, 120);
  return `${vibe}\n${nicheLine}\n\n${short}${short.length >= 120 ? "..." : ""}\n\n${tagText}`;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeAutoIdea(style: StyleKey, niche: NicheKey): { prompt: string; extra: string } {
  const healthIdeas = [
    "Bikin video 15 detik: mitos vs fakta tentang minum air putih, 1 fakta mengejutkan, ending ajakan simpel",
    "Tips 1 kebiasaan kecil setelah makan berat yang sering bikin badan gak enak, 3 poin cepat",
    "Mini edukasi: tanda dehidrasi yang sering dianggap sepele, format list 3 poin",
  ];
  const fitnessIdeas = [
    "1 gerakan latihan yang sering salah (contoh squat), tunjukkan salah 1 detik lalu bener 3 detik, ending tips",
    "Rutinitas 10 detik pemanasan sebelum workout, cepat, jelas, dan aman",
    "Motivasi singkat: 'konsisten lebih penting dari sempurna', dengan visual sebelum latihan",
  ];
  const skincareIdeas = [
    "Skincare routine 3 langkah malam hari, fokus tekstur produk & cara apply, no klaim medis",
    "Kesalahan umum pakai sunscreen, 2 poin, ending reminder reapply",
    "Before-after lighting check (bukan klaim), tunjukkan perbedaan pencahayaan biar jujur",
  ];
  const nutritionIdeas = [
    "Meal prep 15 detik: 1 menu sehat sederhana, potong cepat, plating rapi",
    "Tips ngemil sehat: 3 opsi, cepat, real, no overclaim",
    "Cara baca label gizi: fokus 1 hal (gula) dengan contoh sederhana",
  ];

  const generalIdeas = [
    "Karakter monyet hoodie lucu membersihkan selokan kecil penuh sampah plastik, timelapse 15 detik",
    "Review produk dengan soft selling, 3 poin cepat, ending CTA halus",
    "B-roll suasana tempat nongkrong pinggir kali, slow motion, cinematic calm",
  ];

  const pickByNiche =
    niche === "kesehatan"
      ? healthIdeas
      : niche === "fitness"
      ? fitnessIdeas
      : niche === "skincare"
      ? skincareIdeas
      : niche === "nutrition"
      ? nutritionIdeas
      : generalIdeas;

  // style twist
  const core = randomPick(pickByNiche);
  const styleTwist =
    style === "horror"
      ? "Bungkus gaya horror lucu (aman, tanpa gore)."
      : style === "cinematic"
      ? "Buat sinematik high-end."
      : style === "ugc"
      ? "Buat gaya UGC santai dan natural."
      : style === "doc"
      ? "Buat gaya dokumenter realistis."
      : style === "broll"
      ? "Buat jadi b-roll no character, fokus ambience."
      : style === "weird"
      ? "Tambahkan twist absurd yang tetap aman dan lucu."
      : style === "sweepy"
      ? "Gunakan karakter Sweepy sebagai pusat aksi."
      : "Gunakan @hanz26 sebagai host, ngomong bahasa Indonesia.";

  const extra = [
    "Durasi 10–15 detik, 9:16, pacing cepat, fokus 1 ide utama",
    "Camera: handheld ringan / dolly halus sesuai style",
    "Lighting: soft, realistic, no overexposure",
    "Tambahkan teks overlay 3–6 kata per beat",
  ].join(", ");

  return { prompt: `${core}\n${styleTwist}`, extra };
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function Page() {
  const [style, setStyle] = useState<StyleKey>("cinematic");
  const [niche, setNiche] = useState<NicheKey>("general");
  const [activeTags, setActiveTags] = useState<TagKey[]>(["daily"]);
  const [prompt, setPrompt] = useState("");
  const [extra, setExtra] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history
  useEffect(() => {
    const h = safeJsonParse<HistoryItem[]>(localStorage.getItem("sora_lite_history_v2"), []);
    setHistory(h);
  }, []);

  // Persist history
  useEffect(() => {
    localStorage.setItem("sora_lite_history_v2", JSON.stringify(history.slice(0, 50)));
  }, [history]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const presetDetail = STYLE_PRESETS[style];

  const finalPrompt = useMemo(() => {
    const tags = activeTags.length ? activeTags : (["daily"] as TagKey[]);
    const nicheLine =
      niche === "general"
        ? ""
        : `Niche focus: ${NICHE_LABEL[niche]} (${NICHE_HINT[niche]}).`;

    const core = prompt.trim();
    const ex = extra.trim();
    const parts = [
      `STYLE PRESET: ${STYLE_LABEL[style]} — ${presetDetail}`,
      nicheLine,
      tags.length ? `TAGS: ${tags.join(", ")}` : "",
      core ? `MAIN: ${core}` : "",
      ex ? `EXTRA: ${ex}` : "",
      "Output: realistic, high detail, safe content, avoid gore/graphic violence, avoid medical claims.",
      "Format: 9:16 vertical, 10–15 seconds, clear subject, stable composition.",
    ].filter(Boolean);

    return parts.join("\n");
  }, [style, presetDetail, niche, activeTags, prompt, extra]);

  const captionAndHashtags = useMemo(() => {
    const tags = activeTags.length ? activeTags : (["daily"] as TagKey[]);
    const cap = buildCaption(style, niche, tags, prompt || finalPrompt);
    const hash = buildHashtags(style, niche, tags).join(" ");
    return `${cap}\n\n${hash}`;
  }, [style, niche, activeTags, prompt, finalPrompt]);

  function toggleTag(t: TagKey) {
    setActiveTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      return next.length ? next : (["daily"] as TagKey[]);
    });
  }

  function clearAll() {
    setPrompt("");
    setExtra("");
    setActiveTags(["daily"]);
    setNiche("general");
    setStyle("cinematic");
    setToast("Cleared ✅");
  }

  function autoGenerate() {
    const idea = makeAutoIdea(style, niche);
    setPrompt(idea.prompt);
    setExtra(idea.extra);
    setToast("Auto generated ✨");
  }

  function saveToHistory() {
    const item: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
      style,
      niche,
      tags: activeTags.length ? activeTags : (["daily"] as TagKey[]),
      prompt,
      extra,
      finalPrompt,
    };
    setHistory((prev) => [item, ...prev].slice(0, 50));
    setToast("Saved to history ✅");
  }

  function loadHistoryItem(item: HistoryItem) {
    setStyle(item.style);
    setNiche(item.niche);
    setActiveTags(item.tags.length ? item.tags : (["daily"] as TagKey[]));
    setPrompt(item.prompt);
    setExtra(item.extra);
    setToast("Loaded ✅");
  }

  function deleteHistoryItem(id: string) {
    setHistory((prev) => prev.filter((x) => x.id !== id));
    setToast("Deleted 🗑️");
  }

  async function handleCopyPrompt() {
    const ok = await copyToClipboard(finalPrompt);
    setToast(ok ? "Copied prompt ✅" : "Copy failed ❌");
    if (ok) saveToHistory();
  }

  async function handleCopyCaption() {
    const ok = await copyToClipboard(captionAndHashtags);
    setToast(ok ? "Copied caption ✅" : "Copy failed ❌");
    if (ok) saveToHistory();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_45%),radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.12),_transparent_45%),#070A10] text-white">
      <div className="mx-auto w-full max-w-[980px] px-4 pb-28 pt-7">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sora Lite — Prompt Builder
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Preset + Niche + Tag + Caption + 5 Hashtag + History (local).
          </p>
        </header>

        {/* Cards grid */}
        <div className="grid gap-4">
          {/* Preset card */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Preset Style</h2>
                <p className="mt-1 text-xs text-white/65">
                  Pilih gaya visual. Sweepy/Hanz adalah preset karakter.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={autoGenerate}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black shadow hover:brightness-110 active:brightness-95"
                >
                  Auto Generate
                </button>
                <button
                  onClick={clearAll}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  "cinematic",
                  "horror",
                  "lucu",
                  "ugc",
                  "doc",
                  "broll",
                  "weird",
                  "sweepy",
                  "hanz",
                ] as StyleKey[]
              ).map((k) => (
                <button
                  key={k}
                  onClick={() => setStyle(k)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    style === k
                      ? "bg-emerald-400 text-black shadow"
                      : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10",
                  ].join(" ")}
                >
                  {STYLE_LABEL[k]}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-semibold text-white/70">Preset detail</div>
              <div className="mt-2 text-sm leading-relaxed text-white/90">{presetDetail}</div>
            </div>
          </section>

          {/* Niche card */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-semibold">Niche</h2>
            <p className="mt-1 text-xs text-white/65">
              Ini selalu bisa dipilih, termasuk saat Sweepy/Hanz aktif.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(NICHES as readonly NicheKey[]).map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    niche === n
                      ? "bg-sky-300 text-black shadow"
                      : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10",
                  ].join(" ")}
                >
                  {NICHE_LABEL[n]}
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-white/70">
              <span className="font-semibold">Hint:</span> {NICHE_HINT[niche]}
            </div>
          </section>

          {/* Tag card */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-semibold">Tag</h2>
            <p className="mt-1 text-xs text-white/65">Klik untuk aktif/nonaktif. Default: daily</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    activeTags.includes(t)
                      ? "bg-emerald-400 text-black shadow"
                      : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Inputs */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="text-lg font-semibold">Prompt Utama</h2>
              <p className="mt-1 text-xs text-white/65">Isi inti adegan / cerita.</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Karakter monyet hoodie lucu sedang membersihkan selokan kecil penuh sampah plastik, timelapse 15 detik..."
                className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400/60"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="text-lg font-semibold">Extra (Opsional)</h2>
              <p className="mt-1 text-xs text-white/65">Detail tambahan: kamera, lighting, mood, teks.</p>
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Camera, lighting, mood..."
                className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400/60"
              />
            </div>
          </section>

          {/* Outputs */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Final Prompt</h2>
                <button
                  onClick={handleCopyPrompt}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black shadow hover:brightness-110 active:brightness-95"
                >
                  Copy Prompt
                </button>
              </div>
              <pre className="mt-3 max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-white/90">
                {finalPrompt}
              </pre>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Caption + Hashtags</h2>
                <button
                  onClick={handleCopyCaption}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  Copy Caption
                </button>
              </div>
              <pre className="mt-3 max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-white/90">
                {captionAndHashtags}
              </pre>
            </div>
          </section>

          {/* History */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">History (Local)</h2>
              <button
                onClick={() => {
                  localStorage.removeItem("sora_lite_history_v2");
                  setHistory([]);
                  setToast("History cleared ✅");
                }}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
              >
                Clear History
              </button>
            </div>

            {history.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">
                Belum ada history. Nanti otomatis tersimpan saat kamu Copy Prompt/Caption.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {history.slice(0, 10).map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white/80">
                          {STYLE_LABEL[h.style]} • {NICHE_LABEL[h.niche]}
                        </div>
                        <div className="mt-1 text-[11px] text-white/55">
                          {new Date(h.ts).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadHistoryItem(h)}
                          className="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-black"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(h.id)}
                          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                        >
                          Del
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-white/70">
                      Tags: {h.tags.length ? h.tags.join(", ") : "daily"}
                    </div>

                    <div className="mt-2 line-clamp-3 text-sm text-white/85">
                      {h.prompt || "(no prompt)"}{" "}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow backdrop-blur">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
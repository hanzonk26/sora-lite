"use client";

import { useEffect, useState } from "react";

/* =====================
   TYPES
===================== */
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

/* =====================
   PRESETS
===================== */
const STYLE_PRESETS: Record<StyleKey, string> = {
  cinematic:
    "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly movement, dramatic lighting, professional color grading",
  horror:
    "cinematic horror mood, low-key lighting, eerie shadow, slow camera push, suspenseful pacing, creepy but not extreme",
  lucu:
    "funny light-hearted tone, expressive motion, playful timing, bright lighting, comedic framing",
  ugc:
    "UGC creator style, handheld camera, natural lighting, authentic daily vibe, relatable tone",
  doc:
    "short documentary style, informative tone, clean framing, calm camera movement, natural ambience",
  broll:
    "b-roll only, no character, clean composition, smooth motion, cinematic detail shots",
  weird:
    "absurd weird concept, unexpected combination, surreal humor, experimental camera",
  sweepy:
    "cute quirky mascot character named Sweepy, playful cleanup hero vibe, expressive motion, fun camera angles, short viral pacing",
  hanz:
    "realistic Indonesian male character named Hanz, confident and expressive, UGC creator style, natural lighting, cinematic but relatable",
};

const LABELS: Record<StyleKey, string> = {
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

/* =====================
   IDEA BANK
===================== */
const IDEA_BANK: Record<StyleKey, string[]> = {
  cinematic: [
    "Seorang kreator membuka pintu ruangan gelap, cahaya sinematik menyembur dari dalam, kamera slow push-in.",
    "Close-up tangan menaruh produk, cut ke detail tekstur, reveal hasil akhir.",
  ],
  horror: [
    "Sweepy menonton TV horor, sosok di layar mendekat, Sweepy ketok kepala pakai remote.",
    "Lorong gelap, suara langkah, ternyata cuma kucing lewat — jumpscare lucu.",
  ],
  lucu: [
    "Karakter panik cari remote, ternyata dari tadi ada di tangan sendiri.",
    "Hanz serius bicara, tapi teks overlay-nya makin absurd.",
  ],
  ugc: [
    "Hanz: 'Gue kasih satu trik biar prompt lo hidup…' lalu contoh singkat.",
    "Masalah → solusi → hasil, gaya santai dan jujur.",
  ],
  doc: [
    "Mini dokumenter 15 detik: suasana, detail, narasi singkat.",
    "B-roll + fakta cepat, tone informatif.",
  ],
  broll: [
    "B-roll produk: macro detail, slow motion, soft light.",
    "B-roll suasana: panning pelan, ambience alami.",
  ],
  weird: [
    "Monyet pakai jas hujan mini jadi petugas kebersihan profesional.",
    "Rapat serius manusia dan monyet bahas pisang vs kopi.",
  ],
  sweepy: [
    "Sweepy membersihkan lingkungan, menemukan portal dari tumpukan kardus.",
    "Sweepy menegur sampah plastik seolah orang.",
  ],
  hanz: [
    "Hanz bikin intro UGC lalu reveal hasil prompt cinematic.",
    "Rutinitas pagi Hanz, 3 cut cepat, caption rapi.",
  ],
};

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* =====================
   COMPONENT
===================== */
export default function Page() {
  const [preset, setPreset] = useState<StyleKey>("cinematic");
  const [prompt, setPrompt] = useState("");
  const [extra, setExtra] = useState("");
  const [tag, setTag] = useState<TagKey>("daily");
  const [toast, setToast] = useState("");

  function autoGenerate() {
    setPrompt(pickRandom(IDEA_BANK[preset]));
    if (!extra) {
      setExtra("camera natural, lighting soft, no watermark, clean motion");
    }
    setToast("✨ Auto idea dibuat");
    setTimeout(() => setToast(""), 1200);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0f16] to-[#06080d] text-white">
      <div className="mx-auto max-w-md px-4 py-6 space-y-6">
        {/* HEADER */}
        <header>
          <h1 className="text-2xl font-bold">Sora Lite — Prompt Builder</h1>
          <p className="text-sm opacity-70">
            Preset + Tag + Caption + 5 Hashtag
          </p>
        </header>

        {/* PRESET */}
        <section className="rounded-2xl bg-white/5 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Preset Style</h2>
            <div className="flex gap-2">
              <button
                onClick={autoGenerate}
                className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black"
              >
                Auto Generate
              </button>
              <button
                onClick={() => {
                  setPrompt("");
                  setExtra("");
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-xs"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(STYLE_PRESETS) as StyleKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`rounded-full px-3 py-2 text-xs ${
                  preset === key
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10"
                }`}
              >
                {LABELS[key]}
              </button>
            ))}
          </div>

          <div className="text-xs opacity-80">
            {STYLE_PRESETS[preset]}
          </div>
        </section>

        {/* TAG */}
        <section className="rounded-2xl bg-white/5 p-4 space-y-2">
          <h2 className="font-semibold">Tag</h2>
          <div className="flex gap-2">
            {TAGS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTag(t.key)}
                className={`rounded-full px-3 py-1 text-xs ${
                  tag === t.key
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* PROMPT */}
        <section className="rounded-2xl bg-white/5 p-4 space-y-2">
          <h2 className="font-semibold">Prompt Utama</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-black/40 p-3 text-sm outline-none"
            placeholder="Isi inti adegan / cerita..."
          />
        </section>

        {/* EXTRA */}
        <section className="rounded-2xl bg-white/5 p-4 space-y-2">
          <h2 className="font-semibold">Extra (Opsional)</h2>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-black/40 p-3 text-sm outline-none"
            placeholder="Camera, lighting, mood..."
          />
        </section>

        {/* ACTION */}
        <footer className="grid grid-cols-2 gap-3">
          <button className="rounded-xl bg-white/10 py-3 text-sm">
            Copy Prompt
          </button>
          <button className="rounded-xl bg-emerald-500 py-3 text-sm text-black font-semibold">
            Copy Caption
          </button>
        </footer>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs">
          {toast}
        </div>
      )}
    </main>
  );
}
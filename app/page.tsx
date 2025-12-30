"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type StyleKey = "cinematic" | "horror" | "funny" | "ugc" | "doc" | "broll" | "weird";
type TagKey = "horror" | "daily" | "review" | "lucu";

const STYLE_PRESETS: Record<StyleKey, { label: string; hint: string; prompt: string }> = {
  cinematic: {
    label: "Cinematic",
    hint: "Look film, dramatis, high-end",
    prompt:
      "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting, professional color grading",
  },
  horror: {
    label: "Horror",
    hint: "Seram tapi aman (tanpa gore berlebihan)",
    prompt:
      "cinematic horror, low-key lighting, eerie shadows, subtle camera shake, suspenseful pacing, cold color temperature, creepy ambience (NO extreme gore), realistic atmosphere",
  },
  funny: {
    label: "Lucu",
    hint: "Komedi ringan, timing bagus",
    prompt:
      "comedic timing, playful mood, lighthearted reactions, expressive facial animation, quick punchline pacing, fun camera beats, bright but natural lighting",
  },
  ugc: {
    label: "UGC",
    hint: "Natural, handheld, relatable",
    prompt:
      "UGC style, handheld phone camera, natural room light, casual authentic vibe, slight camera shake, real-life imperfect framing, clear subject focus, realistic skin tones",
  },
  doc: {
    label: "Doc",
    hint: "Dokumenter, informatif",
    prompt:
      "documentary style, natural lighting, observational camera, realistic color, minimal stylization, clear storytelling shots, ambient sound feel",
  },
  // ✅ preset umum tanpa karakter spesifik
  broll: {
    label: "B-roll (No Character)",
    hint: "Shot produk / tempat / suasana, cocok buat konten cepat",
    prompt:
      "clean b-roll sequence, no specific character, smooth gimbal shots, macro details, product highlights, environment establishing shot, crisp focus, commercial quality, minimal text, natural light",
  },
  // ✅ random aneh-aneh
  weird: {
    label: "Weird / Random",
    hint: "Aneh tapi viral, absurd yang lucu",
    prompt:
      "surreal but family-friendly, weird comedic scenario, unexpected twist, quirky props, playful absurdity, cinematic but humorous, safe content, high detail, smooth motion",
  },
};

const TAGS: { key: TagKey; label: string }[] = [
  { key: "horror", label: "horror" },
  { key: "daily", label: "daily" },
  { key: "review", label: "review" },
  { key: "lucu", label: "lucu" },
];

type SavedItem = {
  id: string;
  createdAt: number;
  title: string;
  preset: StyleKey;
  tags: TagKey[];
  basePrompt: string;
  extraPrompt: string;
};

const LS_KEY = "sora_lite_saved_prompts_v2";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function buildFinalPrompt(preset: StyleKey, basePrompt: string, extraPrompt: string) {
  const a = normalizeSpaces(basePrompt);
  const b = normalizeSpaces(extraPrompt);
  const style = STYLE_PRESETS[preset].prompt;

  // Format yang enak dipakai di Sora:
  // 1) inti adegan (base)
  // 2) style / cinematic rules (preset)
  // 3) tambahan (extra)
  const parts = [
    a ? a : "",
    style ? `Style: ${style}` : "",
    b ? `Extra: ${b}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

function buildCaption(preset: StyleKey, tags: TagKey[], basePrompt: string, extraPrompt: string) {
  const tagLine = tags.length ? tags : (["daily"] as TagKey[]);
  const tone =
    preset === "horror"
      ? "Serem-serem dikit, tapi tetap aman 😄"
      : preset === "funny" || preset === "weird"
      ? "Yang penting ngakak dulu 😆"
      : preset === "ugc"
      ? "Vibes-nya natural banget."
      : preset === "doc"
      ? "Biar berasa dokumenter beneran."
      : preset === "broll"
      ? "B-roll clean, cocok buat konten cepat."
      : "Cinematic mode on 🎬";

  const core = normalizeSpaces(basePrompt);
  const extra = normalizeSpaces(extraPrompt);

  // Caption Indonesia, singkat, relevan
  const lines: string[] = [];
  lines.push(tone);
  if (core) lines.push(`Scene: ${core}`);
  if (extra) lines.push(`Detail: ${extra}`);
  lines.push(`Tag: ${tagLine.join(" / ")}`);
  lines.push("Kalau kamu mau versi lain (lebih cepat / lebih lucu / lebih dark), bilang ya.");

  return lines.join("\n");
}

function buildHashtags(preset: StyleKey, tags: TagKey[]) {
  const base = new Set<string>();

  // selalu 2-3 umum
  base.add("#sora");
  base.add("#aivideo");
  base.add("#kontenAI");

  // preset-based
  if (preset === "horror") base.add("#horror");
  if (preset === "ugc") base.add("#ugc");
  if (preset === "doc") base.add("#dokumenter");
  if (preset === "broll") base.add("#broll");
  if (preset === "cinematic") base.add("#cinematic");
  if (preset === "funny" || preset === "weird") base.add("#lucu");

  // tag-based
  for (const t of tags) {
    if (t === "daily") base.add("#daily");
    if (t === "review") base.add("#review");
    if (t === "horror") base.add("#horror");
    if (t === "lucu") base.add("#lucu");
  }

  // pastikan tepat 5 hashtag
  const arr = Array.from(base);
  return arr.slice(0, 5);
}

function safeParseSaved(raw: string | null): SavedItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const preset = (x.preset ?? "cinematic") as StyleKey;
        const tags = Array.isArray(x.tags) ? (x.tags as TagKey[]) : ([] as TagKey[]);
        return {
          id: String(x.id ?? uid()),
          createdAt: Number(x.createdAt ?? Date.now()),
          title: String(x.title ?? "Untitled"),
          preset,
          tags,
          basePrompt: String(x.basePrompt ?? ""),
          extraPrompt: String(x.extraPrompt ?? ""),
        } satisfies SavedItem;
      })
      .filter(Boolean) as SavedItem[];
  } catch {
    return [];
  }
}

export default function Page() {
  const [preset, setPreset] = useState<StyleKey>("cinematic");
  const [activeTags, setActiveTags] = useState<TagKey[]>(["daily"]);
  const [basePrompt, setBasePrompt] = useState<string>("");
  const [extraPrompt, setExtraPrompt] = useState<string>("");

  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  const toastTimer = useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1600);
  }

  useEffect(() => {
    const initial = safeParseSaved(typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null);
    setSaved(initial.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }, [saved]);

  const finalPrompt = useMemo(() => {
    return buildFinalPrompt(preset, basePrompt, extraPrompt);
  }, [preset, basePrompt, extraPrompt]);

  const captionPack = useMemo(() => {
    const tags: TagKey[] = activeTags.length ? activeTags : ["daily"];
    const cap = buildCaption(preset, tags, basePrompt, extraPrompt);
    const hash = buildHashtags(preset, tags).join(" ");
    return `${cap}\n\n${hash}`;
  }, [preset, activeTags, basePrompt, extraPrompt]);

  const filteredSaved = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter((s) => {
      const blob = `${s.title} ${s.preset} ${s.tags.join(" ")} ${s.basePrompt} ${s.extraPrompt}`.toLowerCase();
      return blob.includes(q);
    });
  }, [saved, search]);

  function toggleTag(tag: TagKey) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function copy(text: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(okMsg);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast(okMsg);
    }
  }

  function quickRandomIdea() {
    const ideas = [
      "Seekor monyet hoodie lucu dan seorang manusia sedang rebutan remote TV, lalu akur dan ketawa bareng.",
      "Seorang manusia memasak mie, tapi sendoknya berubah jadi mikrofon dan dia tiba-tiba nge-rap.",
      "Monyet kecil jadi ‘reviewer’ produk, lalu ada cutaway b-roll detail produk super niat.",
      "Suasana malam hujan, kamera dari belakang, ada bayangan aneh lewat… ternyata cuma kucing lucu.",
      "B-roll tangan membuka paket, close-up tekstur, lalu reveal hasilnya di meja dengan lighting clean.",
    ];
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    setBasePrompt(pick);
    showToast("Random idea dimasukkan.");
  }

  function saveCurrent() {
    const core = normalizeSpaces(basePrompt);
    if (!core) {
      showToast("Isi dulu prompt utamanya.");
      return;
    }
    const title =
      core.length > 42 ? core.slice(0, 42).trim() + "…" : core || "Prompt";

    const item: SavedItem = {
      id: uid(),
      createdAt: Date.now(),
      title,
      preset,
      tags: activeTags.length ? activeTags : ["daily"],
      basePrompt,
      extraPrompt,
    };

    setSaved((prev) => [item, ...prev]);
    showToast("Tersimpan ke history ✅");
  }

  function loadItem(item: SavedItem) {
    setPreset(item.preset);
    setActiveTags(item.tags.length ? item.tags : ["daily"]);
    setBasePrompt(item.basePrompt);
    setExtraPrompt(item.extraPrompt);
    showToast("Loaded dari history.");
  }

  function deleteItem(id: string) {
    setSaved((prev) => prev.filter((x) => x.id !== id));
    showToast("Dihapus.");
  }

  function clearAll() {
    setBasePrompt("");
    setExtraPrompt("");
    setActiveTags(["daily"]);
    showToast("Dibersihkan.");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Sora Lite – Prompt Builder</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Preset + Tag + Caption + 5 Hashtag + History (local).
          </p>
        </header>

        {/* Presets */}
        <section className="mb-6 rounded-2xl bg-neutral-900/60 p-4 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Preset Style</h2>
              <p className="text-sm text-neutral-300">
                Pilih gaya visual. Ada juga preset <b>B-roll</b> (tanpa karakter) dan <b>Weird</b> buat yang absurd.
              </p>
            </div>
            <button
              onClick={quickRandomIdea}
              className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-white"
            >
              Random Idea
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(STYLE_PRESETS) as StyleKey[]).map((k) => {
              const active = preset === k;
              return (
                <button
                  key={k}
                  onClick={() => setPreset(k)}
                  className={[
                    "rounded-full px-3 py-2 text-sm transition",
                    active
                      ? "bg-white text-neutral-950"
                      : "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
                  ].join(" ")}
                  title={STYLE_PRESETS[k].hint}
                >
                  {STYLE_PRESETS[k].label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl bg-neutral-950/60 p-3 text-sm text-neutral-200">
            <div className="font-medium">Preset detail</div>
            <div className="mt-1 text-neutral-300">{STYLE_PRESETS[preset].hint}</div>
            <div className="mt-2 whitespace-pre-wrap text-neutral-200">
              {STYLE_PRESETS[preset].prompt}
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className="mb-6 rounded-2xl bg-neutral-900/60 p-4 shadow">
          <h2 className="text-lg font-medium">Tag</h2>
          <p className="text-sm text-neutral-300">Klik untuk aktif/nonaktif.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const active = activeTags.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => toggleTag(t.key)}
                  className={[
                    "rounded-full px-3 py-2 text-sm transition",
                    active ? "bg-emerald-400 text-neutral-950" : "bg-neutral-800 hover:bg-neutral-700",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            * Kalau tidak pilih apa-apa, default: <b>daily</b>
          </div>
        </section>

        {/* Prompt input */}
        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-neutral-900/60 p-4 shadow">
            <h2 className="text-lg font-medium">Prompt Utama</h2>
            <p className="text-sm text-neutral-300">Isi inti adegan / cerita.</p>
            <textarea
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              rows={8}
              placeholder="Contoh: Karakter monyet hoodie lucu sedang membersihkan selokan penuh sampah plastik, timelapse 15 detik, suasana pagi..."
              className="mt-3 w-full resize-none rounded-xl bg-neutral-950/60 p-3 text-sm outline-none ring-1 ring-neutral-800 focus:ring-2 focus:ring-white/40"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={saveCurrent}
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
              >
                Save to History
              </button>
              <button
                onClick={clearAll}
                className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 p-4 shadow">
            <h2 className="text-lg font-medium">Extra (Opsional)</h2>
            <p className="text-sm text-neutral-300">
              Detail tambahan: durasi, angle kamera, lighting, larangan (no text, no logo), dll.
            </p>
            <textarea
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              rows={8}
              placeholder="Contoh: 10–15 detik, 9:16, kamera dari belakang, slow push-in, NO watermark, NO text overlay, natural sound..."
              className="mt-3 w-full resize-none rounded-xl bg-neutral-950/60 p-3 text-sm outline-none ring-1 ring-neutral-800 focus:ring-2 focus:ring-white/40"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => copy(finalPrompt, "Prompt copied ✅")}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-white"
              >
                Copy Prompt
              </button>
              <button
                onClick={() => copy(captionPack, "Caption + hashtag copied ✅")}
                className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
              >
                Copy Caption
              </button>
            </div>
          </div>
        </section>

        {/* Output */}
        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-neutral-900/60 p-4 shadow">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium">Final Prompt</h2>
              <button
                onClick={() => copy(finalPrompt, "Prompt copied ✅")}
                className="rounded-lg bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
              >
                Copy
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-neutral-950/60 p-3 text-sm text-neutral-100 ring-1 ring-neutral-800">
              {finalPrompt || "— isi prompt dulu —"}
            </pre>
          </div>

          <div className="rounded-2xl bg-neutral-900/60 p-4 shadow">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium">Auto Caption + 5 Hashtag</h2>
              <button
                onClick={() => copy(captionPack, "Caption copied ✅")}
                className="rounded-lg bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
              >
                Copy
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-neutral-950/60 p-3 text-sm text-neutral-100 ring-1 ring-neutral-800">
              {captionPack}
            </pre>
          </div>
        </section>

        {/* History */}
        <section className="rounded-2xl bg-neutral-900/60 p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">History</h2>
              <p className="text-sm text-neutral-300">Tersimpan di browser (localStorage).</p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history…"
              className="w-full rounded-xl bg-neutral-950/60 p-3 text-sm outline-none ring-1 ring-neutral-800 focus:ring-2 focus:ring-white/40 md:max-w-sm"
            />
          </div>

          <div className="mt-4 grid gap-3">
            {filteredSaved.length === 0 ? (
              <div className="rounded-xl bg-neutral-950/40 p-4 text-sm text-neutral-300 ring-1 ring-neutral-800">
                Belum ada history.
              </div>
            ) : (
              filteredSaved.map((it) => (
                <div
                  key={it.id}
                  className="rounded-2xl bg-neutral-950/40 p-4 ring-1 ring-neutral-800"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{it.title}</div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {formatDate(it.createdAt)} • {STYLE_PRESETS[it.preset].label} • {it.tags.join(" / ")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => loadItem(it)}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-950 hover:bg-neutral-200"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => copy(buildFinalPrompt(it.preset, it.basePrompt, it.extraPrompt), "Saved prompt copied ✅")}
                        className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
                      >
                        Copy Prompt
                      </button>
                      <button
                        onClick={() => deleteItem(it.id)}
                        className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-neutral-300 hover:text-white">
                      Lihat detail
                    </summary>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl bg-neutral-950/60 p-3 text-xs ring-1 ring-neutral-800">
                        <div className="mb-1 font-semibold text-neutral-200">Base</div>
                        <div className="whitespace-pre-wrap text-neutral-100">{it.basePrompt}</div>
                      </div>
                      <div className="rounded-xl bg-neutral-950/60 p-3 text-xs ring-1 ring-neutral-800">
                        <div className="mb-1 font-semibold text-neutral-200">Extra</div>
                        <div className="whitespace-pre-wrap text-neutral-100">{it.extraPrompt}</div>
                      </div>
                    </div>
                  </details>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Toast */}
        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950 shadow">
            {toast}
          </div>
        ) : null}

        <footer className="mt-8 text-center text-xs text-neutral-500">
          v2 • Build-safe TypeScript • Next.js App Router
        </footer>
      </div>
    </main>
  );
}
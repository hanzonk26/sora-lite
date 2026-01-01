"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type CharacterKey = "general" | "hanz" | "sweepy" | "kolab";
type NicheKey = "lucu" | "daily" | "kesehatan" | "ugc" | "horror" | "sweepy_only";

type SavedItem = {
  id: string;
  createdAt: number;
  character: CharacterKey;
  niche: NicheKey;
  promptMain: string;
  extra: string;
  finalPrompt: string;
  caption: string;
  hashtags: string[];
};

type HistoryItem = {
  id: string;
  createdAt: number;
  character: CharacterKey;
  niche: NicheKey;
  finalPrompt: string;
  caption: string;
  hashtags: string[];
};

const LS_SAVED = "sora_lite_saved_v7";
const LS_HISTORY = "sora_lite_history_v7";

const CHARACTER_LABEL: Record<CharacterKey, string> = {
  general: "General",
  hanz: "Hanz 👤",
  sweepy: "Sweepy 🐒",
  kolab: "Kolab 🤝",
};

const NICHE_LABEL: Record<NicheKey, string> = {
  lucu: "Lucu",
  daily: "Daily life",
  kesehatan: "Kesehatan",
  ugc: "UGC",
  horror: "Horror",
  sweepy_only: "Sweepy-only",
};

// ---------- Prompt building blocks ----------
const BASE_OUTPUT_RULES = [
  "9:16 vertical, 10–15 seconds",
  "realistic lighting, clean composition, clear subject, phone-friendly framing",
  "safe content, avoid extreme gore, avoid medical claims",
].join(", ");

const CHARACTER_RULES: Record<CharacterKey, string> = {
  general:
    "No specific character. Keep it generic, natural, realistic, not cartoonish unless requested. Clean wardrobe, everyday setting.",
  hanz:
    "Character: Hanz (human). Calm, relaxed, modest, stylish, neat everyday outfit. Natural gestures, friendly vibe, not over-acting. Looks like a real person.",
  sweepy:
    "Character: Sweepy (real monkey). MUST remain animal-like: animal anatomy, animal movement. NO human hands/face, NOT a person in costume, NOT anthropomorphic. Natural monkey behavior only.",
  kolab:
    "Collab: Hanz (human) + Sweepy (real monkey). Keep Sweepy animal-like, natural monkey behavior. Safe and wholesome. Hanz reacts calmly and tries not to laugh. No unsafe stunts.",
};

const NICHE_RULES: Record<NicheKey, string> = {
  lucu: "Tone: comedy, light, punchline ending (safe). Focus on reactions, timing, small funny twist.",
  daily: "Tone: daily life, relatable, calm, satisfying. Small moment, realistic pacing.",
  kesehatan:
    "Tone: healthy lifestyle inspiration (non-medical). No medical claims. Simple habit, hydration, sleep, walking, meal prep. Show routine.",
  ugc: "Tone: UGC creator vibe. Handheld phone feel (but stable), clear talking points, product-neutral unless user specifies. Natural voiceover implied (no need to add audio).",
  horror:
    "Tone: cinematic mild horror, suspense, eerie ambience. NO extreme gore, no jump-scare violence. Safe spooky.",
  sweepy_only:
    "Only Sweepy (monkey). Absolutely no human gestures. Emphasize animal-only behavior, curiosity, playful mischief, reactions.",
};

// Viral-ish idea bank (Indonesia-friendly), each item: title + scene skeleton
type Idea = { title: string; scene: string; twist: string; shots: string[]; safeNote?: string };

const IDEAS: Record<NicheKey, Idea[]> = {
  lucu: [
    {
      title: "Salah paham instruksi simpel",
      scene: "At home / halaman rumah, karakter menerima instruksi sederhana (mis: 'ambil yang kecil')",
      twist: "yang diambil malah benda lucu/tidak terduga, karakter menahan ketawa lalu pecah ketawa",
      shots: ["wide establishing", "close-up reaction", "cut-in object", "punchline close-up"],
    },
    {
      title: "Properti kecil ‘hilang’",
      scene: "Hanz siap rekam konten, properti kecil (remote/pen) ada di meja",
      twist: "tiba-tiba properti ‘geser sendiri’ (ternyata Sweepy nyolong pelan), Hanz freeze lalu senyum",
      shots: ["over-shoulder to table", "macro on prop", "reveal to Sweepy", "reaction + end card"],
    },
    {
      title: "‘Auto caption’ ngaco (tapi aman)",
      scene: "Hanz merekam, muncul text overlay salah (implied), Hanz koreksi sambil ketawa kecil",
      twist: "Sweepy ikut ‘protes’ dengan suara/reaksi monyet natural, Hanz makin sulit nahan ketawa",
      shots: ["phone-like medium", "close-up mouth reaction", "Sweepy reaction", "final beat"],
    },
  ],
  daily: [
    {
      title: "Morning routine 10 detik",
      scene: "Pagi, cahaya lembut, meja rapi, minum air + rapihin outfit",
      twist: "Sweepy muncul sebentar numpang lewat, bikin momen wholesome",
      shots: ["soft wide", "hands detail", "mirror shot", "tiny surprise"],
    },
    {
      title: "Bikin kopi tenang",
      scene: "Buat kopi di dapur minimalis",
      twist: "tetes terakhir pas banget (satisfying), karakter senyum kecil",
      shots: ["close-up pour", "steam detail", "sip reaction", "end frame"],
    },
    {
      title: "Before-after rapiin meja",
      scene: "Meja berantakan → diberesin cepat",
      twist: "Sweepy ‘bantu’ tapi malah mindahin satu barang random (lucu halus)",
      shots: ["before wide", "fast tidy montage", "after reveal", "micro twist"],
    },
  ],
  kesehatan: [
    {
      title: "Habit sehat tanpa klaim",
      scene: "Jalan santai sore + minum air",
      twist: "Hanz kasih gestur ‘ayo’ yang kalem, vibe adem",
      shots: ["walking wide", "shoe steps", "water bottle close-up", "smile end"],
    },
    {
      title: "Meal prep simpel",
      scene: "Siapkan snack sehat (buah/yogurt) di meja",
      twist: "Sweepy ngintip penasaran, tapi tetap animal-like dan aman",
      shots: ["ingredient close-up", "hands prep", "peek moment", "final plate"],
      safeNote: "No medical claims, no weight-loss promises.",
    },
    {
      title: "Stretch 10 detik",
      scene: "Stretch ringan di ruang tamu",
      twist: "Sweepy meniru gerak (animal-like, sekadar mirroring posture) lalu pergi",
      shots: ["full body", "detail stretch", "Sweepy cameo", "calm end"],
    },
  ],
  ugc: [
    {
      title: "UGC talking points (netral)",
      scene: "Hanz ngomong ke kamera: hook 1 kalimat + 2 poin + CTA halus",
      twist: "Sweepy ganggu dikit (ambil properti kecil) bikin momen natural",
      shots: ["camera-to-subject", "punch-in for emphasis", "b-roll hands", "end CTA"],
    },
    {
      title: "Before/After ‘vibe’",
      scene: "Hanz tampil biasa → switch jadi lebih rapi (stylish)",
      twist: "Sweepy muncul pas transisi, jadi comedic beat",
      shots: ["before medium", "transition snap", "after reveal", "reaction"],
    },
    {
      title: "POV viewer",
      scene: "Seolah penonton yang diajak ngobrol, vibe santai",
      twist: "Hanz tahan ketawa karena Sweepy off-camera",
      shots: ["POV close", "hand gesture minimal", "quick cut", "end"],
    },
  ],
  horror: [
    {
      title: "Bayangan lewat",
      scene: "Koridor rumah malam, lampu temaram",
      twist: "ternyata Sweepy lewat di background (aman), Hanz kaget kecil lalu lega",
      shots: ["slow wide", "shadow moment", "reveal", "relief end"],
    },
    {
      title: "Suara aneh (aman)",
      scene: "Hanz dengar suara dari dapur",
      twist: "ternyata botol jatuh pelan / Sweepy bikin bunyi, bukan hantu",
      shots: ["listen close-up", "walk-in", "reveal object", "laugh end"],
    },
    {
      title: "TV glitch ringan",
      scene: "TV statis ringan, ambience dingin",
      twist: "Hanz matiin TV, Sweepy muncul dari samping bikin lucu halus",
      shots: ["TV close-up", "hand to remote", "reaction", "punchline"],
    },
  ],
  sweepy_only: [
    {
      title: "Monyet salah ambil benda",
      scene: "Halaman rumah, Sweepy lihat dua benda kecil",
      twist: "ambil yang salah, lalu ekspresi bingung (animal-like) → punchline",
      shots: ["wide", "object close-up", "face reaction", "end"],
      safeNote: "No human gestures. Keep monkey animal-like.",
    },
    {
      title: "Curiosity check",
      scene: "Sweepy mendekati benda baru (mis: botol kosong) dan mengendus",
      twist: "benda bunyi pelan, Sweepy kaget kecil lalu penasaran lagi",
      shots: ["low angle", "sniff close", "startle", "curious end"],
    },
    {
      title: "Mini ‘heist’",
      scene: "Sweepy pelan-pelan ‘nyolong’ benda kecil (aman) lalu kabur",
      twist: "berhenti sebentar, lihat kamera, lalu lanjut kabur",
      shots: ["tracking shot", "hand—(animal paw) detail", "look to camera", "exit"],
    },
  ],
};

// ---------- Helpers ----------
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clampText(s: string, max = 180) {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function cleanCaption(input: string) {
  let s = (input || "").trim();

  // Remove weird repeated words like "di di", "yang yang", "dan dan"
  s = s.replace(/\b(di|yang|dan|aku|kamu)\s+\1\b/gi, "$1");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/\.{3,}/g, "…");

  // Remove double punctuation
  s = s.replace(/([!?.,])\1+/g, "$1");

  // Ensure no leading dash/colon weirdness
  s = s.replace(/^[\-\:\•\–\—\s]+/g, "");

  // Hard clamp
  s = clampText(s, 160);

  // If still too bland/empty, fallback
  if (s.length < 6) s = "Momen kecil yang bikin senyum 🙂";
  return s;
}

function buildHashtags(niche: NicheKey, character: CharacterKey) {
  const base = ["#sora", "#aivideo", "#viral"];
  const mapNiche: Record<NicheKey, string[]> = {
    lucu: ["#lucu", "#komedi"],
    daily: ["#dailylife", "#relatable"],
    kesehatan: ["#healthy", "#lifestyle"],
    ugc: ["#ugc", "#contentcreator"],
    horror: ["#horror", "#spooky"],
    sweepy_only: ["#monkey", "#animal"],
  };

  const mapChar: Record<CharacterKey, string[]> = {
    general: [],
    hanz: ["#hanz"],
    sweepy: ["#sweepy", "#monyet"],
    kolab: ["#kolab", "#hanzxsweepy"],
  };

  const tags = [...base, ...mapNiche[niche], ...mapChar[character]];
  // pick 5 unique, keep order-ish
  const uniq: string[] = [];
  for (const t of tags) {
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= 5) break;
  }
  while (uniq.length < 5) uniq.push("#fyp");
  return uniq.slice(0, 5);
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeJoin(lines: string[]) {
  return lines.filter(Boolean).join("\n\n").trim();
}

// ---------- UI bits ----------
function Chip({
  active,
  label,
  onClick,
  tone = "default",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone?: "default" | "accent";
}) {
  const base =
    "px-4 py-2 rounded-full text-sm font-semibold transition select-none active:scale-[0.98] shadow-sm";
  const cls = active
    ? tone === "accent"
      ? "bg-emerald-400 text-[#071014]"
      : "bg-white/20 text-white"
    : "bg-white/10 text-white/90 hover:bg-white/15";
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`}>
      {label}
    </button>
  );
}

function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/8 border border-white/10 shadow-lg backdrop-blur-xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function Page() {
  const [character, setCharacter] = useState<CharacterKey>("general");
  const [niche, setNiche] = useState<NicheKey>("daily");

  const [promptMain, setPromptMain] = useState("");
  const [extra, setExtra] = useState("");

  const [finalPrompt, setFinalPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1400);
  };

  // Load LS
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_SAVED);
      const h = localStorage.getItem(LS_HISTORY);
      if (s) setSaved(JSON.parse(s));
      if (h) setHistory(JSON.parse(h));
    } catch {
      // ignore
    }
  }, []);

  // Persist LS
  useEffect(() => {
    try {
      localStorage.setItem(LS_SAVED, JSON.stringify(saved.slice(0, 80)));
    } catch {}
  }, [saved]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 80)));
    } catch {}
  }, [history]);

  const promptHint = useMemo(() => {
    if (character === "sweepy") return "Contoh: Sweepy penasaran sama botol kosong, mengendus, lalu kaget kecil (animal-only).";
    if (character === "kolab") return "Contoh: @hanz26 rekam konten tenang, Sweepy nyolong properti kecil, Hanz nahan ketawa.";
    if (character === "hanz") return "Contoh: @hanz26 UGC santai, hook singkat, 2 poin, CTA halus. Outfit rapi.";
    return "Contoh: adegan singkat, realistis, punchline aman, fokus visual dan timing.";
  }, [character]);

  function clearAll() {
    setPromptMain("");
    setExtra("");
    setFinalPrompt("");
    setCaption("");
    setHashtags([]);
    showToast("Clear ✓");
  }

  function buildPromptFromInputs(opts?: { idea?: Idea }) {
    const chosenIdea = opts?.idea;

    const sceneMain = promptMain.trim()
      ? promptMain.trim()
      : chosenIdea
      ? `${chosenIdea.scene}. ${chosenIdea.twist}.`
      : "Scene: a short realistic moment with clear subject and a safe ending.";

    const ideaShots = chosenIdea?.shots?.length
      ? `SHOT LIST: ${chosenIdea.shots.join(", ")}.`
      : "SHOT LIST: wide establishing, close-up reaction, cut-in detail, punchline ending.";

    // Sweepy-only guard is stricter
    const anatomyGuard =
      character === "sweepy" || niche === "sweepy_only"
        ? "ANATOMY GUARD: Sweepy must remain a real monkey: animal anatomy, animal movement. NO human hands/face, NOT a person in a costume, NOT anthropomorphic."
        : character === "kolab"
        ? "ANATOMY GUARD: Sweepy stays animal-like; no human gestures; safe interaction distance; no dangerous stunts."
        : "";

    const extraLine = extra.trim()
      ? extra.trim()
      : "reaction close-up, detail texture shot, smooth pacing, clean framing";

    const rules = [
      `CHARACTER RULES: ${CHARACTER_RULES[character]}`,
      `NICHE: ${NICHE_RULES[niche]}`,
      `OUTPUT RULES: ${BASE_OUTPUT_RULES}`,
      anatomyGuard ? anatomyGuard : "",
    ].filter(Boolean);

    const prompt = safeJoin([
      `TITLE: ${chosenIdea?.title ?? "Short Viral Scene"}`,
      `SCENE:\n${sceneMain}`,
      `EXTRA:\n${extraLine}`,
      ideaShots,
      rules.join("\n"),
    ]);

    // Caption
    const baseCap = (() => {
      // Make a cleaner, short Indonesian caption (avoid weird)
      const vibe =
        niche === "horror"
          ? "Sedikit merinding, tapi aman 😅"
          : niche === "kesehatan"
          ? "Kebiasaan kecil biar hidup lebih enak 🙂"
          : niche === "ugc"
          ? "UGC santai yang gampang ditiru 😌"
          : niche === "daily"
          ? "Daily life yang relatable ✨"
          : niche === "sweepy_only"
          ? "Monyet kecil yang pintar (animal-only) 🐒"
          : "Biar ketawa dikit 😄";

      const who =
        character === "kolab"
          ? "(@hanz26 × Sweepy)"
          : character === "hanz"
          ? "(@hanz26)"
          : character === "sweepy"
          ? "(Sweepy)"
          : "";

      // Use idea title as punchy line
      const line2 = chosenIdea?.title ? chosenIdea.title : "Momen singkat, twist kecil, ending aman.";
      const line3 =
        character === "kolab"
          ? "Kolab santai: manusia + monyet (aman & natural)."
          : character === "sweepy" || niche === "sweepy_only"
          ? "Animal-only: gerak & ekspresi monyet tetap natural."
          : "Natural, clean, enak ditonton.";

      return `${vibe} ${who}\n${line2}\n${line3}`;
    })();

    const tagList = buildHashtags(niche, character);

    return { prompt, caption: cleanCaption(baseCap), hashtags: tagList };
  }

  function autoGenerate() {
    // Pick an idea based on niche, but add variety by sometimes mixing close niches safely
    const pool = IDEAS[niche] && IDEAS[niche].length ? IDEAS[niche] : IDEAS.daily;

    let idea = pickRandom(pool);

    // If character is sweepy but niche isn't sweepy_only, still keep monkey guard
    if ((character === "sweepy" || niche === "sweepy_only") && niche !== "sweepy_only") {
      // still ok
    }

    // If character is sweepy-only niche but character isn't sweepy, force character to sweepy for clarity
    if (niche === "sweepy_only" && character !== "sweepy") setCharacter("sweepy");

    const built = buildPromptFromInputs({ idea });
    setFinalPrompt(built.prompt);
    setCaption(built.caption);
    setHashtags(built.hashtags);

    const hist: HistoryItem = {
      id: uid(),
      createdAt: Date.now(),
      character,
      niche,
      finalPrompt: built.prompt,
      caption: built.caption,
      hashtags: built.hashtags,
    };
    setHistory((prev) => [hist, ...prev].slice(0, 80));

    showToast("Auto generated ✓");
  }

  function buildManual() {
    const built = buildPromptFromInputs();
    setFinalPrompt(built.prompt);
    setCaption(built.caption);
    setHashtags(built.hashtags);

    const hist: HistoryItem = {
      id: uid(),
      createdAt: Date.now(),
      character,
      niche,
      finalPrompt: built.prompt,
      caption: built.caption,
      hashtags: built.hashtags,
    };
    setHistory((prev) => [hist, ...prev].slice(0, 80));
    showToast("Generated ✓");
  }

  function saveCurrent() {
    if (!finalPrompt.trim()) {
      showToast("Belum ada prompt (Generate dulu)");
      return;
    }
    const item: SavedItem = {
      id: uid(),
      createdAt: Date.now(),
      character,
      niche,
      promptMain,
      extra,
      finalPrompt,
      caption,
      hashtags,
    };
    setSaved((prev) => [item, ...prev].slice(0, 80));
    showToast("Saved ✓");
  }

  function loadSaved(item: SavedItem) {
    setCharacter(item.character);
    setNiche(item.niche);
    setPromptMain(item.promptMain);
    setExtra(item.extra);
    setFinalPrompt(item.finalPrompt);
    setCaption(item.caption);
    setHashtags(item.hashtags);
    showToast("Loaded ✓");
  }

  function deleteSaved(id: string) {
    setSaved((prev) => prev.filter((x) => x.id !== id));
    showToast("Deleted ✓");
  }

  function clearHistory() {
    setHistory([]);
    showToast("History cleared ✓");
  }

  const prettyHashtagsLine = useMemo(() => hashtags.join(" "), [hashtags]);

  return (
    <main className="min-h-screen bg-[#0b0f16] text-white">
      {/* soft glow background */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="absolute top-44 -left-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-400/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[720px] px-4 pb-28 pt-7">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Sora Lite — Prompt Builder
          </h1>
          <p className="mt-2 text-white/75 leading-relaxed">
            Preset Character + Niche + Prompt manual + Auto Generate + Caption + 5 Hashtags + History + Save.
          </p>
        </header>

        {/* Character (TOP) */}
        <Card title="Preset Character (atas)">
          <p className="text-white/70 text-sm mb-4">
            Pilih karakter dulu. <span className="text-emerald-300 font-semibold">Sweepy selalu animal-only.</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {(["general", "hanz", "sweepy", "kolab"] as CharacterKey[]).map((k) => (
              <Chip
                key={k}
                active={character === k}
                label={CHARACTER_LABEL[k]}
                tone="accent"
                onClick={() => setCharacter(k)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="font-bold mb-1">Character rules</div>
            <div className="leading-relaxed">{CHARACTER_RULES[character]}</div>
          </div>
        </Card>

        <div className="h-4" />

        {/* Niche (BELOW) + Auto Generate on right */}
        <Card
          title="Niche"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={autoGenerate}
                className="px-4 py-2 rounded-full bg-emerald-400 text-[#071014] font-extrabold shadow-sm active:scale-[0.98]"
              >
                Auto Generate
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold active:scale-[0.98]"
              >
                Clear
              </button>
            </div>
          }
        >
          <p className="text-white/70 text-sm mb-4">
            Pilih niche konten. (Tidak mengunci karakter.)
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NICHE_LABEL) as NicheKey[]).map((k) => (
              <Chip
                key={k}
                active={niche === k}
                label={NICHE_LABEL[k]}
                onClick={() => setNiche(k)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="font-bold mb-1">Niche rules</div>
            <div className="leading-relaxed">{NICHE_RULES[niche]}</div>
          </div>
        </Card>

        <div className="h-4" />

        {/* Manual Prompt */}
        <Card
          title="Prompt Manual"
          right={
            <button
              type="button"
              onClick={buildManual}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold active:scale-[0.98]"
            >
              Generate (manual)
            </button>
          }
        >
          <label className="block text-sm font-bold text-white/80 mb-2">Prompt utama</label>
          <textarea
            value={promptMain}
            onChange={(e) => setPromptMain(e.target.value)}
            placeholder={promptHint}
            className="w-full min-h-[110px] rounded-2xl bg-[#0a0f16] border border-white/10 p-4 text-white/90 placeholder:text-white/40 outline-none focus:border-emerald-400/50"
          />

          <label className="block text-sm font-bold text-white/80 mt-4 mb-2">Extra (opsional)</label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Contoh: handheld but stable, slow push-in, soft shadows, cinematic color, close-up reactions"
            className="w-full min-h-[90px] rounded-2xl bg-[#0a0f16] border border-white/10 p-4 text-white/90 placeholder:text-white/40 outline-none focus:border-emerald-400/50"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCurrent}
              className="px-4 py-2 rounded-full bg-emerald-400 text-[#071014] font-extrabold active:scale-[0.98]"
            >
              Save Prompt
            </button>
          </div>
        </Card>

        <div className="h-4" />

        {/* Output Prompt */}
        <Card
          title="Output Prompt"
          right={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!finalPrompt.trim()) return showToast("Belum ada output");
                  const ok = await copyText(finalPrompt);
                  showToast(ok ? "Prompt copied ✓" : "Gagal copy");
                }}
                className="px-4 py-2 rounded-full bg-emerald-400 text-[#071014] font-extrabold active:scale-[0.98]"
              >
                Copy Prompt
              </button>
            </div>
          }
        >
          <pre className="whitespace-pre-wrap rounded-2xl bg-[#071014] border border-white/10 p-4 text-sm text-white/85 leading-relaxed">
            {finalPrompt || "Klik Auto Generate atau Generate (manual) untuk membuat prompt."}
          </pre>
        </Card>

        <div className="h-4" />

        {/* Caption + Hashtags */}
        <Card
          title="Caption + 5 Hashtags"
          right={
            <button
              type="button"
              onClick={async () => {
                const pack = [caption, "", prettyHashtagsLine].filter(Boolean).join("\n");
                if (!pack.trim()) return showToast("Belum ada caption");
                const ok = await copyText(pack);
                showToast(ok ? "Caption copied ✓" : "Gagal copy");
              }}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold active:scale-[0.98]"
            >
              Copy Caption + Hashtag
            </button>
          }
        >
          <div className="rounded-2xl bg-[#071014] border border-white/10 p-4">
            <div className="text-white/90 font-semibold whitespace-pre-wrap">
              {caption || "Caption akan muncul setelah generate."}
            </div>
            <div className="mt-3 text-white/70">{prettyHashtagsLine}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              {hashtags.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white/80"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="h-4" />

        {/* History */}
        <Card
          title="History (auto & manual)"
          right={
            <button
              type="button"
              onClick={clearHistory}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold active:scale-[0.98]"
            >
              Clear history
            </button>
          }
        >
          {history.length === 0 ? (
            <p className="text-white/60 text-sm">Belum ada history.</p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 6).map((h) => (
                <div key={h.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold">
                      {CHARACTER_LABEL[h.character]} • {NICHE_LABEL[h.niche]}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/15"
                      onClick={async () => {
                        const ok = await copyText(h.finalPrompt);
                        showToast(ok ? "Prompt copied ✓" : "Gagal copy");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-white/80 line-clamp-3 whitespace-pre-wrap">
                    {clampText(h.caption, 120)}
                  </div>
                </div>
              ))}
              {history.length > 6 && (
                <div className="text-xs text-white/60">+{history.length - 6} item lainnya tersimpan.</div>
              )}
            </div>
          )}
        </Card>

        <div className="h-4" />

        {/* Saved Prompts */}
        <Card title="Saved Prompts (local)">
          {saved.length === 0 ? (
            <p className="text-white/60 text-sm">Belum ada yang disimpan.</p>
          ) : (
            <div className="space-y-3">
              {saved.slice(0, 8).map((s) => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold">
                      {CHARACTER_LABEL[s.character]} • {NICHE_LABEL[s.niche]}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-400 text-[#071014]"
                        onClick={() => loadSaved(s)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/15"
                        onClick={() => deleteSaved(s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-white/70">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>

                  <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
                    {clampText(s.caption, 120)}
                  </div>
                </div>
              ))}
              {saved.length > 8 && (
                <div className="text-xs text-white/60">+{saved.length - 8} item lainnya tersimpan.</div>
              )}
            </div>
          )}
        </Card>

        <footer className="mt-8 text-center text-xs text-white/45">
          Sora Lite v7 • Mobile-first • No Tags • Character+Niche separated • Caption filter enabled
        </footer>
      </div>

      {/* Toast */}
      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-full bg-black/70 border border-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur">
            {toast}
          </div>
        </div>
      ) : null}
    </main>
  );
}
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StyleKey = "cinematic" | "horror" | "funny" | "ugc" | "doc";

const STYLE_PRESETS: Record<StyleKey, string> = {
  cinematic:
    "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting",
  horror:
    "cinematic horror, low-key lighting, eerie shadows, subtle camera shake, suspenseful pacing, cold color temperature, creepy ambience",
  funny:
    "cinematic comedy, playful timing, expressive character acting, bright yet moody lighting, punchy edits, humorous beat",
  ugc:
    "UGC style, handheld smartphone feel, natural lighting, casual framing, authentic vibe, minimal grading",
  doc:
    "documentary style, realistic lighting, observational camera, natural color grading, authentic environment",
};

function pickStyle(text: string): StyleKey {
  const t = text.toLowerCase();
  if (/(horror|horor|seram|conjuring|hantu|mistis)/.test(t)) return "horror";
  if (/(lucu|komedi|kocak|ngakak)/.test(t)) return "funny";
  if (/(ugc|review|jual|promosi|soft sell|iklan)/.test(t)) return "ugc";
  if (/(dokumenter|documentary|report|liputan)/.test(t)) return "doc";
  return "cinematic";
}

function splitScenes(input: string): string[] {
  // Pecah berdasarkan tanda baca / kata penghubung biar jadi beberapa beat sederhana
  const cleaned = input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(kemudian|lalu|terus)/gi, "|$1|");
  const parts = cleaned
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  // Batasi agar tidak kebanyakan
  const scenes = parts.length >= 3 ? parts : [cleaned];
  return scenes.slice(0, 6);
}

function buildStoryboard(userPrompt: string) {
  const styleKey = pickStyle(userPrompt);
  const style = STYLE_PRESETS[styleKey];
  const scenesRaw = splitScenes(userPrompt);

  const storyboard = scenesRaw.map((beat, idx) => {
    const n = idx + 1;

    // Template kamera sederhana
    const camera =
      n === 1
        ? "Wide establishing shot, camera from behind or over-shoulder if relevant"
        : n === scenesRaw.length
          ? "Close-up reaction, hold for comedic/horror payoff"
          : "Medium shot, slow push-in or subtle handheld";

    const lighting =
      styleKey === "horror"
        ? "low-key lighting, practical light sources, deep shadows"
        : styleKey === "ugc"
          ? "natural daylight or indoor warm practical lighting"
          : "cinematic soft key light, gentle rim light";

    const sound =
      styleKey === "horror"
        ? "low rumble, subtle stingers, tense ambience"
        : styleKey === "funny"
          ? "light playful music, comedic whoosh for punchline"
          : "cinematic ambience, soft risers";

    return {
      scene: n,
      durationSec: 10,
      action: beat,
      camera,
      lighting,
      sound,
      notes:
        "Keep it natural, clear subject, avoid overly complex actions. Maintain continuity of character and setting.",
    };
  });

  const title =
    styleKey === "horror"
      ? "Cinematic Horror (Lucu) – Twist TV"
      : styleKey === "ugc"
        ? "UGC Prompt Builder – Quick Demo"
        : "Cinematic Prompt Builder – Quick Story";

  const hook =
    styleKey === "horror"
      ? "Plot twist: sesuatu di layar TV hampir keluar… tapi ada punchline!"
      : styleKey === "ugc"
        ? "Bikin prompt video yang rapi dalam 1 klik."
        : "Ide kamu diubah jadi storyboard cinematic.";

  // Prompt final (satu paragraf) untuk tool video generatif
  const finalPrompt = [
    `Create a ${styleKey} short video based on this story: ${userPrompt}.`,
    `Style: ${style}.`,
    `Storyboard beats:`,
    ...storyboard.map(
      (s) =>
        `Scene ${s.scene} (${s.durationSec}s): ${s.action}. Camera: ${s.camera}. Lighting: ${s.lighting}.`
    ),
    `Keep consistent character design, coherent motion, realistic timing, no text overlays unless requested.`,
  ].join(" ");

  return { title, hook, styleKey, style, storyboard, finalPrompt };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "GET /api/generate is working. Use POST with { prompt }.",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt tidak boleh kosong." },
        { status: 400 }
      );
    }

    const result = buildStoryboard(prompt);

    return NextResponse.json({
      ok: true,
      input: { prompt },
      output: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
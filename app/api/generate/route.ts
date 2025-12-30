import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StyleKey = "cinematic" | "horror" | "funny" | "ugc" | "doc";

const STYLE_PRESETS: Record<StyleKey, string> = {
  cinematic:
    "cinematic film look, high contrast, soft film grain, shallow depth of field, smooth dolly moves, dramatic lighting",
  horror:
    "cinematic horror, low-key lighting, eerie shadows, subtle camera shake, suspenseful pacing, cold color temperature, creepy ambience (NO extreme jump scares)",
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

// Ambil inti ide, buang kata penghubung biar tidak kebaca "multi-scene"
function normalizeSingleBeat(input: string): string {
  const cleaned = input
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /(kemudian|lalu|terus|habis itu|setelah itu|dan kemudian)/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || input.trim();
}

function buildOneScene(userPrompt: string) {
  const styleKey = pickStyle(userPrompt);
  const style = STYLE_PRESETS[styleKey];

  const beat = normalizeSingleBeat(userPrompt);

  // Template kamera sederhana dan aman untuk 1 scene
  const camera =
    styleKey === "ugc"
      ? "Handheld smartphone, medium shot, natural framing, slight movement"
      : styleKey === "doc"
        ? "Observational medium-wide, minimal camera movement, realistic framing"
        : "Wide establishing to medium, smooth slow push-in, stable framing";

  const lighting =
    styleKey === "horror"
      ? "low-key lighting, practical light sources, deep shadows, readable subject"
      : styleKey === "ugc"
        ? "natural daylight or warm indoor practical lighting"
        : "cinematic soft key light, gentle rim light";

  const sound =
    styleKey === "horror"
      ? "low rumble, subtle stingers, tense ambience (keep it safe)"
      : styleKey === "funny"
        ? "light playful music, subtle comedic whoosh (optional)"
        : styleKey === "ugc"
          ? "room tone + subtle upbeat bed (optional)"
          : "cinematic ambience, soft risers";

  // KUNCI: 1 scene saja, jangan sebut Scene 2, jangan sebut split lokasi
  const storyboard = [
    {
      scene: 1,
      durationSec: 10,
      action: beat,
      camera,
      lighting,
      sound,
      notes:
        "ONE SCENE ONLY. Keep a single location and time-of-day, consistent character and outfit. Clear subject, simple actions, natural timing.",
    },
  ];

  const title =
    styleKey === "horror"
      ? "Single-Scene Horror (Safe) – Locked"
      : styleKey === "ugc"
        ? "Single-Scene UGC – Locked"
        : "Single-Scene Cinematic – Locked";

  const hook =
    styleKey === "horror"
      ? "1 scene singkat, tegang tipis tapi aman dan tetap jelas."
      : styleKey === "ugc"
        ? "1 scene UGC yang rapi dan langsung ke inti."
        : "1 scene sinematik, sederhana tapi enak ditonton.";

  // Final prompt single-scene (yang kamu copy ke Sora)
  const finalPrompt = [
    `Create a ${styleKey} video with EXACTLY ONE scene (single continuous moment).`,
    `Duration: 10–15 seconds.`,
    `Story/Action: ${beat}.`,
    `Style: ${style}.`,
    `RULES: One location only, one time-of-day only. Keep the same main character identity and same outfit throughout. No scene change, no teleporting, no cut to a different place.`,
    `Camera: ${camera}. Lighting: ${lighting}. Sound: ${sound}.`,
    `Keep it natural, readable, avoid complex choreography, avoid sudden character redesign, avoid text overlays unless explicitly requested.`,
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

    const result = buildOneScene(prompt);

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
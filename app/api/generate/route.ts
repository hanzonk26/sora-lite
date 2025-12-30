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

function splitBeats(input: string): string[] {
  const cleaned = input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(kemudian|lalu|terus|habis itu|setelah itu|dan kemudian)/gi, "|$1|");

  const parts = cleaned
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^(kemudian|lalu|terus|habis itu|setelah itu|dan kemudian)$/i.test(s));

  return parts.length ? parts : [cleaned];
}

/**
 * KUNCI: selalu 2 scene yang NYAMBUNG (20 detik total).
 * - Scene 1: setup
 * - Scene 2: konsekuensi/resolve/punchline (masih di lokasi & waktu yang sama)
 */
function makeTwoScenes(userPrompt: string, styleKey: StyleKey): [string, string] {
  const beats = splitBeats(userPrompt);

  const scene1 = beats[0] || userPrompt.trim();

  // Kalau user sudah kasih minimal 2 beat, pakai beat ke-2 sebagai lanjutan
  let scene2 = beats[1];

  if (!scene2) {
    // Auto-lanjutan jika cuma 1 beat
    if (styleKey === "horror") {
      scene2 =
        "Masih di lokasi yang sama, ancaman memuncak sebentar, lalu ada twist lucu yang aman: karakter mengusir gangguan dengan aksi sederhana, reaksi lega, suasana kembali normal.";
    } else if (styleKey === "funny") {
      scene2 =
        "Masih di lokasi yang sama, muncul punchline: ada kejadian tak terduga yang bikin karakter bereaksi lucu, lalu ending rapi dan ringan.";
    } else if (styleKey === "ugc") {
      scene2 =
        "Masih di lokasi yang sama, lanjutkan dengan highlight manfaat utama + 1 reaksi natural, lalu penutup soft-selling singkat tanpa hard sell.";
    } else if (styleKey === "doc") {
      scene2 =
        "Masih di lokasi yang sama, lanjutkan dengan detail observasional tambahan, reaksi subjek, dan closing yang informatif serta tenang.";
    } else {
      scene2 =
        "Masih di lokasi yang sama, tingkatkan moment sebentar (tension/emosi), lalu resolusi yang memuaskan dan natural dengan reaksi karakter.";
    }
  }

  // Tambahkan kunci continuity di scene2 (biar Sora nggak loncat tempat/outfit)
  const continuityTag =
    " (CONTINUITY: same character, same outfit, same location, same time-of-day; continue from Scene 1 without scene change)";
  scene2 = `${scene2}${continuityTag}`;

  return [scene1, scene2];
}

function buildStoryboard(userPrompt: string) {
  const styleKey = pickStyle(userPrompt);
  const style = STYLE_PRESETS[styleKey];

  // KUNCI: 2 scene saja (20s)
  const [beat1, beat2] = makeTwoScenes(userPrompt, styleKey);

  const storyboard = [
    {
      scene: 1,
      durationSec: 10,
      action: beat1,
      camera:
        "Wide establishing shot then medium; keep character clearly visible. Smooth slow push-in or gentle handheld (depending on style).",
      lighting:
        styleKey === "horror"
          ? "low-key lighting, practical light sources, deep shadows"
          : styleKey === "ugc"
            ? "natural daylight or warm indoor practical lighting"
            : "cinematic soft key light, gentle rim light",
      sound:
        styleKey === "horror"
          ? "low rumble, subtle stingers, tense ambience"
          : styleKey === "funny"
            ? "light playful music, comedic whoosh for punchline"
            : "cinematic ambience, soft risers",
      notes:
        "Scene 1 = setup. Keep it simple, readable, no sudden environment changes.",
    },
    {
      scene: 2,
      durationSec: 10,
      action: beat2,
      camera:
        "Continue same shot language from Scene 1; medium-to-close reaction for payoff; hold 1-2 seconds at the end for clean finish.",
      lighting:
        "Match Scene 1 lighting (CONTINUITY). Keep exposure stable and consistent.",
      sound:
        styleKey === "horror"
          ? "resolve tension with a softer tail; no loud jump scare"
          : styleKey === "funny"
            ? "short punchline beat; end on a light hit"
            : "soft resolving ambience; gentle end",
      notes:
        "Scene 2 = continuation + payoff. MUST keep same character/outfit/location/time-of-day. No teleporting.",
    },
  ];

  const title =
    styleKey === "horror"
      ? "2-Scene Horror (Lucu) – Continuity Locked"
      : styleKey === "ugc"
        ? "2-Scene UGC – Continuity Locked"
        : "2-Scene Cinematic – Continuity Locked";

  const hook =
    styleKey === "horror"
      ? "2 scene yang nyambung: build-up singkat → twist aman + lucu."
      : styleKey === "ugc"
        ? "20 detik rapi: setup → highlight → closing soft."
        : "20 detik sinematik: setup → payoff tanpa loncat scene.";

  // Final prompt: dibuat jelas agar generator tidak ganti tempat/outfit
  const finalPrompt = [
    `Create a ${styleKey} video with EXACTLY 2 connected scenes (total 20 seconds).`,
    `Story: ${userPrompt}.`,
    `Style: ${style}.`,
    `RULES: Keep the same main character identity, same outfit, same location, same time-of-day across both scenes. Scene 2 must be a direct continuation of Scene 1 (no cuts to different places).`,
    `Scene 1 (10s): ${storyboard[0].action}. Camera: ${storyboard[0].camera}. Lighting: ${storyboard[0].lighting}. Sound: ${storyboard[0].sound}.`,
    `Scene 2 (10s): ${storyboard[1].action}. Camera: ${storyboard[1].camera}. Lighting: ${storyboard[1].lighting}. Sound: ${storyboard[1].sound}.`,
    `Avoid complex choreography, avoid sudden character redesign, avoid text overlays unless explicitly requested.`,
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
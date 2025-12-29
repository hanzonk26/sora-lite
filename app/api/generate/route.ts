import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = body?.prompt ?? "no prompt";

  return NextResponse.json({
    ok: true,
    receivedPrompt: prompt,
    message: "Generate endpoint working (demo).",
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "GET /api/generate is working. Use POST to generate.",
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    received: body,
    message: "POST /api/generate is working (demo).",
  });
}
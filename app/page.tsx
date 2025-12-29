"use client";

import { useMemo, useState } from "react";

type Scene = {
  scene: number;
  durationSec?: number;
  action?: string;
  camera?: string;
  lighting?: string;
  sound?: string;
  notes?: string;
};

type ApiResponse = {
  ok: boolean;
  input?: { prompt?: string };
  output?: {
    title?: string;
    hook?: string;
    styleKey?: string;
    style?: string;
    storyboard?: Scene[];
    finalPrompt?: string;
  };
  message?: string;
  error?: string;
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ApiResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  async function onGenerate() {
    if (!prompt.trim()) {
      setRes({ ok: false, error: "Prompt tidak boleh kosong." });
      return;
    }

    setLoading(true);
    setRes(null);

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = (await r.json()) as ApiResponse;

      // Kalau server balikin error tapi HTTP 200, tetap tampilkan
      setRes(data);
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Gagal memanggil API." });
    } finally {
      setLoading(false);
    }
  }

  async function copy(text?: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Copied!");
    }
  }

  const out = res?.output;

  return (
    <main className="min-h-screen px-4 py-8 bg-black text-white">
      <div className="mx-auto w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-wide">SORA LITE</h1>
          <p className="text-white/70 mt-2">Personal AI Video Practice</p>
        </div>

        {/* Prompt Card */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg">
          <label className="text-sm text-white/70">Prompt</label>
          <textarea
            className="mt-2 w-full min-h-[120px] rounded-xl bg-black/40 border border-white/10 p-3 outline-none focus:border-white/30 text-white placeholder:text-white/30"
            placeholder='Contoh: "Sweepy nonton film horror, sosok di TV makin dekat, Sweepy gebuk TV pakai remote, lucu tapi tegang"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button
            onClick={onGenerate}
            disabled={!canSubmit}
            className="mt-4 w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-sky-500 to-emerald-400 text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Video (Demo)"}
          </button>

          {!prompt.trim() && res?.error && (
            <p className="mt-3 text-sm text-red-400">{res.error}</p>
          )}
        </section>

        {/* Result */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Result</h2>
            {res && (
              <button
                className="text-sm text-white/70 underline"
                onClick={() => setShowRaw((v) => !v)}
              >
                {showRaw ? "Sembunyikan JSON" : "Lihat JSON"}
              </button>
            )}
          </div>

          {!res && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white/70">
              Belum ada hasil.
            </div>
          )}

          {res && !res.ok && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="font-semibold text-red-300">Error</p>
              <p className="text-red-200/80 mt-1">{res.error || res.message || "Terjadi error."}</p>
            </div>
          )}

          {res && res.ok && out && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/60 text-xs mb-1">Title</p>
                <p className="text-xl font-bold">{out.title || "-"}</p>

                {out.hook && (
                  <>
                    <p className="text-white/60 text-xs mt-4 mb-1">Hook</p>
                    <p className="text-white/90">{out.hook}</p>
                  </>
                )}

                {out.style && (
                  <>
                    <p className="text-white/60 text-xs mt-4 mb-1">Style</p>
                    <p className="text-white/90">{out.style}</p>
                  </>
                )}
              </div>

              {/* Storyboard */}
              {Array.isArray(out.storyboard) && out.storyboard.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="font-semibold mb-3">Storyboard</p>

                  <div className="space-y-3">
                    {out.storyboard.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-black/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            Scene {s.scene ?? idx + 1}
                          </p>
                          {s.durationSec ? (
                            <span className="text-xs text-white/60">
                              {s.durationSec}s
                            </span>
                          ) : null}
                        </div>

                        {s.action && (
                          <p className="text-sm text-white/90 mt-2">
                            <span className="text-white/60">Action: </span>
                            {s.action}
                          </p>
                        )}
                        {s.camera && (
                          <p className="text-sm text-white/90 mt-1">
                            <span className="text-white/60">Camera: </span>
                            {s.camera}
                          </p>
                        )}
                        {s.lighting && (
                          <p className="text-sm text-white/90 mt-1">
                            <span className="text-white/60">Lighting: </span>
                            {s.lighting}
                          </p>
                        )}
                        {s.sound && (
                          <p className="text-sm text-white/90 mt-1">
                            <span className="text-white/60">Sound: </span>
                            {s.sound}
                          </p>
                        )}
                        {s.notes && (
                          <p className="text-sm text-white/90 mt-1">
                            <span className="text-white/60">Notes: </span>
                            {s.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Prompt */}
              {out.finalPrompt && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Final Prompt</p>
                    <button
                      onClick={() => copy(out.finalPrompt)}
                      className="text-sm px-3 py-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20"
                    >
                      Copy
                    </button>
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-white/90 bg-black/30 border border-white/10 rounded-xl p-3">
                    {out.finalPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON */}
          {res && showRaw && (
            <pre className="mt-4 whitespace-pre-wrap break-words text-xs text-white/80 bg-black/40 border border-white/10 rounded-2xl p-4">
              {JSON.stringify(res, null, 2)}
            </pre>
          )}
        </section>

        <footer className="mt-8 text-center text-xs text-white/40">
          Demo UI • Next.js App Router • /api/generate
        </footer>
      </div>
    </main>
  );
}
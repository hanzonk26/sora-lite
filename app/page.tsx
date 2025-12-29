"use client";

import { useMemo, useState } from "react";

type StoryScene = {
  scene: number;
  durationSec?: number;
  action?: string;
  camera?: string;
  lighting?: string;
  sound?: string;
  notes?: string;
};

type GenerateOutput = {
  title?: string;
  hook?: string;
  styleKey?: string;
  style?: string;
  storyboard?: StoryScene[];
  finalPrompt?: string;
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<GenerateOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  async function onGenerate() {
    setErr(null);
    setCopied(false);
    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }

      if (!json?.ok) {
        throw new Error(json?.error || "Unknown error");
      }

      setData(json.output || null);
    } catch (e: any) {
      setErr(e?.message || "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function copyFinal() {
    if (!data?.finalPrompt) return;
    try {
      await navigator.clipboard.writeText(data.finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setErr("Gagal copy. Coba manual select & copy.");
    }
  }

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-[760px] px-4 pb-14 pt-10">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Sora Lite</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Personal AI Video Practice — buat storyboard & prompt final siap tempel.
          </p>
        </header>

        {/* Card: Input */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-neutral-200">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Contoh: "Sweepy nonton film horor, sosok di TV mendekat, Sweepy gebuk TV pakai remote, sosok mundur ketakutan"'
            className="min-h-[120px] w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-sm leading-6 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-2 focus:ring-neutral-700"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Tips: isi **teks biasa** (jangan JSON).
            </p>

            <button
              onClick={onGenerate}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate (Demo)"}
            </button>
          </div>

          {/* Error */}
          {err && (
            <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          )}
        </section>

        {/* Output */}
        <section className="mt-6 space-y-4">
          {!data && !loading && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 text-sm text-neutral-400">
              Belum ada hasil. Masukkan prompt lalu generate.
            </div>
          )}

          {data && (
            <>
              {/* Summary */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{data.title || "Untitled"}</h2>
                    {data.hook && <p className="mt-1 text-sm text-neutral-300">{data.hook}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.styleKey && (
                        <span className="rounded-full border border-neutral-700 bg-neutral-950/40 px-3 py-1 text-xs text-neutral-300">
                          StyleKey: {data.styleKey}
                        </span>
                      )}
                      {data.style && (
                        <span className="rounded-full border border-neutral-700 bg-neutral-950/40 px-3 py-1 text-xs text-neutral-300">
                          {data.style}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={copyFinal}
                    disabled={!data.finalPrompt}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-950/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied ? "Copied ✅" : "Copy Final Prompt"}
                  </button>
                </div>

                {data.finalPrompt && (
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs leading-6 text-neutral-200">
                    {data.finalPrompt}
                  </pre>
                )}
              </div>

              {/* Storyboard */}
              {Array.isArray(data.storyboard) && data.storyboard.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                  <h3 className="text-sm font-semibold text-neutral-200">Storyboard</h3>

                  <div className="mt-3 grid gap-3">
                    {data.storyboard.map((s, idx) => (
                      <div
                        key={`${s.scene}-${idx}`}
                        className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold">Scene {s.scene ?? idx + 1}</p>
                          {typeof s.durationSec === "number" && (
                            <span className="text-xs text-neutral-400">{s.durationSec}s</span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          {s.action && <Row k="Action" v={s.action} />}
                          {s.camera && <Row k="Camera" v={s.camera} />}
                          {s.lighting && <Row k="Lighting" v={s.lighting} />}
                          {s.sound && <Row k="Sound" v={s.sound} />}
                          {s.notes && <Row k="Notes" v={s.notes} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-[72px] shrink-0 text-xs font-medium text-neutral-400">{k}</span>
      <span className="text-sm text-neutral-200">{v}</span>
    </div>
  );
}
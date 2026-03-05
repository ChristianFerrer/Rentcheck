"use client";

import { useState } from "react";
import AnalysisForm from "./AnalysisForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

type InputMode = "url" | "paste";

export default function UrlInputForm() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [prefillExample, setPrefillExample] = useState(false);
  const [scraped, setScraped] = useState<ScrapedListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  async function handleUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setScrapeError("");

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setScrapeError(data.error || "No se pudo leer el anuncio automáticamente.");
        setScraped(null);
      } else {
        setScraped(data as ScrapedListing);
      }
    } catch {
      setScrapeError("Error de conexión al leer el anuncio.");
      setScraped(null);
    } finally {
      setLoading(false);
      setShowManual(true);
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setLoading(true);
    setScrapeError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText, url }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setScrapeError(data.error || "No se pudieron extraer datos del texto.");
        setScraped(null);
      } else {
        setScraped(data as ScrapedListing);
      }
    } catch {
      setScrapeError("Error de conexión.");
      setScraped(null);
    } finally {
      setLoading(false);
      setShowManual(true);
    }
  }

  function handleExample() {
    setPrefillExample(true);
    setShowManual(true);
  }

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center gap-5 py-12 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
          <svg className="absolute w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-800">
            {mode === "url" ? "Leyendo el anuncio…" : "Extrayendo datos…"}
          </p>
          <p className="text-sm text-gray-500">
            {mode === "url"
              ? "Accediendo al portal y extrayendo los datos. Puede tardar hasta 30 segundos."
              : "Analizando el texto con IA para extraer los datos del anuncio."}
          </p>
        </div>
        {mode === "url" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 max-w-sm w-full">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs text-gray-500 truncate">{url}</span>
          </div>
        )}
      </div>
    );
  }

  if (showManual) {
    return (
      <div className="mt-8 animate-fade-in">
        {scrapeError && (
          <div className="max-w-2xl mx-auto mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{scrapeError}</span>
          </div>
        )}
        {scraped && (() => {
          const count = Object.entries(scraped).filter(([k, v]) => v !== undefined && k !== "city").length;
          return (
            <div className="max-w-2xl mx-auto mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2 text-sm text-green-800">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {count >= 3
                  ? "Datos importados del anuncio. Revisa y completa los campos que falten."
                  : "Solo se detectó la zona del anuncio. Completa el resto de campos manualmente."}
              </span>
            </div>
          );
        })()}
        <AnalysisForm
          sourceUrl={url || undefined}
          prefillExample={prefillExample}
          scrapedData={scraped || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "url"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pegar URL
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "paste"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pegar texto del anuncio
          </button>
        </div>
      </div>

      {/* URL mode */}
      {mode === "url" && (
        <form
          onSubmit={handleUrl}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="url"
              placeholder="https://www.idealista.com/inmueble/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-base pl-12 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Leyendo anuncio...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analizar piso
              </>
            )}
          </button>
        </form>
      )}

      {/* Paste text mode */}
      {mode === "paste" && (
        <form
          onSubmit={handlePaste}
          className="flex flex-col gap-3 max-w-2xl mx-auto"
        >
          <div className="text-sm text-gray-500 text-center">
            En Idealista/Fotocasa, pulsa <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-xs">Ctrl+A</kbd> luego <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-xs">Ctrl+C</kbd> y pega aquí. El AI extrae los datos.
          </div>
          <textarea
            placeholder="Pega aquí el texto completo del anuncio..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={6}
            className="input-base resize-y text-sm font-mono"
          />
          <button
            type="submit"
            disabled={loading || pastedText.trim().length < 50}
            className="btn-primary"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Extrayendo datos...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Extraer y analizar
              </>
            )}
          </button>
        </form>
      )}

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => setShowManual(true)}
          className="text-sm text-gray-500 hover:text-brand-600 transition-colors underline underline-offset-4"
        >
          Introducir datos manualmente
        </button>
        <span className="text-gray-300">·</span>
        <button
          onClick={handleExample}
          className="text-sm text-brand-600 hover:text-brand-700 transition-colors font-medium"
        >
          Ver ejemplo de análisis →
        </button>
      </div>
    </div>
  );
}

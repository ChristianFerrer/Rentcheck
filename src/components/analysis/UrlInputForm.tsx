"use client";

import { useState } from "react";
import AnalysisForm from "./AnalysisForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function UrlInputForm() {
  const [url, setUrl] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [prefillExample, setPrefillExample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urlNotice, setUrlNotice] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    // Simulate a brief loading state for UX
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setUrlNotice(true);
    setShowManual(true);
  }

  function handleExample() {
    setPrefillExample(true);
    setShowManual(true);
  }

  if (showManual) {
    return (
      <div className="mt-8 animate-fade-in">
        {urlNotice && url && (
          <div className="max-w-2xl mx-auto mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              La importación automática de URLs no está disponible aún. Introduce los datos del anuncio manualmente a continuación.
            </span>
          </div>
        )}
        <AnalysisForm sourceUrl={url || undefined} prefillExample={prefillExample} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAnalyze}
        className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
      >
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
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
          disabled={loading}
          className="btn-primary whitespace-nowrap"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
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

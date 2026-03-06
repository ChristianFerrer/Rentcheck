"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AnalysisForm from "./AnalysisForm";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

type State = "cta" | "loading" | "form";

export default function UrlInputForm() {
  const [state, setState] = useState<State>("cta");
  const [scraped, setScraped] = useState<ScrapedListing | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [scrapeError, setScrapeError] = useState("");
  const submitted = useRef(false);

  // Detect bookmarklet arrival (?bm=1) and auto-process
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("bm") !== "1") return;

    const textParam = params.get("text") ?? "";
    const urlParam = params.get("url") ?? "";
    window.history.replaceState({}, "", window.location.pathname);

    if (textParam.length < 50) return;

    setSourceUrl(urlParam);
    if (submitted.current) return;
    submitted.current = true;
    submitPaste(textParam, urlParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitPaste(text: string, url: string) {
    setState("loading");
    setScrapeError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setScrapeError(data.error || "No se pudieron extraer los datos del anuncio.");
      } else {
        setScraped(data as ScrapedListing);
      }
    } catch {
      setScrapeError("Error de conexión.");
    } finally {
      setState("form");
    }
  }

  // Loading state (bookmarklet processing)
  if (state === "loading") {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-5 py-12 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
          <Image src="/house.png" alt="" width={28} height={28} className="absolute rounded-lg" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-gray-800">Extrayendo datos del anuncio…</p>
          <p className="text-sm text-gray-500">La IA está leyendo el anuncio para pre-rellenar el formulario.</p>
        </div>
      </div>
    );
  }

  // Bookmarklet form state (pre-filled or empty after processing)
  if (state === "form") {
    const fieldCount = scraped
      ? Object.entries(scraped).filter(([k, v]) => v !== undefined && k !== "city").length
      : 0;

    return (
      <div className="mt-8 animate-fade-in text-left">
        {scrapeError && (
          <div className="max-w-2xl mx-auto mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No se pudieron leer todos los datos. Completa el formulario manualmente.</span>
          </div>
        )}
        {scraped && (
          <div className="max-w-2xl mx-auto mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2 text-sm text-green-800">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {fieldCount >= 3
                ? "Datos importados. Revisa y completa los campos que falten."
                : "Solo se detectó la zona. Completa el resto manualmente."}
            </span>
          </div>
        )}
        <AnalysisForm sourceUrl={sourceUrl || undefined} scrapedData={scraped || undefined} />
      </div>
    );
  }

  // Default CTA state (normal homepage visit)
  return (
    <div className="flex flex-col items-center gap-6 mt-4">
      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl">
        <Link href="/bookmarklet" className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Instalar bookmarklet — gratis
        </Link>
        <a
          href="#analizar"
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors whitespace-nowrap"
        >
          O introduce los datos manualmente →
        </a>
      </div>

      {/* Bookmarklet explainer pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-500">
        <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Un clic en Idealista o Fotocasa — y RentCheck analiza el precio al instante
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-400">
        {[
          "Gratis",
          "Resultados en segundos",
          "Guarda tu historial",
        ].map((label) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

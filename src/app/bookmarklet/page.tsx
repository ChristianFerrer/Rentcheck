"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookmarkletPage() {
  const [bookmarkletHref, setBookmarkletHref] = useState("#");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    // Minified bookmarklet: grabs visible text + URL from the current page and opens Rentcheck
    const js = `javascript:(function(){var t=document.body.innerText.slice(0,5000);var u=location.href;var w=window.open('${origin}/?bm=1&url='+encodeURIComponent(u)+'&text='+encodeURIComponent(t),'_blank');if(!w)alert('Permite ventanas emergentes para rentcheck');})();`;
    setBookmarkletHref(js);
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(bookmarkletHref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="container-app py-16 max-w-2xl">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Bookmarklet de Rentcheck
      </h1>
      <p className="text-gray-500 mb-10 text-lg">
        Analiza cualquier anuncio de Idealista con un clic, sin copiar y pegar manualmente.
      </p>

      {/* Why */}
      <div className="card p-5 mb-8 bg-amber-50 border-amber-200">
        <h2 className="font-semibold text-amber-900 mb-1 text-sm">¿Por qué esto?</h2>
        <p className="text-sm text-amber-800">
          Idealista usa DataDome, un sistema anti-bot que bloquea todos los scrapers automáticos.
          El bookmarklet corre en <strong>tu propio navegador</strong> mientras estás en la página,
          por lo que Idealista no lo detecta como bot.
        </p>
      </div>

      {/* Install step */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Instalación (1 vez)</h2>
        <ol className="space-y-4 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">1</span>
            <span>
              Asegúrate de que la <strong>barra de favoritos está visible</strong> en tu navegador
              {" "}(Chrome: <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-xs">Ctrl+Shift+B</kbd>)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">2</span>
            <div className="space-y-2 flex-1">
              <span>Arrastra este botón a la barra de favoritos:</span>
              <div className="flex items-center gap-3">
                <a
                  href={bookmarkletHref}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold shadow cursor-move select-none hover:bg-brand-700 active:scale-95 transition-all"
                  onClick={(e) => e.preventDefault()}
                  draggable
                  title="Arrastra este botón a tus favoritos"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analizar en Rentcheck
                </a>
                <span className="text-gray-400 text-xs">← arrastra esto</span>
              </div>
              <p className="text-xs text-gray-400">
                ¿No funciona el arrastre? {" "}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
                >
                  {copied ? "¡Copiado!" : "Copia el código"}
                </button>
                {" "}y créalo manualmente en favoritos.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Usage */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Cómo usarlo</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          {[
            "Abre cualquier anuncio de Idealista en tu navegador",
            "Haz clic en «Analizar en Rentcheck» de tus favoritos",
            "Rentcheck se abre en una nueva pestaña con los datos ya extraídos",
            "Revisa los campos y pulsa «Analizar»",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

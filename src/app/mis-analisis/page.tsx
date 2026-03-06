"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PriceBadge from "@/components/ui/PriceBadge";
import type { PriceLabel } from "@/types";

interface AnalysisSummary {
  id: string;
  zone_name: string;
  price_monthly: number;
  estimated_price: number;
  estimated_min: number;
  estimated_max: number;
  difference_pct: number;
  label: PriceLabel;
  created_at: string;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  condition: string;
  source_url?: string;
}

function formatEur(n: number) {
  return n.toLocaleString("es-ES") + "€";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MisAnalisisPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      try {
        const res = await fetch("/api/analyses", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setAnalyses(data.analyses ?? []);
      } catch {
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="container-app py-16 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-500 mt-4">Cargando historial...</p>
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <div className="container-app py-16 text-center">
        <div className="max-w-md mx-auto card p-10">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Inicia sesión para ver tu historial</h1>
          <p className="text-gray-500 text-sm mb-6">
            Los análisis se guardan automáticamente cuando estás logueado. Crea una cuenta gratis para acceder a tu historial.
          </p>
          <Link href="/" className="btn-primary">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis análisis</h1>
          <p className="text-gray-500 text-sm mt-1">
            {analyses.length === 0
              ? "Aún no has analizado ningún piso."
              : `${analyses.length} piso${analyses.length > 1 ? "s" : ""} analizado${analyses.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/" className="btn-primary text-sm">
          Nuevo análisis
        </Link>
      </div>

      {analyses.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400 mb-6">Analiza tu primer piso para que aparezca aquí.</p>
          <Link href="/" className="btn-primary">
            Analizar un piso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <div key={a.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand-200 hover:shadow-md transition-all">
              <Link href={`/resultado/${a.id}`} className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{a.zone_name}</span>
                  <PriceBadge label={a.label} size="sm" />
                  {a.source_url && (
                    <a
                      href={a.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                      title="Ver anuncio original"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Anuncio
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {a.sqm}m² · {a.bedrooms} hab. · {a.bathrooms} baño{a.bathrooms > 1 ? "s" : ""} · {a.condition.replace("_", " ")}
                </p>
              </Link>

              <div className="flex items-center gap-6 text-right sm:flex-shrink-0">
                <div>
                  <p className="text-xs text-gray-400">Precio anunciado</p>
                  <p className="text-lg font-bold text-gray-900">{formatEur(a.price_monthly)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Referencia</p>
                  <p className="text-sm font-medium text-gray-600">
                    {formatEur(a.estimated_min)}–{formatEur(a.estimated_max)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Diferencia</p>
                  <p className={`text-sm font-semibold ${
                    a.difference_pct > 8 ? "text-red-600" :
                    a.difference_pct < -8 ? "text-green-600" :
                    "text-yellow-600"
                  }`}>
                    {a.difference_pct > 0 ? "+" : ""}{a.difference_pct.toFixed(1)}%
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

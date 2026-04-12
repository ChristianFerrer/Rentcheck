"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PriceBadge from "@/components/ui/PriceBadge";
import { generateNegotiationText } from "@/lib/algorithm/estimator";
import { checkIncasol, getDistrictForBarrio, INCASOL_CHECKER_URL, SINDICAT_URL, COMPLAINT_URL, YEAR_BAND_LABELS } from "@/lib/incasol";
import type { YearBand } from "@/lib/incasol";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { createPortal } from "react-dom";
import type { AnalysisResult, ComparableListing, MarketContext } from "@/types";

interface Props {
  result: AnalysisResult;
  comparables: ComparableListing[];
  marketContext?: MarketContext | null;
}

function formatEur(n: number) {
  return n.toLocaleString("es-ES") + "€";
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function CollapsibleSection({ title, icon, children }: { title: string; icon: React.ReactNode; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          {icon}
          {title}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ActionCard({ icon, title, desc, href }: { icon: React.ReactNode; title: string; desc: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700">
            Ver más →
          </a>
        )}
      </div>
    </div>
  );
}

export default function ResultDashboard({ result, comparables, marketContext }: Props) {
  const negotiationText = generateNegotiationText(result);
  const eurM2Price = Math.round(result.price_monthly / result.sqm);
  const eurM2Ref = result.eur_m2_ref;
  const [copied, setCopied] = useState(false);
  const [copiedNegotiation, setCopiedNegotiation] = useState(false);
  const [salary, setSalary] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();
  const district = getDistrictForBarrio(result.zone_name);
  const VALID_YEAR_BANDS: YearBand[] = ["pre1960", "1960_1990", "1991_2007", "2008_plus", "unknown"];
  const yearBand: YearBand = VALID_YEAR_BANDS.includes(result.year_of_construction as YearBand)
    ? (result.year_of_construction as YearBand)
    : "unknown";
  const incasol = checkIncasol(district, result.sqm, result.price_monthly, yearBand);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then((res) => {
      setIsLoggedIn(!!res.data.session);
    });
  }, []);

  const salaryNum = Number(salary);
  const rentPct = salaryNum > 0 ? (result.price_monthly / salaryNum) * 100 : null;
  const affordablePrice = salaryNum > 0 ? Math.round(salaryNum * 0.30) : null;

  const labelColors: Record<string, string> = {
    BAJO: "from-green-500 to-emerald-600",
    MEDIO: "from-yellow-500 to-amber-500",
    ELEVADO: "from-red-500 to-rose-600",
  };

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyNegotiation() {
    navigator.clipboard.writeText(negotiationText).then(() => {
      setCopiedNegotiation(true);
      setTimeout(() => setCopiedNegotiation(false), 2000);
    });
  }

  function getWhatsAppMessage() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (result.label === "BAJO") {
      return `He encontrado un piso con buen precio en ${result.zone_name}: ${result.price_monthly.toLocaleString("es-ES")}€/mes, ${result.sqm}m² (${formatPct(result.difference_pct)} del mercado). Ver análisis: ${url}`;
    }
    if (result.label === "ELEVADO" && incasol.isAboveLimit) {
      return `Cuidado con este piso en ${result.zone_name}: cobra ${result.price_monthly.toLocaleString("es-ES")}€/mes pero el máximo legal estimado es ${incasol.incasolMaxRent.toLocaleString("es-ES")}€/mes (~${incasol.overByMonthly.toLocaleString("es-ES")}€/mes de más). Analizado con RentCheck: ${url}`;
    }
    return `He analizado un piso en ${result.zone_name}: ${result.price_monthly.toLocaleString("es-ES")}€/mes, ${result.sqm}m² (${formatPct(result.difference_pct)} del mercado). Ver análisis: ${url}`;
  }

  return (
    <div className="container-app py-10 animate-fade-in">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap print-hide">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nuevo análisis
        </Link>
        {result.source_url && (
          <a href={result.source_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver anuncio
          </a>
        )}
      </div>

      {/* Hero result card */}
      <div className="card overflow-hidden mb-4">
        <div className={`bg-gradient-to-r ${labelColors[result.label]} p-8 text-white`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">Veredicto</p>
              <PriceBadge label={result.label} size="lg" />
              <p className="mt-4 text-white/90 text-lg max-w-md">
                {result.difference_pct > 0
                  ? `Este piso está aproximadamente un ${Math.abs(result.difference_pct)}% por encima del precio medio del mercado.`
                  : result.difference_pct < 0
                  ? `Este piso está aproximadamente un ${Math.abs(result.difference_pct)}% por debajo del precio medio del mercado.`
                  : "Este piso está en línea con el precio medio del mercado."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Precio anunciado</p>
              <p className="text-4xl font-bold">{formatEur(result.price_monthly)}</p>
              <p className="text-white/70 text-sm">/mes</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {[
            { label: "Precio estimado", value: formatEur(result.estimated_price), sub: "referencia mercado" },
            { label: "Rango estimado", value: `${formatEur(result.estimated_min)} – ${formatEur(result.estimated_max)}`, sub: "±7%" },
            { label: "€/m² anunciado", value: `${eurM2Price} €/m²`, sub: `ref: ${eurM2Ref} €/m²` },
            { label: "Diferencia", value: formatPct(result.difference_pct), sub: "vs mercado", highlight: true },
          ].map((stat) => (
            <div key={stat.label} className="p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${
                stat.highlight
                  ? result.label === "BAJO" ? "text-green-600" : result.label === "ELEVADO" ? "text-red-600" : "text-yellow-600"
                  : "text-gray-900"
              }`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save CTA — anonymous users */}
      {!isLoggedIn && result.id && (
        <div className="mb-6 p-4 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-between gap-4 flex-wrap print-hide">
          <p className="text-sm text-brand-800">
            <strong>Guarda este análisis</strong> en tu historial para consultarlo más tarde.
          </p>
          <button onClick={() => setShowAuthModal(true)} className="btn-primary text-sm py-2 px-4 flex-shrink-0">
            Iniciar sesión
          </button>
        </div>
      )}

      {/* INCASÒL — Legal rent cap */}
      <div className="card overflow-hidden mb-6">
        {/* Verdict header */}
        <div className={`p-5 ${incasol.isAboveLimit ? "bg-red-50 border-b border-red-100" : "bg-green-50 border-b border-green-100"}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${incasol.isAboveLimit ? "bg-red-100" : "bg-green-100"}`}>
                {incasol.isAboveLimit ? (
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-lg font-bold ${incasol.isAboveLimit ? "text-red-800" : "text-green-800"}`}>
                  {incasol.isAboveLimit ? "Supera el límite legal" : "Dentro del límite legal"}
                </p>
                <p className={`text-xs ${incasol.isAboveLimit ? "text-red-600" : "text-green-600"}`}>
                  Índex de Referència de Preus del Lloguer (IRPL) · Barcelona zona tensionada
                </p>
              </div>
            </div>
            {/* Confidence badge */}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              incasol.confidence === "alta"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : incasol.confidence === "media"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}>
              {incasol.confidence === "alta" ? "Alta precisión" : incasol.confidence === "media" ? "Estimación media" : "Estimación orientativa"}
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Key numbers */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Precio anunciado</p>
              <p className="text-xl font-bold text-gray-900">{result.price_monthly.toLocaleString("es-ES")}€</p>
              <p className="text-xs text-gray-400">/mes</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${incasol.isAboveLimit ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
              <p className="text-xs text-gray-500 mb-1">Máx. legal IRPL</p>
              <p className={`text-xl font-bold ${incasol.isAboveLimit ? "text-red-700" : "text-green-700"}`}>
                {incasol.incasolMaxRent.toLocaleString("es-ES")}€
              </p>
              <p className="text-xs text-gray-400">{incasol.incasolEurM2} €/m²</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${incasol.isAboveLimit ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
              <p className="text-xs text-gray-500 mb-1">{incasol.isAboveLimit ? "De más al año" : "Ahorro vs. límite"}</p>
              <p className={`text-xl font-bold ${incasol.isAboveLimit ? "text-red-700" : "text-green-700"}`}>
                {incasol.isAboveLimit
                  ? `${incasol.overByAnnual.toLocaleString("es-ES")}€`
                  : `${(incasol.incasolMaxRent - result.price_monthly).toLocaleString("es-ES")}€`}
              </p>
              {incasol.isAboveLimit && (
                <p className="text-xs text-red-600 font-medium">{incasol.overByMonthly.toLocaleString("es-ES")}€/mes</p>
              )}
            </div>
          </div>

          {/* Calculation transparency */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 flex-wrap">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Calculado con: {result.sqm}m² · {yearBand !== "unknown" ? YEAR_BAND_LABELS[yearBand] : "año desconocido"} · {district}
              {yearBand !== "unknown" && ` (factor ×${incasol.yearFactor})`}
            </span>
          </div>

          {/* Action steps for above limit */}
          {incasol.isAboveLimit && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Pasos a seguir</p>
              {[
                {
                  step: "1",
                  icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
                  title: "Verifica el índice exacto",
                  desc: "Comprueba el IRPL oficial con la dirección del piso para tener certeza legal.",
                  href: INCASOL_CHECKER_URL,
                  linkText: "Consultar IRPL oficial →",
                },
                {
                  step: "2",
                  icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.97Zm-12.5 0L3.63 15.696c-.122.499.106 1.028.589 1.202a5.989 5.989 0 0 0 2.031.352 5.989 5.989 0 0 0 2.031-.352c.483-.174.711-.703.589-1.202L6.25 4.97Z" /></svg>,
                  title: "Pide asesoría gratuita",
                  desc: "El Sindicat de Llogateres ofrece ayuda jurídica gratuita para reclamar alquileres sobre el índice.",
                  href: SINDICAT_URL,
                  linkText: "Sindicat de Llogateres →",
                },
                {
                  step: "3",
                  icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>,
                  title: "Presenta una reclamación formal",
                  desc: "Si el propietario incumple el IRPL puedes denunciarlo gratuitamente a la Agència de l'Habitatge.",
                  href: COMPLAINT_URL,
                  linkText: "Formulario de denuncia →",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    {item.href && (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-red-600 hover:text-red-700">
                        {item.linkText}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Within limit note */}
          {!incasol.isAboveLimit && (
            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-green-800">
                Este alquiler parece estar dentro del límite legal para {district}.{" "}
                <a href={INCASOL_CHECKER_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  Verifica con la dirección exacta
                </a>{" "}
                para tener certeza legal.
              </p>
            </div>
          )}

          {/* Source trust badge */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs text-gray-400">
              Datos IRPL 2024 · Agència de l'Habitatge de Catalunya · Decret Llei 17/2019 + Llei 11/2020 + Ley de Vivienda 2023
            </p>
          </div>
        </div>
      </div>

      {/* ¿Qué hago ahora? */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ¿Qué hago ahora?
        </h2>
        <div className="space-y-3">
          {result.label === "BAJO" && (
            <>
              <ActionCard
                icon={<svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>}
                title="Buen precio — negocia las condiciones"
                desc="Con este precio de salida puedes pedir mejoras: pintura, electrodomésticos, meses de carencia o una cláusula de renuncia al subarrendamiento."
              />
              <ActionCard
                icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>}
                title="Revisa el contrato antes de firmar"
                desc="Asegúrate de que incluye la cédula de habitabilidad, el certificado energético y que la fianza no excede 2 mensualidades."
                href="https://habitatge.gencat.cat/ca/detalls/Article/Contractes-de-lloguer"
              />
            </>
          )}
          {result.label === "MEDIO" && (
            <>
              <ActionCard
                icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>}
                title="Intenta negociar a la baja"
                desc={`El precio está en rango de mercado, pero siempre hay margen. Propón ${formatEur(result.estimated_min)}/mes como contraoferta razonada.`}
              />
              <ActionCard
                icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>}
                title="Verifica el índice IRPL"
                desc="Comprueba con la dirección exacta del piso si el precio supera el límite legal."
                href={INCASOL_CHECKER_URL}
              />
            </>
          )}
          {result.label === "ELEVADO" && (
            <>
              <ActionCard
                icon={<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.97Zm-12.5 0L3.63 15.696c-.122.499.106 1.028.589 1.202a5.989 5.989 0 0 0 2.031.352 5.989 5.989 0 0 0 2.031-.352c.483-.174.711-.703.589-1.202L6.25 4.97Z" /></svg>}
                title={incasol.isAboveLimit ? "Este alquiler podría ser ilegal" : "Precio por encima del mercado"}
                desc={incasol.isAboveLimit
                  ? `El máximo legal estimado es ${formatEur(incasol.incasolMaxRent)}/mes. Tienes derecho a reclamar la diferencia.`
                  : `Este piso está un ${Math.abs(result.difference_pct)}% sobre el precio de mercado. Negocia usando el análisis como argumento.`}
                href={INCASOL_CHECKER_URL}
              />
              <ActionCard
                icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>}
                title="Asesoría gratuita del Sindicat de Llogateres"
                desc="El Sindicat ofrece asesoría jurídica gratuita. Te ayudan a reclamar alquileres sobre el índice y a defender tus derechos."
                href={SINDICAT_URL}
              />
              <ActionCard
                icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>}
                title="Reclamación formal a l'Agència de l'Habitatge"
                desc="Si el propietario incumple el IRPL puedes presentar una reclamación formal gratuita."
                href="https://habitatge.gencat.cat/ca/detalls/Tramit/Denuncia-per-incompliment-de-la-normativa-d-habitatge-H107Ge"
              />
            </>
          )}
        </div>
      </div>

      {/* Share */}
      <div className="card p-6 mb-8 bg-brand-50 border-brand-100 print-hide">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Comparte este análisis</h3>
            <p className="text-sm text-gray-500">Comparte los resultados con quien busca piso o quiera denunciar precios abusivos.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <button onClick={handleCopyLink} className="btn-secondary text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-1 space-y-4">
          {/* Affordability calculator */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              ¿Puedes permitirte este piso?
            </h2>
            <p className="text-xs text-gray-400 mb-4">Regla del 30%: el alquiler no debería superar el 30% de tus ingresos netos.</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="label-base">Tu salario neto mensual</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="2000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="input-base pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">€</span>
                </div>
              </div>
            </div>
            {rentPct !== null && affordablePrice !== null && (
              <div className={`mt-4 rounded-xl p-4 ${rentPct <= 30 ? "bg-green-50 border border-green-200" : rentPct <= 40 ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${rentPct <= 30 ? "text-green-800" : rentPct <= 40 ? "text-amber-800" : "text-red-800"}`}>
                    {rentPct <= 30 ? "Asequible" : rentPct <= 40 ? "Ajustado" : "Por encima de lo recomendado"}
                  </span>
                  <span className={`text-2xl font-bold ${rentPct <= 30 ? "text-green-700" : rentPct <= 40 ? "text-amber-700" : "text-red-700"}`}>{rentPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${rentPct <= 30 ? "bg-green-500" : rentPct <= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(rentPct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs ${rentPct <= 30 ? "text-green-700" : rentPct <= 40 ? "text-amber-700" : "text-red-700"}`}>
                  {rentPct <= 30
                    ? `Con tu salario de ${formatEur(salaryNum)}, este piso está dentro de lo recomendado.`
                    : `Para que sea asequible deberías pagar máximo ${formatEur(affordablePrice)}/mes o ganar ${formatEur(Math.round(result.price_monthly / 0.30))}/mes.`}
                </p>
              </div>
            )}
          </div>

          {/* Listing details — collapsed */}
          <CollapsibleSection
            title="Detalles del piso"
            icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          >
            <dl className="space-y-2 text-sm">
              {[
                { label: "Zona", value: result.zone_name },
                { label: "Superficie", value: `${result.sqm} m²` },
                { label: "Habitaciones", value: `${result.bedrooms} hab. · ${result.bathrooms} baño${result.bathrooms > 1 ? "s" : ""}` },
                { label: "Planta", value: result.floor === 0 ? "Bajo" : `${result.floor}ª` },
                { label: "Estado", value: result.condition.replace("_", " ") },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-gray-500">{item.label}</dt>
                  <dd className="font-medium text-gray-900 capitalize">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleSection>

          {/* Factors — collapsed */}
          <CollapsibleSection
            title="Factores analizados"
            icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            <div className="space-y-3">
              {result.explanation.map((f, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{f.factor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${f.impact.startsWith("+") ? "bg-green-100 text-green-700" : f.impact.startsWith("-") ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4">
          {/* Comparables */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Pisos similares en el mercado
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Zona</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Precio</th>
                    <th className="text-right py-2 text-gray-500 font-medium">m²</th>
                    <th className="text-right py-2 text-gray-500 font-medium">€/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-900">{c.zone}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatEur(c.price)}</td>
                      <td className="py-3 text-right text-gray-600">{c.sqm}m²</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${c.eur_m2 < eurM2Ref ? "text-green-600" : c.eur_m2 > eurM2Ref * 1.1 ? "text-red-600" : "text-yellow-600"}`}>
                          {c.eur_m2}€
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              * Estimados a partir del precio oficial Generalitat Catalunya
              {marketContext ? ` (${marketContext.districtAvgPricePerM2.toFixed(1)} €/m² en ${result.zone_name}, ${marketContext.year})` : ""}.
            </p>
          </div>

          {/* Negotiation text */}
          {negotiationText && (
            <div className="card p-6 border-l-4 border-orange-400">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Texto sugerido de negociación
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{negotiationText}</p>
              <button onClick={handleCopyNegotiation} className="mt-4 btn-secondary text-sm py-2 px-4 print-hide">
                {copiedNegotiation ? "¡Copiado!" : "Copiar texto"}
              </button>
            </div>
          )}

          {/* Generalitat data — collapsed */}
          {marketContext && (
            <CollapsibleSection
              title="Datos oficiales Generalitat de Catalunya"
              icon={<svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            >
              <p className="text-xs text-gray-400 mb-4">
                Registre de Fiançaments de Contractes de Lloguer · {marketContext.source === "api" ? "Fuente en tiempo real" : "Datos de referencia"}
              </p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Media Barcelona</p>
                  <p className="text-lg font-bold text-gray-900">{marketContext.cityAvgPricePerM2.toFixed(1)} €/m²</p>
                  <p className="text-xs text-gray-400">{marketContext.year}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Factor {result.zone_name}</p>
                  <p className="text-lg font-bold text-gray-900">×{marketContext.districtFactor.toFixed(3)}</p>
                  <p className="text-xs text-gray-400">ajuste distrito</p>
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Ref. zona oficial</p>
                  <p className="text-lg font-bold text-brand-700">{marketContext.districtAvgPricePerM2.toFixed(1)} €/m²</p>
                  <p className="text-xs text-gray-400">precio estimado</p>
                </div>
              </div>
              {marketContext.history.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">Evolución €/m² en Barcelona</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Año</th>
                          <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Trim.</th>
                          <th className="text-right py-1.5 text-xs text-gray-500 font-medium">€/m²</th>
                          <th className="text-right py-1.5 text-xs text-gray-500 font-medium">Precio medio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketContext.history.slice(0, 8).map((h, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i === 0 ? "font-semibold bg-gray-50" : ""}`}>
                            <td className="py-2 text-gray-900">{h.year}</td>
                            <td className="py-2 text-gray-600">{h.quarter}</td>
                            <td className="py-2 text-right text-gray-900">{h.avgPricePerM2.toFixed(2)} €</td>
                            <td className="py-2 text-right text-gray-600">{h.avgMonthlyPrice > 0 ? formatEur(Math.round(h.avgMonthlyPrice)) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Fuente: <a href="https://analisi.transparenciacatalunya.cat/Habitatge/Preu-mitj-del-lloguer-d-habitatges-per-municipi/qww9-bvhh" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Generalitat de Catalunya</a>
                  </p>
                </>
              )}
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Auth modal (save analysis) */}
      {mounted && showAuthModal && createPortal(
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onContinueAsGuest={() => setShowAuthModal(false)}
          onGoogleRedirect={() => setShowAuthModal(false)}
        />,
        document.body
      )}
    </div>
  );
}

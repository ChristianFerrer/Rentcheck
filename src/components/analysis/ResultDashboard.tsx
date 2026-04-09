"use client";

import { useState } from "react";
import Link from "next/link";
import PriceBadge from "@/components/ui/PriceBadge";
import { generateNegotiationText } from "@/lib/algorithm/estimator";
import { checkIncasol, getDistrictForBarrio, INCASOL_CHECKER_URL, SINDICAT_URL } from "@/lib/incasol";
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

function ActionCard({ icon, title, desc, href }: { icon: string; title: string; desc: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
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

  const district = getDistrictForBarrio(result.zone_name);
  const incasol = checkIncasol(district, result.sqm, result.price_monthly);

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

  function handlePrint() {
    window.print();
  }

  const salaryNum = Number(salary);
  const rentPct = salaryNum > 0 ? (result.price_monthly / salaryNum) * 100 : null;
  const affordablePrice = salaryNum > 0 ? Math.round(salaryNum * 0.30) : null;

  const labelColors: Record<string, string> = {
    BAJO: "from-green-500 to-emerald-600",
    MEDIO: "from-yellow-500 to-amber-500",
    ELEVADO: "from-red-500 to-rose-600",
  };

  return (
    <div className="container-app py-10 animate-fade-in">
      {/* Back link + actions */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap print-hide">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nuevo análisis
        </Link>
        <div className="flex items-center gap-3">
          {result.source_url && (
            <a
              href={result.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver anuncio
            </a>
          )}
          <button
            onClick={handlePrint}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Hero result card */}
      <div className={`card overflow-hidden mb-8`}>
        <div className={`bg-gradient-to-r ${labelColors[result.label]} p-8 text-white`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">
                Veredicto
              </p>
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

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {[
            {
              label: "Precio estimado",
              value: formatEur(result.estimated_price),
              sub: "referencia mercado",
            },
            {
              label: "Rango estimado",
              value: `${formatEur(result.estimated_min)} – ${formatEur(result.estimated_max)}`,
              sub: "±7%",
            },
            {
              label: "€/m² anunciado",
              value: `${eurM2Price} €/m²`,
              sub: `ref: ${eurM2Ref} €/m²`,
            },
            {
              label: "Diferencia",
              value: formatPct(result.difference_pct),
              sub: "vs mercado",
              highlight: true,
            },
          ].map((stat) => (
            <div key={stat.label} className="p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p
                className={`text-xl font-bold ${
                  stat.highlight
                    ? result.label === "BAJO"
                      ? "text-green-600"
                      : result.label === "ELEVADO"
                      ? "text-red-600"
                      : "text-yellow-600"
                    : "text-gray-900"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Factors */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Factores analizados
            </h2>
            <div className="space-y-3">
              {result.explanation.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {f.factor}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {f.description}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                      f.impact.startsWith("+")
                        ? "bg-green-100 text-green-700"
                        : f.impact.startsWith("-")
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Listing details */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Detalles del piso
            </h2>
            <dl className="space-y-2 text-sm">
              {[
                { label: "Zona", value: result.zone_name },
                { label: "Superficie", value: `${result.sqm} m²` },
                {
                  label: "Habitaciones",
                  value: `${result.bedrooms} hab. · ${result.bathrooms} baño${result.bathrooms > 1 ? "s" : ""}`,
                },
                {
                  label: "Planta",
                  value: result.floor === 0 ? "Bajo" : `${result.floor}ª`,
                },
                { label: "Estado", value: result.condition.replace("_", " ") },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-gray-500">{item.label}</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
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
                    <th className="text-left py-2 text-gray-500 font-medium">
                      Zona
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      Precio
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      m²
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      €/m²
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 text-gray-900">{c.zone}</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatEur(c.price)}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {c.sqm}m²
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-semibold ${
                            c.eur_m2 < eurM2Ref
                              ? "text-green-600"
                              : c.eur_m2 > eurM2Ref * 1.1
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {c.eur_m2}€
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              * Pisos similares estimados a partir del precio oficial Generalitat Catalunya
              {marketContext ? ` (${marketContext.districtAvgPricePerM2.toFixed(1)} €/m² en ${result.zone_name}, año ${marketContext.year})` : " de referencia de zona"}.
            </p>
          </div>

          {/* Calculadora de accesibilidad */}
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
              <div className={`mt-4 rounded-xl p-4 ${
                rentPct <= 30 ? "bg-green-50 border border-green-200" :
                rentPct <= 40 ? "bg-amber-50 border border-amber-200" :
                "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    rentPct <= 30 ? "text-green-800" :
                    rentPct <= 40 ? "text-amber-800" :
                    "text-red-800"
                  }`}>
                    {rentPct <= 30 ? "Asequible" : rentPct <= 40 ? "Ajustado" : "Por encima de lo recomendado"}
                  </span>
                  <span className={`text-2xl font-bold ${
                    rentPct <= 30 ? "text-green-700" :
                    rentPct <= 40 ? "text-amber-700" :
                    "text-red-700"
                  }`}>{rentPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      rentPct <= 30 ? "bg-green-500" :
                      rentPct <= 40 ? "bg-amber-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(rentPct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs ${
                  rentPct <= 30 ? "text-green-700" :
                  rentPct <= 40 ? "text-amber-700" :
                  "text-red-700"
                }`}>
                  {rentPct <= 30
                    ? `Con tu salario de ${formatEur(salaryNum)}, este piso está dentro de lo recomendado.`
                    : `Para que sea asequible deberías pagar máximo ${formatEur(affordablePrice)}/mes o ganar ${formatEur(Math.round(result.price_monthly / 0.30))}/mes.`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Generalitat official market data */}
          {marketContext && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Precio oficial según la Generalitat de Catalunya
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Datos del Registre de Fiançaments de Contractes de Lloguer · {marketContext.source === "api" ? "Fuente en tiempo real" : "Datos de referencia"}
              </p>

              {/* Key stats */}
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

              {/* Historical trend table */}
              {marketContext.history.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">Evolución precio €/m² en Barcelona ciudad</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Año</th>
                          <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Trimestre</th>
                          <th className="text-right py-1.5 text-xs text-gray-500 font-medium">€/m² medio</th>
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
                    Fuente: <a href="https://analisi.transparenciacatalunya.cat/Habitatge/Preu-mitj-del-lloguer-d-habitatges-per-municipi/qww9-bvhh" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Generalitat de Catalunya — Preu mitjà del lloguer per municipi</a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* INCASÒL — Legal rent cap */}
          <div className={`card p-6 border-l-4 ${incasol.isAboveLimit ? "border-red-400" : "border-green-400"}`}>
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ¿Es legal este alquiler?
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Barcelona es zona tensionada desde 2022. El precio máximo está limitado por el Índex de Referència de Preus del Lloguer (IRPL) · Estimación por distrito
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Precio anunciado</p>
                <p className="text-lg font-bold text-gray-900">{result.price_monthly.toLocaleString("es-ES")}€</p>
                <p className="text-xs text-gray-400">/mes</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${incasol.isAboveLimit ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
                <p className="text-xs text-gray-500 mb-1">Máx. legal estimado</p>
                <p className={`text-lg font-bold ${incasol.isAboveLimit ? "text-red-700" : "text-green-700"}`}>
                  {incasol.incasolMaxRent.toLocaleString("es-ES")}€
                </p>
                <p className="text-xs text-gray-400">{incasol.incasolEurM2} €/m² IRPL</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${incasol.isAboveLimit ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
                <p className="text-xs text-gray-500 mb-1">{incasol.isAboveLimit ? "Exceso mensual" : "Diferencia"}</p>
                <p className={`text-lg font-bold ${incasol.isAboveLimit ? "text-red-700" : "text-green-700"}`}>
                  {incasol.isAboveLimit ? `+${incasol.overByMonthly.toLocaleString("es-ES")}€` : "Dentro del límite"}
                </p>
                {incasol.isAboveLimit && (
                  <p className="text-xs text-red-600 font-medium">{incasol.overByAnnual.toLocaleString("es-ES")}€/año</p>
                )}
              </div>
            </div>

            {incasol.isAboveLimit ? (
              <div className="bg-red-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-1">
                  Este alquiler podría superar el índice legal en aproximadamente {incasol.overByMonthly.toLocaleString("es-ES")}€/mes ({incasol.overByAnnual.toLocaleString("es-ES")}€/año)
                </p>
                <p className="text-xs text-red-700">
                  Estimación basada en el IRPL del distrito {district}. El índice exacto depende de la sección censal, superficie y año de construcción.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-green-800 font-medium mb-1">
                  Este alquiler parece estar dentro del límite legal estimado para {district}
                </p>
                <p className="text-xs text-green-700">
                  Verifica el índice exacto con la dirección del piso para confirmarlo.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href={INCASOL_CHECKER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Verificar índice oficial
              </a>
              {incasol.isAboveLimit && (
                <a
                  href={SINDICAT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  Pedir asesoría gratuita
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Fuente: <a href={INCASOL_CHECKER_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Agència de l&apos;Habitatge de Catalunya — IRPL 2024</a>
            </p>
          </div>

          {/* ¿Qué hago ahora? */}
          <div className="card p-6">
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
                    icon="✅"
                    title="Buen precio — negocia las condiciones"
                    desc="Con este precio de salida puedes pedir mejoras: pintura, electrodomésticos, meses de carencia, o una cláusula de renuncia al subarrendamiento."
                  />
                  <ActionCard
                    icon="📋"
                    title="Revisa el contrato antes de firmar"
                    desc="Asegúrate de que el contrato incluye la cédula de habitabilidad, el certificado energético y la fianza no excede 2 mensualidades."
                    href="https://habitatge.gencat.cat/ca/detalls/Article/Contractes-de-lloguer"
                  />
                </>
              )}
              {result.label === "MEDIO" && (
                <>
                  <ActionCard
                    icon="💬"
                    title="Intenta negociar a la baja"
                    desc={`El precio está en el rango de mercado, pero siempre hay margen. Ofrece un alquiler de ${(result.estimated_min).toLocaleString("es-ES")}€ con una contra-propuesta razonada.`}
                  />
                  <ActionCard
                    icon="🔍"
                    title="Verifica el índice IRPL"
                    desc="Comprueba si el precio supera el índice legal con la dirección exacta del piso."
                    href={INCASOL_CHECKER_URL}
                  />
                </>
              )}
              {result.label === "ELEVADO" && (
                <>
                  <ActionCard
                    icon="⚖️"
                    title={incasol.isAboveLimit ? "Este alquiler podría ser ilegal" : "Precio por encima del mercado"}
                    desc={
                      incasol.isAboveLimit
                        ? `Según el índice IRPL, el máximo legal estimado es ${incasol.incasolMaxRent.toLocaleString("es-ES")}€/mes. Tienes derecho a reclamar la diferencia.`
                        : `Este piso está un ${Math.abs(result.difference_pct)}% por encima del precio de mercado. Negocia o busca alternativas.`
                    }
                    href={INCASOL_CHECKER_URL}
                  />
                  <ActionCard
                    icon="🏛️"
                    title="Asesoría gratuita del Sindicat de Llogateres"
                    desc="El Sindicat ofrece asesoría jurídica gratuita para inquilinos. Te ayudan a reclamar alquileres por encima del índice o a defender tus derechos."
                    href={SINDICAT_URL}
                  />
                  <ActionCard
                    icon="📝"
                    title="Reclamación formal a l'Agència de l'Habitatge"
                    desc="Si el propietario incumple el índice IRPL puedes presentar una reclamación formal. El proceso es gratuito."
                    href="https://habitatge.gencat.cat/ca/detalls/Tramit/Denuncia-per-incompliment-de-la-normativa-d-habitatge-H107Ge"
                  />
                </>
              )}
            </div>
          </div>

          {/* Negotiation */}
          {negotiationText && (
            <div className="card p-6 border-l-4 border-orange-400">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Texto sugerido de negociación
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {negotiationText}
              </p>
              <button
                onClick={handleCopyNegotiation}
                className="mt-4 btn-secondary text-sm py-2 px-4 print-hide"
              >
                {copiedNegotiation ? "¡Copiado!" : "Copiar texto"}
              </button>
            </div>
          )}

          {/* CTA */}
          <div className="card p-6 bg-brand-50 border-brand-100 print-hide">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Comparte este análisis
                </h3>
                <p className="text-sm text-gray-500">
                  Copia el enlace para compartir estos resultados.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? "¡Enlace copiado!" : "Copiar enlace"}
                </button>
                <Link href="/radar" className="btn-secondary text-sm">
                  Ver radar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

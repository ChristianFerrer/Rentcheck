"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { BARRIOS_BY_DISTRICT, DISTRICT_ORDER, BARCELONA_BARRIOS } from "@/lib/algorithm/zones";
import type { Condition } from "@/types";
import type { YearBand } from "@/lib/incasol";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

interface Props {
  sourceUrl?: string;       // set by bookmarklet flow — shown read-only
  prefillExample?: boolean;
  scrapedData?: ScrapedListing;
}

export default function AnalysisForm({ sourceUrl, prefillExample, scrapedData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  const supabase = createClient();

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-barrio-picker]")) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  function openPicker() {
    // Auto-expand the district of the currently selected barrio
    const current = BARCELONA_BARRIOS.find((b) => b.zone_name === form.zone_name);
    setExpandedDistrict(current?.district ?? DISTRICT_ORDER[0]);
    setPickerOpen(true);
  }

  function selectBarrio(zone_name: string) {
    setForm((prev) => ({ ...prev, zone_name }));
    setPickerOpen(false);
  }

  const [form, setForm] = useState({
    zone_name: BARCELONA_BARRIOS[0].zone_name,
    price_monthly: "",
    sqm: "",
    bedrooms: "2",
    bathrooms: "1",
    floor: "1",
    has_elevator: false,
    has_terrace: false,
    furnished: false,
    condition: "bueno" as Condition,
    bills_included: false,
    year_of_construction: "" as YearBand | "",
  });

  useEffect(() => {
    if (prefillExample) fillExample();
  }, [prefillExample]);

  useEffect(() => {
    if (!scrapedData) return;
    setForm((prev) => ({
      ...prev,
      ...(scrapedData.zone_name ? { zone_name: scrapedData.zone_name } : {}),
      ...(scrapedData.price_monthly != null ? { price_monthly: String(scrapedData.price_monthly) } : {}),
      ...(scrapedData.sqm != null ? { sqm: String(scrapedData.sqm) } : {}),
      ...(scrapedData.bedrooms != null ? { bedrooms: String(scrapedData.bedrooms) } : {}),
      ...(scrapedData.bathrooms != null ? { bathrooms: String(scrapedData.bathrooms) } : {}),
      ...(scrapedData.floor != null ? { floor: String(scrapedData.floor) } : {}),
      ...(scrapedData.has_elevator != null ? { has_elevator: scrapedData.has_elevator } : {}),
      ...(scrapedData.has_terrace != null ? { has_terrace: scrapedData.has_terrace } : {}),
      ...(scrapedData.furnished != null ? { furnished: scrapedData.furnished } : {}),
    }));
    // Auto-expand when scraper provides extra data
    if (scrapedData.bedrooms != null || scrapedData.floor != null) {
      setExpanded(true);
    }
  }, [scrapedData]);

  function fillExample() {
    setForm({
      zone_name: "Gràcia",
      price_monthly: "1400",
      sqm: "65",
      bedrooms: "3",
      bathrooms: "1",
      floor: "2",
      has_elevator: false,
      has_terrace: false,
      furnished: false,
      condition: "bueno",
      bills_included: false,
      year_of_construction: "",
    });
    setExpanded(true);
  }

  async function submitAnalysis(authToken?: string) {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_url: sourceUrl || undefined,
          city: "barcelona",
          zone_name: form.zone_name,
          price_monthly: Number(form.price_monthly),
          sqm: Number(form.sqm),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          floor: Number(form.floor),
          has_elevator: form.has_elevator,
          has_terrace: form.has_terrace,
          furnished: form.furnished,
          condition: form.condition,
          bills_included: form.bills_included,
          year_of_construction: form.year_of_construction || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al analizar el anuncio.");
        return;
      }

      if (data.id) {
        router.push(`/resultado/${data.id}`);
      } else {
        sessionStorage.setItem("rentcheck_result", JSON.stringify(data));
        router.push("/resultado");
      }
    } catch {
      setError("Error de conexión. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.price_monthly || !form.sqm) {
      setError("El precio y los metros cuadrados son obligatorios.");
      return;
    }
    // Attach token if logged in, but never block submission
    const { data: { session } } = await supabase.auth.getSession();
    await submitAnalysis(session?.access_token);
  }

  return (
    <div className="max-w-2xl mx-auto card p-8 text-left animate-slide-up">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Datos del anuncio
      </h2>

      {sourceUrl && (
        <div className="mb-6 p-3 rounded-lg bg-brand-50 border border-brand-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm text-brand-700 truncate">{sourceUrl}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Essential fields: barrio + price + sqm */}
        <div className="relative" data-barrio-picker>
          <label className="label-base">Barrio</label>
          {/* Trigger button */}
          <button
            type="button"
            onClick={openPicker}
            className="input-base w-full text-left flex items-center justify-between"
          >
            <span className={form.zone_name ? "text-gray-900" : "text-gray-400"}>
              {form.zone_name || "Selecciona un barrio"}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${pickerOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {pickerOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {DISTRICT_ORDER.filter((d) => BARRIOS_BY_DISTRICT[d]).map((district) => {
                const isOpen = expandedDistrict === district;
                const barrios = BARRIOS_BY_DISTRICT[district];
                const hasSelected = barrios.some((b) => b.zone_name === form.zone_name);
                return (
                  <div key={district}>
                    {/* District row */}
                    <button
                      type="button"
                      onClick={() => setExpandedDistrict(isOpen ? null : district)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${hasSelected ? "bg-brand-50" : ""}`}
                    >
                      <span className={`text-sm font-semibold ${hasSelected ? "text-brand-700" : "text-gray-700"}`}>
                        {district}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasSelected && (
                          <span className="text-xs text-brand-500 truncate max-w-[120px]">{form.zone_name}</span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Barrio rows */}
                    {isOpen && (
                      <div className="bg-gray-50 border-t border-b border-gray-100">
                        {barrios.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => selectBarrio(b.zone_name)}
                            className={`w-full text-left px-6 py-2 text-sm transition-colors hover:bg-brand-50 hover:text-brand-700 flex items-center justify-between ${
                              form.zone_name === b.zone_name
                                ? "text-brand-700 font-medium bg-brand-50"
                                : "text-gray-600"
                            }`}
                          >
                            <span>{b.zone_name}</span>
                            {form.zone_name === b.zone_name && (
                              <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">
              Precio mensual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="1200"
                value={form.price_monthly}
                onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                className="input-base pr-10"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">€</span>
            </div>
          </div>
          <div>
            <label className="label-base">
              Metros cuadrados <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="65"
                value={form.sqm}
                onChange={(e) => setForm({ ...form, sqm: e.target.value })}
                className="input-base pr-14"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">m²</span>
            </div>
          </div>
        </div>

        {/* Progressive expand: refine analysis */}
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Afinar análisis (habitaciones, estado, extras)
          </button>
        )}

        {/* Secondary fields: only shown when expanded */}
        {expanded && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-base">Habitaciones</label>
                <select
                  className="input-base"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Baños</label>
                <select
                  className="input-base"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Planta</label>
                <select
                  className="input-base"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n === 0 ? "Bajo" : `${n}ª`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-base">Estado del piso</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "reformado", label: "Reformado",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>,
                  },
                  {
                    value: "bueno", label: "Buen estado",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" /></svg>,
                  },
                  {
                    value: "a_reformar", label: "A reformar",
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg>,
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, condition: opt.value as Condition })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.condition === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className={`flex justify-center mb-1 ${form.condition === opt.value ? "text-brand-600" : "text-gray-400"}`}>
                      {opt.icon}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year of construction — improves IRPL accuracy */}
            <div>
              <label className="label-base">
                Año de construcción
                <span className="ml-1.5 text-xs font-normal text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">mejora precisión IRPL</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: "pre1960", label: "Antes de 1960" },
                  { value: "1960_1990", label: "1960–1990" },
                  { value: "1991_2007", label: "1991–2007" },
                  { value: "2008_plus", label: "2008 o más" },
                ] as { value: YearBand; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        year_of_construction: form.year_of_construction === opt.value ? "" : opt.value,
                      })
                    }
                    className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                      form.year_of_construction === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: "has_elevator", label: "Ascensor",
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>,
                },
                {
                  key: "has_terrace", label: "Terraza",
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>,
                },
                {
                  key: "furnished", label: "Amueblado",
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
                },
                {
                  key: "bills_included", label: "Gastos incluidos",
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`relative flex items-center gap-2 p-3 pr-8 rounded-xl border-2 cursor-pointer transition-all ${
                    form[item.key as keyof typeof form]
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={Boolean(form[item.key as keyof typeof form])}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                  />
                  <span className={`flex-shrink-0 ${form[item.key as keyof typeof form] ? "text-brand-600" : "text-gray-400"}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-medium leading-tight ${form[item.key as keyof typeof form] ? "text-brand-700" : "text-gray-600"}`}>
                    {item.label}
                  </span>
                  <div className={`absolute top-2 right-2 w-4 h-4 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${form[item.key as keyof typeof form] ? "border-brand-500 bg-brand-500" : "border-gray-300"}`}>
                    {form[item.key as keyof typeof form] && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-base py-4"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Analizando...
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
    </div>
  );
}

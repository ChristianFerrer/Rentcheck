"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BARRIOS_BY_DISTRICT, DISTRICT_ORDER, BARCELONA_BARRIOS } from "@/lib/algorithm/zones";
import type { Condition } from "@/types";
import type { ScrapedListing } from "@/lib/scraper/urlParser";

interface Props {
  sourceUrl?: string;
  prefillExample?: boolean;
  scrapedData?: ScrapedListing;
}

const EXAMPLE_DATA = {
  city: "barcelona",
  zone_name: "Eixample",
  price_monthly: 1800,
  sqm: 75,
  bedrooms: 3,
  bathrooms: 1,
  floor: 3,
  has_elevator: true,
  has_terrace: false,
  furnished: false,
  condition: "bueno" as Condition,
  bills_included: false,
};

export default function AnalysisForm({ sourceUrl, prefillExample, scrapedData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    city: "barcelona",
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
  });

  useEffect(() => {
    if (prefillExample) fillExample();
  }, [prefillExample]);

  useEffect(() => {
    if (!scrapedData) return;
    setForm((prev) => ({
      ...prev,
      ...(scrapedData.city ? { city: scrapedData.city } : {}),
      ...(scrapedData.zone_name ? { zone_name: scrapedData.zone_name } : {}),
      ...(scrapedData.price_monthly != null
        ? { price_monthly: String(scrapedData.price_monthly) }
        : {}),
      ...(scrapedData.sqm != null ? { sqm: String(scrapedData.sqm) } : {}),
      ...(scrapedData.bedrooms != null
        ? { bedrooms: String(scrapedData.bedrooms) }
        : {}),
      ...(scrapedData.bathrooms != null
        ? { bathrooms: String(scrapedData.bathrooms) }
        : {}),
      ...(scrapedData.floor != null ? { floor: String(scrapedData.floor) } : {}),
      ...(scrapedData.has_elevator != null
        ? { has_elevator: scrapedData.has_elevator }
        : {}),
      ...(scrapedData.has_terrace != null
        ? { has_terrace: scrapedData.has_terrace }
        : {}),
      ...(scrapedData.furnished != null
        ? { furnished: scrapedData.furnished }
        : {}),
    }));
  }, [scrapedData]);

  function fillExample() {
    setForm({
      city: EXAMPLE_DATA.city,
      zone_name: EXAMPLE_DATA.zone_name,
      price_monthly: String(EXAMPLE_DATA.price_monthly),
      sqm: String(EXAMPLE_DATA.sqm),
      bedrooms: String(EXAMPLE_DATA.bedrooms),
      bathrooms: String(EXAMPLE_DATA.bathrooms),
      floor: String(EXAMPLE_DATA.floor),
      has_elevator: EXAMPLE_DATA.has_elevator,
      has_terrace: EXAMPLE_DATA.has_terrace,
      furnished: EXAMPLE_DATA.furnished,
      condition: EXAMPLE_DATA.condition,
      bills_included: EXAMPLE_DATA.bills_included,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.price_monthly || !form.sqm) {
      setError("El precio y los metros cuadrados son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: sourceUrl || undefined,
          city: form.city,
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al analizar el anuncio.");
        return;
      }

      // If saved in DB, navigate by ID; otherwise pass via session storage
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

  return (
    <div className="max-w-2xl mx-auto card p-8 text-left animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Datos del anuncio
        </h2>
        <button
          onClick={fillExample}
          type="button"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Cargar ejemplo
        </button>
      </div>

      {sourceUrl && (
        <div className="mb-6 p-3 rounded-lg bg-brand-50 border border-brand-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm text-brand-700 truncate">{sourceUrl}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Ciudad</label>
            <select
              className="input-base"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            >
              <option value="barcelona">Barcelona</option>
            </select>
          </div>
          <div>
            <label className="label-base">Barrio</label>
            <select
              className="input-base"
              value={form.zone_name}
              onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
            >
              {DISTRICT_ORDER.filter((d) => BARRIOS_BY_DISTRICT[d]).map((district) => (
                <optgroup key={district} label={district}>
                  {BARRIOS_BY_DISTRICT[district].map((b) => (
                    <option key={b.id} value={b.zone_name}>
                      {b.zone_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Price & sqm */}
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
                onChange={(e) =>
                  setForm({ ...form, price_monthly: e.target.value })
                }
                className="input-base pr-10"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                €
              </span>
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
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                m²
              </span>
            </div>
          </div>
        </div>

        {/* Rooms row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label-base">Habitaciones</label>
            <select
              className="input-base"
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
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
                <option key={n} value={n}>
                  {n}
                </option>
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
                <option key={n} value={n}>
                  {n === 0 ? "Bajo" : `${n}ª`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="label-base">Estado del piso</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "reformado", label: "Reformado", icon: "✨" },
              { value: "bueno", label: "Buen estado", icon: "👍" },
              { value: "a_reformar", label: "A reformar", icon: "🔧" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setForm({ ...form, condition: opt.value as Condition })
                }
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.condition === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "has_elevator", label: "Ascensor", icon: "🛗" },
            { key: "has_terrace", label: "Terraza", icon: "🌿" },
            { key: "furnished", label: "Amueblado", icon: "🛋️" },
            { key: "bills_included", label: "Gastos incluidos", icon: "💡" },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form[item.key as keyof typeof form]
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={Boolean(form[item.key as keyof typeof form])}
                onChange={(e) =>
                  setForm({ ...form, [item.key]: e.target.checked })
                }
              />
              <span className="text-xl">{item.icon}</span>
              <span
                className={`text-sm font-medium ${
                  form[item.key as keyof typeof form]
                    ? "text-brand-700"
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </span>
              <div className="ml-auto">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                    form[item.key as keyof typeof form]
                      ? "border-brand-500 bg-brand-500"
                      : "border-gray-300"
                  }`}
                >
                  {form[item.key as keyof typeof form] && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

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

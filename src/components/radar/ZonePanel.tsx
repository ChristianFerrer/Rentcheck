import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PriceBadge from "@/components/ui/PriceBadge";
import { getBarrioByName } from "@/lib/algorithm/zones";
import type { ZoneStats, RadarDeal } from "@/types";

interface Props {
  selectedZone: string | null;
  deals: RadarDeal[];
  loading: boolean;
  zones: ZoneStats[];
  onZoneSelect: (zone: string) => void;
}

export default function ZonePanel({ selectedZone, deals, loading, zones, onZoneSelect }: Props) {
  if (!selectedZone) {
    return (
      <div className="card p-6 h-full flex flex-col items-center justify-center text-center text-gray-400 min-h-64">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
        </div>
        <p className="font-medium text-gray-600">Selecciona una zona en el mapa</p>
        <p className="text-sm mt-2 text-gray-400">
          Haz clic en cualquier círculo para ver precios y oportunidades.
        </p>
      </div>
    );
  }

  const zoneStats = zones.find((z) => z.zone_name === selectedZone);
  const barrioRef = getBarrioByName(selectedZone);

  return (
    <div className="card p-6 space-y-5">
      {/* Zone header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{selectedZone}</h3>
          {zoneStats && (
            <div className="mt-2">
              <PriceBadge label={zoneStats.label} />
            </div>
          )}
        </div>
        <button
          onClick={() => onZoneSelect("")}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Reference price from barrio data */}
      {barrioRef && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Precio ref. mercado</p>
            <p className="text-lg font-bold text-gray-900">{barrioRef.eur_m2_ref} €/m²</p>
            <p className="text-xs text-gray-400">Generalitat 2025</p>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Precio medio zona</p>
            <p className="text-lg font-bold text-brand-700">{barrioRef.avgMonthlyPrice.toLocaleString("es-ES")}€</p>
            <p className="text-xs text-gray-400">{barrioRef.avgSurface}m² típico</p>
          </div>
        </div>
      )}

      {/* Analysis stats — only when data exists */}
      {zoneStats && zoneStats.total_analyses > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{zoneStats.total_analyses}</p>
            <p className="text-gray-500 text-xs mt-0.5">análisis</p>
          </div>
          <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
            <p className={`text-2xl font-bold ${zoneStats.avg_difference_pct < 0 ? "text-green-600" : zoneStats.avg_difference_pct > 5 ? "text-red-600" : "text-yellow-600"}`}>
              {zoneStats.avg_difference_pct > 0 ? "+" : ""}{zoneStats.avg_difference_pct}%
            </p>
            <p className="text-gray-500 text-xs mt-0.5">vs mercado</p>
          </div>
        </div>
      )}

      {/* Top deals */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top oportunidades recientes</h4>
        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" label="Buscando oportunidades..." />
          </div>
        ) : deals.length > 0 ? (
          <div className="space-y-2">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/resultado/${deal.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700">
                    {deal.price_monthly.toLocaleString("es-ES")}€/mes
                  </p>
                  <p className="text-xs text-gray-500">{deal.sqm} m²</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600">
                    {deal.difference_pct.toFixed(1)}%
                  </span>
                  <p className="text-xs text-gray-400">bajo mercado</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Aún no hay análisis con buen precio en esta zona.</p>
            <p className="text-xs text-gray-400 mb-4">¡Sé el primero en analizar un piso aquí!</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/?zona=${encodeURIComponent(selectedZone)}#analizar`}
        className="btn-primary w-full text-sm text-center flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Analizar piso en {selectedZone}
      </Link>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ZonePanel from "./ZonePanel";
import type { ZoneStats, RadarDeal } from "@/types";
import { BARCELONA_ZONES } from "@/lib/algorithm/zones";

// Dynamic import for Leaflet (no SSR)
const RadarMap = dynamic(() => import("./RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl">
      <LoadingSpinner size="lg" label="Cargando mapa..." />
    </div>
  ),
});

export default function RadarPageClient() {
  const [zones, setZones] = useState<ZoneStats[]>([]);
  const [deals, setDeals] = useState<RadarDeal[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchDeals(selectedZone);
    }
  }, [selectedZone]);

  async function fetchZones() {
    try {
      const res = await fetch("/api/radar/zones");
      const data = await res.json();
      if (Array.isArray(data)) {
        setZones(data);
      }
    } catch {
      // Use static zones as fallback
      const fallback: ZoneStats[] = BARCELONA_ZONES.map((z) => ({
        zone_name: z.zone_name,
        center_lat: z.center_lat,
        center_lng: z.center_lng,
        total_analyses: 0,
        avg_difference_pct: 0,
        label: "MEDIO" as const,
      }));
      setZones(fallback);
    }
  }

  async function fetchDeals(zone: string) {
    setLoadingDeals(true);
    setDeals([]);
    try {
      const res = await fetch(
        `/api/radar/deals?zone=${encodeURIComponent(zone)}`
      );
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch {
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  }

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live · Barcelona
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Radar de oportunidades
        </h1>
        <p className="text-gray-500">
          Haz click en cualquier zona para ver los mejores precios disponibles.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        {[
          { color: "bg-green-500", label: "Buen precio" },
          { color: "bg-yellow-500", label: "Precio medio" },
          { color: "bg-red-500", label: "Precio elevado" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden" style={{ height: "540px" }}>
            {zones.length > 0 ? (
              <RadarMap
                zones={zones}
                selectedZone={selectedZone}
                onZoneClick={setSelectedZone}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <LoadingSpinner size="lg" label="Cargando zonas..." />
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:col-span-1">
          <ZonePanel
            selectedZone={selectedZone}
            deals={deals}
            loading={loadingDeals}
            zones={zones}
            onZoneSelect={setSelectedZone}
          />
        </div>
      </div>

      {/* Zone cards below map */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Todas las zonas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BARCELONA_ZONES.map((zone) => {
            const stats = zones.find((z) => z.zone_name === zone.zone_name);
            const label = stats?.label ?? "MEDIO";
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.zone_name)}
                className={`card p-4 text-left transition-all hover:shadow-md active:scale-95 ${
                  selectedZone === zone.zone_name
                    ? "ring-2 ring-brand-500"
                    : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-2 ${
                    label === "BAJO"
                      ? "bg-green-500"
                      : label === "ELEVADO"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
                <p className="text-sm font-medium text-gray-900">
                  {zone.zone_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {zone.eur_m2_ref}€/m² ref
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

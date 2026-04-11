"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ZonePanel from "./ZonePanel";
import type { ZoneStats, RadarDeal } from "@/types";
import { BARCELONA_ZONES } from "@/lib/algorithm/zones";

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
    if (selectedZone) fetchDeals(selectedZone);
  }, [selectedZone]);

  async function fetchZones() {
    try {
      const res = await fetch("/api/radar/zones");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setZones(data);
      } else {
        setZones(getFallbackZones());
      }
    } catch {
      setZones(getFallbackZones());
    }
  }

  function getFallbackZones(): ZoneStats[] {
    return BARCELONA_ZONES.map((z) => ({
      zone_name: z.zone_name,
      center_lat: z.center_lat,
      center_lng: z.center_lng,
      total_analyses: 0,
      avg_difference_pct: 0,
      label: "MEDIO" as const,
    }));
  }

  async function fetchDeals(zone: string) {
    setLoadingDeals(true);
    setDeals([]);
    try {
      const res = await fetch(`/api/radar/deals?zone=${encodeURIComponent(zone)}`);
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
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live · Barcelona
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Radar de oportunidades</h1>
        <p className="text-gray-500">
          Selecciona una zona en el mapa para ver los mejores precios disponibles y comparar con el mercado.
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
              <RadarMap zones={zones} selectedZone={selectedZone} onZoneClick={setSelectedZone} />
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
    </div>
  );
}

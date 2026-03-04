"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ZoneStats } from "@/types";

interface Props {
  zones: ZoneStats[];
  selectedZone: string | null;
  onZoneClick: (zone: string) => void;
}

const LABEL_COLORS: Record<string, string> = {
  BAJO: "#22c55e",
  MEDIO: "#eab308",
  ELEVADO: "#ef4444",
};

function MapController({ selectedZone, zones }: { selectedZone: string | null; zones: ZoneStats[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedZone) {
      const zone = zones.find((z) => z.zone_name === selectedZone);
      if (zone) {
        map.flyTo([zone.center_lat, zone.center_lng], 14, { duration: 1 });
      }
    }
  }, [selectedZone, zones, map]);

  return null;
}

export default function RadarMap({ zones, selectedZone, onZoneClick }: Props) {
  return (
    <MapContainer
      center={[41.3851, 2.1734]}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedZone={selectedZone} zones={zones} />

      {zones.map((zone) => {
        const color = LABEL_COLORS[zone.label] ?? "#eab308";
        const isSelected = selectedZone === zone.zone_name;

        return (
          <CircleMarker
            key={zone.zone_name}
            center={[zone.center_lat, zone.center_lng]}
            radius={isSelected ? 28 : 22}
            pathOptions={{
              color: isSelected ? "#1d4ed8" : color,
              fillColor: color,
              fillOpacity: 0.75,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onZoneClick(zone.zone_name),
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-gray-900">{zone.zone_name}</p>
                {zone.total_analyses > 0 ? (
                  <>
                    <p className="text-sm text-gray-600">
                      {zone.total_analyses} análisis
                    </p>
                    <p className="text-sm">
                      Diferencia media:{" "}
                      <strong>
                        {zone.avg_difference_pct > 0 ? "+" : ""}
                        {zone.avg_difference_pct}%
                      </strong>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sin análisis aún — haz click para explorar
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

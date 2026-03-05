/**
 * Zone data for Barcelona — districts and barrios.
 * Barrio prices from Ajuntament de Barcelona open data (2025-T1).
 * District zones kept for backward-compatibility with the radar map.
 */
import barrioData from "@/data/barcelona-barrios.json";

export interface BarrioZone {
  id: string;
  city: string;
  zone_name: string;
  district: string;
  center_lat: number;
  center_lng: number;
  eur_m2_ref: number;
  avgSurface: number;
  avgMonthlyPrice: number;
}

// ── Barrio zones (73 barrios) ──────────────────────────────────────────────
export const BARCELONA_BARRIOS: BarrioZone[] = barrioData.barrios.map((b) => ({
  id: `bcn-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  city: "barcelona",
  zone_name: b.name,
  district: b.district,
  center_lat: b.center_lat,
  center_lng: b.center_lng,
  eur_m2_ref: b.avgPricePerM2,
  avgSurface: b.avgSurface,
  avgMonthlyPrice: b.avgMonthlyPrice,
}));

// ── Barrios grouped by district (for <optgroup> selects) ───────────────────
export const BARRIOS_BY_DISTRICT: Record<string, BarrioZone[]> =
  BARCELONA_BARRIOS.reduce<Record<string, BarrioZone[]>>((acc, b) => {
    if (!acc[b.district]) acc[b.district] = [];
    acc[b.district].push(b);
    return acc;
  }, {});

// District order for display
export const DISTRICT_ORDER = [
  "Eixample",
  "Gràcia",
  "Sarrià-Sant Gervasi",
  "Sants-Montjuïc",
  "Les Corts",
  "Sant Martí",
  "Horta-Guinardó",
  "Sant Andreu",
  "Nou Barris",
  "Ciutat Vella",
];

// ── District zones (kept for radar map and backward-compat) ───────────────
export const BARCELONA_ZONES = [
  {
    id: "bcn-eixample",
    city: "barcelona",
    zone_name: "Eixample",
    center_lat: 41.3878,
    center_lng: 2.1654,
    eur_m2_ref: 26.2,
  },
  {
    id: "bcn-gracia",
    city: "barcelona",
    zone_name: "Gràcia",
    center_lat: 41.4025,
    center_lng: 2.1567,
    eur_m2_ref: 24.6,
  },
  {
    id: "bcn-sants",
    city: "barcelona",
    zone_name: "Sants",
    center_lat: 41.3752,
    center_lng: 2.1366,
    eur_m2_ref: 21.1,
  },
  {
    id: "bcn-sant-marti",
    city: "barcelona",
    zone_name: "Sant Martí",
    center_lat: 41.4151,
    center_lng: 2.2053,
    eur_m2_ref: 23.0,
  },
  {
    id: "bcn-ciutat-vella",
    city: "barcelona",
    zone_name: "Ciutat Vella",
    center_lat: 41.3825,
    center_lng: 2.177,
    eur_m2_ref: 25.3,
  },
  {
    id: "bcn-sarria",
    city: "barcelona",
    zone_name: "Sarrià",
    center_lat: 41.3993,
    center_lng: 2.1199,
    eur_m2_ref: 23.4,
  },
  {
    id: "bcn-les-corts",
    city: "barcelona",
    zone_name: "Les Corts",
    center_lat: 41.3842,
    center_lng: 2.1309,
    eur_m2_ref: 21.3,
  },
  {
    id: "bcn-horta",
    city: "barcelona",
    zone_name: "Horta",
    center_lat: 41.4278,
    center_lng: 2.1623,
    eur_m2_ref: 17.3,
  },
  {
    id: "bcn-nou-barris",
    city: "barcelona",
    zone_name: "Nou Barris",
    center_lat: 41.4398,
    center_lng: 2.1769,
    eur_m2_ref: 16.4,
  },
  {
    id: "bcn-sant-andreu",
    city: "barcelona",
    zone_name: "Sant Andreu",
    center_lat: 41.4337,
    center_lng: 2.1893,
    eur_m2_ref: 18.0,
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

/** Find a barrio by name (case-insensitive). */
export function getBarrioByName(name: string): BarrioZone | undefined {
  return BARCELONA_BARRIOS.find(
    (b) => b.zone_name.toLowerCase() === name.toLowerCase()
  );
}

/** Get the district name for a barrio (or the name itself if it's already a district). */
export function getDistrictForZone(zoneName: string): string {
  const barrio = getBarrioByName(zoneName);
  if (barrio) return barrio.district;
  // Already a district name
  return zoneName;
}

/** Returns the €/m² reference for a zone (barrio or district). */
export function getZoneEurM2(zoneName: string): number | undefined {
  const barrio = getBarrioByName(zoneName);
  if (barrio) return barrio.eur_m2_ref;
  const district = BARCELONA_ZONES.find(
    (z) => z.zone_name.toLowerCase() === zoneName.toLowerCase()
  );
  return district?.eur_m2_ref;
}

/** Returns the average surface for a zone (barrio or district). */
export function getZoneAvgSurface(zoneName: string): number {
  const barrio = getBarrioByName(zoneName);
  if (barrio) return barrio.avgSurface;
  // Fall back to barcelona-districts.json via district name
  return 60; // city avg fallback
}

export function getZoneByName(zoneName: string) {
  return BARCELONA_ZONES.find(
    (z) => z.zone_name.toLowerCase() === zoneName.toLowerCase()
  );
}

export function getDefaultZone() {
  return BARCELONA_ZONES[0];
}

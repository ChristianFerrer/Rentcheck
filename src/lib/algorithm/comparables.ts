import type { ComparableListing } from "@/types";
import { BARCELONA_BARRIOS, getBarrioByName } from "@/lib/algorithm/zones";
import districtData from "@/data/barcelona-districts.json";

interface DistrictEntry {
  name: string;
  avgPricePerM2: number;
  avgMonthlyPrice: number;
  avgSurface: number;
}

const DISTRICTS: DistrictEntry[] = districtData.districts as DistrictEntry[];

// Generate comparable listings using barrio-level prices where available,
// falling back to district data for zones entered as district names.
export function generateComparables(
  zoneName: string,
  sqm: number,
  eurM2Ref: number
): ComparableListing[] {
  const barrio = getBarrioByName(zoneName);
  const zoneM2 = barrio?.eur_m2_ref ?? eurM2Ref;

  const zoneDistrict = barrio?.district;

  // Pick 2 barrios with similar price levels (from the same or nearby districts)
  const otherBarrios = BARCELONA_BARRIOS.filter(
    (b) => b.zone_name.toLowerCase() !== zoneName.toLowerCase()
  )
    .sort(
      (a, b) =>
        Math.abs(a.eur_m2_ref - zoneM2) -
        Math.abs(b.eur_m2_ref - zoneM2)
    )
    .slice(0, 3);

  const comparables: ComparableListing[] = [];

  // Same-zone entries: analyzed sqm + barrio avg sqm
  const sameZoneSizes = Array.from(
    new Set([sqm, barrio?.avgSurface ?? sqm])
  ).slice(0, 2);

  sameZoneSizes.forEach((s) => {
    comparables.push({
      zone: zoneName,
      price: Math.round(s * zoneM2),
      sqm: s,
      eur_m2: zoneM2,
    });
  });

  // Nearby barrios — prefer same district if available
  const nearby = zoneDistrict
    ? [
        ...otherBarrios.filter((b) => b.district === zoneDistrict).slice(0, 1),
        ...otherBarrios.filter((b) => b.district !== zoneDistrict).slice(0, 1),
      ]
    : otherBarrios.slice(0, 2);

  nearby.forEach((b) => {
    comparables.push({
      zone: b.zone_name,
      price: b.avgMonthlyPrice,
      sqm: b.avgSurface,
      eur_m2: b.eur_m2_ref,
    });
  });

  // If zone is a district name (no barrio found), add a district-level fallback
  if (!barrio) {
    const districtEntry = DISTRICTS.find(
      (d) => d.name.toLowerCase() === zoneName.toLowerCase()
    );
    if (districtEntry && comparables.length < 4) {
      comparables.push({
        zone: districtEntry.name,
        price: districtEntry.avgMonthlyPrice,
        sqm: districtEntry.avgSurface,
        eur_m2: districtEntry.avgPricePerM2,
      });
    }
  }

  return comparables.sort((a, b) => a.eur_m2 - b.eur_m2);
}

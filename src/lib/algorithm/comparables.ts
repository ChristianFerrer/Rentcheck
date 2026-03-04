import type { ComparableListing } from "@/types";
import districtData from "@/data/barcelona-districts.json";

interface DistrictEntry {
  name: string;
  factor: number;
  avgPricePerM2: number;
  avgMonthlyPrice: number;
  avgSurface: number;
}

const DISTRICTS: DistrictEntry[] = districtData.districts as DistrictEntry[];

// Generate comparable listings using official district average prices
// from the Generalitat de Catalunya rental registry data.
export function generateComparables(
  zoneName: string,
  sqm: number,
  eurM2Ref: number
): ComparableListing[] {
  // Find the zone's district entry
  const zoneDistrict = DISTRICTS.find(
    (d) => d.name.toLowerCase() === zoneName.toLowerCase()
  );

  // Price per m² to use for this zone (official data or provided ref)
  const zoneM2 = zoneDistrict?.avgPricePerM2 ?? eurM2Ref;

  // Pick 2-3 districts with similar price levels to show as context
  const otherDistricts = DISTRICTS.filter(
    (d) => d.name.toLowerCase() !== zoneName.toLowerCase()
  )
    .sort((a, b) => Math.abs(a.avgPricePerM2 - zoneM2) - Math.abs(b.avgPricePerM2 - zoneM2))
    .slice(0, 3);

  const comparables: ComparableListing[] = [];

  // Same-zone entries: show the analyzed sqm and the district avg sqm
  const sameZoneSizes = Array.from(
    new Set([sqm, zoneDistrict?.avgSurface ?? sqm])
  ).slice(0, 2);

  sameZoneSizes.forEach((s) => {
    comparables.push({
      zone: zoneName,
      price: Math.round(s * zoneM2),
      sqm: s,
      eur_m2: zoneM2,
    });
  });

  // Nearby district entries: use each district's official avg surface and price
  otherDistricts.slice(0, 2).forEach((d) => {
    comparables.push({
      zone: d.name,
      price: d.avgMonthlyPrice,
      sqm: d.avgSurface,
      eur_m2: d.avgPricePerM2,
    });
  });

  return comparables.sort((a, b) => a.eur_m2 - b.eur_m2);
}

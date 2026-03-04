import type { ComparableListing } from "@/types";
import { BARCELONA_ZONES } from "./zones";

// Generate realistic comparable listings based on zone and listing characteristics
export function generateComparables(
  zoneName: string,
  sqm: number,
  eurM2Ref: number
): ComparableListing[] {
  const zone = BARCELONA_ZONES.find(
    (z) => z.zone_name.toLowerCase() === zoneName.toLowerCase()
  );

  const adjacentZones = zone
    ? BARCELONA_ZONES.filter(
        (z) => Math.abs(z.eur_m2_ref - eurM2Ref) < 3 && z.zone_name !== zoneName
      ).slice(0, 3)
    : BARCELONA_ZONES.slice(0, 3);

  const comparables: ComparableListing[] = [];

  // Add same-zone comparables
  const sqmVariants = [sqm - 10, sqm, sqm + 8, sqm + 15].filter(
    (s) => s > 20
  );

  sqmVariants.slice(0, 2).forEach((s) => {
    const eur_m2 =
      Math.round((eurM2Ref * (0.92 + Math.random() * 0.16)) * 10) / 10;
    comparables.push({
      zone: zoneName,
      price: Math.round(s * eur_m2),
      sqm: s,
      eur_m2,
    });
  });

  // Add adjacent zone comparables
  adjacentZones.slice(0, 2).forEach((az) => {
    const s = Math.round(sqm + (Math.random() - 0.5) * 20);
    const eur_m2 =
      Math.round((az.eur_m2_ref * (0.94 + Math.random() * 0.12)) * 10) / 10;
    comparables.push({
      zone: az.zone_name,
      price: Math.round(Math.max(20, s) * eur_m2),
      sqm: Math.max(20, s),
      eur_m2,
    });
  });

  return comparables.sort((a, b) => a.eur_m2 - b.eur_m2);
}

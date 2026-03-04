import { NextResponse } from "next/server";
import { BARCELONA_ZONES } from "@/lib/algorithm/zones";
import {
  fetchBarcelonaRentalStats,
  DISTRICT_FACTORS,
  DISTRICT_FACTOR_ALIASES,
} from "@/lib/generalitat/api";

/**
 * GET /api/zones
 *
 * Returns all Barcelona zones with reference prices calibrated against
 * the Generalitat de Catalunya Open Data API (Preu mitjà del lloguer
 * d'habitatges per municipi, dataset qww9-bvhh). Falls back to the
 * latest static market data (2025) if the API is unavailable.
 */
export async function GET() {
  const stats = await fetchBarcelonaRentalStats();

  const zones = BARCELONA_ZONES.map((zone) => {
    const normalizedName =
      DISTRICT_FACTOR_ALIASES[zone.zone_name] ?? zone.zone_name;
    const factor = DISTRICT_FACTORS[normalizedName] ?? 1.0;
    const livePricePerM2 =
      Math.round(stats.avgPricePerM2 * factor * 10) / 10;

    return {
      ...zone,
      // Use live calibrated price if we got a valid API response,
      // otherwise keep the static reference price.
      eur_m2_ref: stats.source === "api" ? livePricePerM2 : zone.eur_m2_ref,
      eur_m2_live: livePricePerM2,
      data_source: stats.source,
      data_year: stats.year,
    };
  });

  return NextResponse.json({
    zones,
    meta: {
      source: stats.source,
      year: stats.year,
      city_avg_eur_m2: stats.avgPricePerM2,
    },
  });
}

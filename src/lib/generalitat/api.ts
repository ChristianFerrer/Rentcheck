/**
 * Generalitat de Catalunya Open Data API client
 * Dataset: "Preu mitjà del lloguer d'habitatges per municipi"
 * Source: https://analisi.transparenciacatalunya.cat/Habitatge/Preu-mitj-del-lloguer-d-habitatges-per-municipi/qww9-bvhh
 */

import type { MarketContext } from "@/types";
import { getDistrictForZone } from "@/lib/algorithm/zones";

const SOCRATA_BASE =
  "https://analisi.transparenciacatalunya.cat/resource";

// Dataset ID for "Preu mitjà del lloguer d'habitatges per municipi"
const DATASET_PREU_LLOGUER = "qww9-bvhh";

// Barcelona municipality code (INE)
const BARCELONA_CODI = "080193";

interface GeneralitatMunicipiRecord {
  any?: string;
  trimestre?: string;
  codi_municipi?: string;
  municipi?: string;
  nombre_de_contractes?: string;
  preu_mensual_mitja?: string;
  preu_m2_mensual_mitja?: string;
  superficie_mitjana?: string;
  // alternative field names
  preu_mitja?: string;
  preu_m2?: string;
}

interface BarcelonaRentalStats {
  year: number;
  avgMonthlyPrice: number;
  avgPricePerM2: number;
  avgSurface: number;
  source: "api" | "fallback";
}

interface FullRentalData {
  latest: BarcelonaRentalStats;
  history: MarketContext["history"];
}

// Cache to avoid excessive API calls (in-memory, resets on server restart)
let cache: { data: FullRentalData; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function parseRecord(r: GeneralitatMunicipiRecord): MarketContext["history"][0] | null {
  const avgPricePerM2 = parseFloat(r.preu_m2_mensual_mitja ?? r.preu_m2 ?? "0");
  const avgMonthlyPrice = parseFloat(r.preu_mensual_mitja ?? r.preu_mitja ?? "0");
  const year = parseInt(r.any ?? "0");
  const quarter = r.trimestre ?? "";
  if (!avgPricePerM2 || avgPricePerM2 <= 0 || !year) return null;
  return { year, quarter, avgPricePerM2, avgMonthlyPrice };
}

async function fetchFullData(): Promise<FullRentalData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const url = new URL(`${SOCRATA_BASE}/${DATASET_PREU_LLOGUER}.json`);
    url.searchParams.set("$limit", "12");
    url.searchParams.set("$order", "any DESC, trimestre DESC");
    url.searchParams.set(
      "$where",
      `codi_municipi='${BARCELONA_CODI}' OR municipi='Barcelona'`
    );

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-App-Token": process.env.GENERALITAT_APP_TOKEN ?? "",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Generalitat API responded with ${response.status}`);
    }

    const records: GeneralitatMunicipiRecord[] = await response.json();

    if (!records || records.length === 0) {
      throw new Error("No records returned from Generalitat API");
    }

    const history = records
      .map(parseRecord)
      .filter((r): r is MarketContext["history"][0] => r !== null);

    if (history.length === 0) {
      throw new Error("Invalid price data from API");
    }

    const latest = records[0];
    const stats: BarcelonaRentalStats = {
      year: history[0].year,
      avgMonthlyPrice: history[0].avgMonthlyPrice,
      avgPricePerM2: history[0].avgPricePerM2,
      avgSurface: parseFloat(latest.superficie_mitjana ?? "0"),
      source: "api",
    };

    const data: FullRentalData = { latest: stats, history };
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.warn("[Generalitat API] Falling back to static data:", err);
    const fallback = getFallbackStats();
    return {
      latest: fallback,
      history: getFallbackHistory(),
    };
  }
}

/**
 * Fetch average rental price statistics for Barcelona municipality
 * from the Generalitat de Catalunya Open Data API.
 */
export async function fetchBarcelonaRentalStats(): Promise<BarcelonaRentalStats> {
  const data = await fetchFullData();
  return data.latest;
}

/**
 * 2025 market reference for Barcelona city average (Idealista / market data)
 * Used when the Generalitat API is unavailable.
 */
function getFallbackStats(): BarcelonaRentalStats {
  return {
    year: 2025,
    avgMonthlyPrice: 1285,
    avgPricePerM2: 23.8,
    avgSurface: 54,
    source: "fallback",
  };
}

function getFallbackHistory(): MarketContext["history"] {
  return [
    { year: 2025, quarter: "T1", avgPricePerM2: 23.8, avgMonthlyPrice: 1285 },
    { year: 2024, quarter: "T4", avgPricePerM2: 23.1, avgMonthlyPrice: 1248 },
    { year: 2024, quarter: "T3", avgPricePerM2: 22.7, avgMonthlyPrice: 1226 },
    { year: 2024, quarter: "T2", avgPricePerM2: 22.2, avgMonthlyPrice: 1198 },
    { year: 2024, quarter: "T1", avgPricePerM2: 21.8, avgMonthlyPrice: 1177 },
    { year: 2023, quarter: "T4", avgPricePerM2: 21.4, avgMonthlyPrice: 1155 },
  ];
}

/**
 * District-level proportionality factors relative to city average.
 * Derived from 2025 market data (Idealista, Fotocasa).
 * These let us calibrate district prices from the city-level API value.
 */
export const DISTRICT_FACTORS: Record<string, number> = {
  Eixample: 1.101,
  Gràcia: 1.033,
  "Ciutat Vella": 1.063,
  "Sarrià-Sant Gervasi": 0.983,
  "Sant Martí": 0.967,
  "Sants-Montjuïc": 0.887,
  "Les Corts": 0.895,
  "Sant Andreu": 0.756,
  "Horta-Guinardó": 0.727,
  "Nou Barris": 0.689,
};

// Shorter aliases used in the zone definitions
export const DISTRICT_FACTOR_ALIASES: Record<string, string> = {
  Sarrià: "Sarrià-Sant Gervasi",
  Sants: "Sants-Montjuïc",
  Horta: "Horta-Guinardó",
};

/**
 * Compute the estimated €/m² reference for a zone, calibrated against
 * the live city-average from the Generalitat API.
 */
export async function getZonePricePerM2(zoneName: string): Promise<number> {
  const stats = await fetchBarcelonaRentalStats();
  // Resolve barrio → district → factor
  const district = getDistrictForZone(zoneName);
  const normalizedName = DISTRICT_FACTOR_ALIASES[district] ?? district;
  const factor = DISTRICT_FACTORS[normalizedName] ?? 1.0;
  return Math.round(stats.avgPricePerM2 * factor * 10) / 10;
}

/**
 * Returns full market context for a zone:
 * city average, district factor, district estimate, and historical trend.
 */
export async function getMarketContext(zoneName: string): Promise<MarketContext> {
  const { latest, history } = await fetchFullData();
  const district = getDistrictForZone(zoneName);
  const normalizedName = DISTRICT_FACTOR_ALIASES[district] ?? district;
  const districtFactor = DISTRICT_FACTORS[normalizedName] ?? 1.0;
  const districtAvgPricePerM2 =
    Math.round(latest.avgPricePerM2 * districtFactor * 10) / 10;

  return {
    cityAvgPricePerM2: latest.avgPricePerM2,
    districtFactor,
    districtAvgPricePerM2,
    year: latest.year,
    source: latest.source,
    history,
  };
}

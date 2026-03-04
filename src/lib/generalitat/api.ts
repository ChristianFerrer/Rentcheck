/**
 * Generalitat de Catalunya Open Data API client
 * Dataset: "Preu mitjà del lloguer d'habitatges per municipi"
 * Source: https://analisi.transparenciacatalunya.cat/Habitatge/Preu-mitj-del-lloguer-d-habitatges-per-municipi/qww9-bvhh
 */

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

// Cache to avoid excessive API calls (in-memory, resets on server restart)
let cache: { data: BarcelonaRentalStats; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch average rental price statistics for Barcelona municipality
 * from the Generalitat de Catalunya Open Data API.
 */
export async function fetchBarcelonaRentalStats(): Promise<BarcelonaRentalStats> {
  // Return cached data if still valid
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const url = new URL(`${SOCRATA_BASE}/${DATASET_PREU_LLOGUER}.json`);
    url.searchParams.set("$limit", "10");
    url.searchParams.set("$order", "any DESC");
    // Filter to Barcelona only — try by code first, then name
    url.searchParams.set(
      "$where",
      `codi_municipi='${BARCELONA_CODI}' OR municipi='Barcelona'`
    );

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-App-Token": process.env.GENERALITAT_APP_TOKEN ?? "",
      },
      next: { revalidate: 86400 }, // Next.js cache: 24h
    });

    if (!response.ok) {
      throw new Error(`Generalitat API responded with ${response.status}`);
    }

    const records: GeneralitatMunicipiRecord[] = await response.json();

    if (!records || records.length === 0) {
      throw new Error("No records returned from Generalitat API");
    }

    // Take most recent record
    const latest = records[0];

    const avgPricePerM2 = parseFloat(
      latest.preu_m2_mensual_mitja ?? latest.preu_m2 ?? "0"
    );
    const avgMonthlyPrice = parseFloat(
      latest.preu_mensual_mitja ?? latest.preu_mitja ?? "0"
    );
    const avgSurface = parseFloat(latest.superficie_mitjana ?? "0");
    const year = parseInt(latest.any ?? String(new Date().getFullYear()));

    if (!avgPricePerM2 || avgPricePerM2 <= 0) {
      throw new Error("Invalid price data from API");
    }

    const stats: BarcelonaRentalStats = {
      year,
      avgMonthlyPrice,
      avgPricePerM2,
      avgSurface,
      source: "api",
    };

    cache = { data: stats, fetchedAt: Date.now() };
    return stats;
  } catch (err) {
    console.warn("[Generalitat API] Falling back to static data:", err);
    return getFallbackStats();
  }
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
  const normalizedName =
    DISTRICT_FACTOR_ALIASES[zoneName] ?? zoneName;
  const factor = DISTRICT_FACTORS[normalizedName] ?? 1.0;
  return Math.round(stats.avgPricePerM2 * factor * 10) / 10;
}

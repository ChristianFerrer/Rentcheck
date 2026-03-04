#!/usr/bin/env node
/**
 * Update script: fetch latest rental stats from Generalitat de Catalunya API
 * and recompute the district-level prices in src/data/barcelona-districts.json
 *
 * Run manually:    node scripts/update-district-data.mjs
 * Run in CI:       Used by .github/workflows/update-rental-data.yml (quarterly cron)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../src/data/barcelona-districts.json");

const SOCRATA_URL =
  "https://analisi.transparenciacatalunya.cat/resource/qww9-bvhh.json";
const BARCELONA_CODI = "080193";

async function fetchCityAverage() {
  const url = new URL(SOCRATA_URL);
  url.searchParams.set("$limit", "1");
  url.searchParams.set("$order", "any DESC");
  url.searchParams.set(
    "$where",
    `codi_municipi='${BARCELONA_CODI}' OR municipi='Barcelona'`
  );

  const headers = { Accept: "application/json" };
  if (process.env.GENERALITAT_APP_TOKEN) {
    headers["X-App-Token"] = process.env.GENERALITAT_APP_TOKEN;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API responded with ${res.status}`);

  const records = await res.json();
  if (!records || records.length === 0) throw new Error("No records returned");

  const r = records[0];
  const avgPricePerM2 = parseFloat(r.preu_m2_mensual_mitja ?? r.preu_m2 ?? "0");
  const avgMonthlyPrice = parseFloat(r.preu_mensual_mitja ?? r.preu_mitja ?? "0");
  const avgSurface = parseFloat(r.superficie_mitjana ?? "0");
  const year = parseInt(r.any ?? String(new Date().getFullYear()));
  const quarter = r.trimestre ?? "";

  if (!avgPricePerM2 || avgPricePerM2 <= 0) {
    throw new Error(`Invalid avgPricePerM2: ${avgPricePerM2}`);
  }

  return { avgPricePerM2, avgMonthlyPrice, avgSurface, year, quarter };
}

function computeDistrictPrice(cityAvgPricePerM2, factor, avgSurface) {
  const districtPricePerM2 = Math.round(cityAvgPricePerM2 * factor * 10) / 10;
  const districtMonthlyPrice = Math.round(districtPricePerM2 * avgSurface);
  return { districtPricePerM2, districtMonthlyPrice };
}

async function main() {
  console.log("Fetching latest rental stats from Generalitat API...");

  const current = JSON.parse(readFileSync(DATA_FILE, "utf8"));

  let cityStats;
  try {
    cityStats = await fetchCityAverage();
    console.log(
      `Got city average: ${cityStats.avgPricePerM2} €/m² (${cityStats.year} ${cityStats.quarter})`
    );
  } catch (err) {
    console.error("Failed to fetch from API:", err.message);
    console.log("Keeping existing data unchanged.");
    process.exit(0);
  }

  // Recompute district prices from the new city average
  const updatedDistricts = current.districts.map((d) => {
    const { districtPricePerM2, districtMonthlyPrice } = computeDistrictPrice(
      cityStats.avgPricePerM2,
      d.factor,
      d.avgSurface
    );
    return {
      ...d,
      avgPricePerM2: districtPricePerM2,
      avgMonthlyPrice: districtMonthlyPrice,
    };
  });

  const label = cityStats.quarter
    ? `${cityStats.year}-${cityStats.quarter}`
    : `${cityStats.year}`;

  const updated = {
    _meta: {
      ...current._meta,
      lastUpdated: label,
      cityAvgPricePerM2: cityStats.avgPricePerM2,
      cityAvgMonthlyPrice: Math.round(cityStats.avgMonthlyPrice),
      cityAvgSurface: cityStats.avgSurface || current._meta.cityAvgSurface,
      updatedAt: new Date().toISOString(),
    },
    districts: updatedDistricts,
  };

  writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2) + "\n");
  console.log(`Updated ${DATA_FILE}`);
  console.log(`  lastUpdated: ${label}`);
  console.log(`  cityAvgPricePerM2: ${cityStats.avgPricePerM2}`);
  updatedDistricts.forEach((d) => {
    console.log(`  ${d.name}: ${d.avgPricePerM2} €/m² (~${d.avgMonthlyPrice}€/mes)`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

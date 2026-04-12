import { NextRequest, NextResponse } from "next/server";
import { estimatePrice, buildAnalysisResult } from "@/lib/algorithm/estimator";
import { getZoneByName, getBarrioByName, BARCELONA_ZONES } from "@/lib/algorithm/zones";
import { generateComparables } from "@/lib/algorithm/comparables";
import { createAdminClient } from "@/lib/supabase/server";
import { getZonePricePerM2, getMarketContext, fetchBarcelonaRentalStats } from "@/lib/generalitat/api";
import type { ListingInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = [
      "city",
      "zone_name",
      "price_monthly",
      "sqm",
      "bedrooms",
      "bathrooms",
      "floor",
    ];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: `El campo ${field} es obligatorio` },
          { status: 400 }
        );
      }
    }

    const input: ListingInput = {
      source_url: body.source_url || undefined,
      city: body.city,
      zone_name: body.zone_name,
      price_monthly: Number(body.price_monthly),
      sqm: Number(body.sqm),
      bedrooms: Number(body.bedrooms),
      bathrooms: Number(body.bathrooms),
      floor: Number(body.floor),
      has_elevator: Boolean(body.has_elevator),
      has_terrace: Boolean(body.has_terrace),
      furnished: Boolean(body.furnished),
      condition: body.condition || "bueno",
      bills_included: Boolean(body.bills_included),
      year_of_construction: body.year_of_construction || undefined,
    };

    // Get zone reference price
    // Priority: barrio static price calibrated to live Generalitat avg
    //           → district-level Generalitat API
    //           → static fallback
    const barrio = getBarrioByName(input.zone_name);
    const zone = getZoneByName(input.zone_name);
    const staticRef = zone?.eur_m2_ref ?? BARCELONA_ZONES[0].eur_m2_ref;

    // Base city avg used when the barrio JSON was built (2025-T1)
    const BASE_CITY_AVG = 23.8;

    const [eur_m2_ref, marketContext] = await Promise.all([
      (async () => {
        if (barrio) {
          // Calibrate barrio price proportionally against live city average
          const stats = await fetchBarcelonaRentalStats().catch(() => null);
          const liveAvg = stats?.avgPricePerM2 ?? BASE_CITY_AVG;
          return Math.round((barrio.eur_m2_ref * (liveAvg / BASE_CITY_AVG)) * 10) / 10;
        }
        return getZonePricePerM2(input.zone_name).catch(() => staticRef);
      })(),
      getMarketContext(input.zone_name).catch(() => null),
    ]);

    // Run estimation algorithm
    const estimation = estimatePrice(input, eur_m2_ref);
    const result = buildAnalysisResult(input, estimation);
    const comparables = generateComparables(
      input.zone_name,
      input.sqm,
      eur_m2_ref
    );

    // Try to save to Supabase (optional — works without auth)
    let savedId: string | null = null;
    try {
      const supabase = createAdminClient();

      // Get user if authenticated
      const authHeader = request.headers.get("authorization");
      let userId: string | null = null;
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      }

      const record = { ...result, user_id: userId };

      // Upsert by (user_id, source_url) when both are present — prevents duplicate
      // entries for the same listing. Falls back to plain INSERT otherwise.
      let query;
      if (userId && result.source_url) {
        query = supabase
          .from("listings_analyses")
          .upsert(record, { onConflict: "user_id,source_url", ignoreDuplicates: false })
          .select("id")
          .single();
      } else {
        query = supabase
          .from("listings_analyses")
          .insert(record)
          .select("id")
          .single();
      }

      const { data, error } = await query;
      if (!error && data) {
        savedId = data.id;
      }
    } catch {
      // Supabase not configured — continue without saving
    }

    return NextResponse.json({
      id: savedId,
      ...result,
      comparables,
      marketContext,
    });
  } catch (error) {
    console.error("[POST /api/analyze]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

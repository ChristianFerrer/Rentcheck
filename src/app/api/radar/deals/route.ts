import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { RadarDeal } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get("zone");

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("listings_analyses")
      .select("id, zone_name, price_monthly, sqm, difference_pct, label")
      .eq("label", "BAJO")
      .order("difference_pct", { ascending: true })
      .limit(10);

    if (zone) {
      query = query.eq("zone_name", zone);
    }

    const { data, error } = await query;

    if (error) throw error;

    const deals: RadarDeal[] = (data || []).map((d) => ({
      id: d.id,
      zone_name: d.zone_name,
      price_monthly: d.price_monthly,
      sqm: d.sqm,
      difference_pct: d.difference_pct,
      label: d.label,
    }));

    return NextResponse.json(deals);
  } catch {
    // Return empty array if Supabase not configured
    return NextResponse.json([]);
  }
}

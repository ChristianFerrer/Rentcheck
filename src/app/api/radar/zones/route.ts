import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { BARCELONA_ZONES } from "@/lib/algorithm/zones";
import type { ZoneStats } from "@/types";

export async function GET() {
  try {
    // Try to get real stats from Supabase
    try {
      const supabase = createAdminClient();

      const { data: analyses } = await supabase
        .from("listings_analyses")
        .select("zone_name, difference_pct, label");

      if (analyses && analyses.length > 0) {
        // Aggregate by zone
        const zoneMap = new Map<
          string,
          { diffs: number[]; labels: string[] }
        >();

        analyses.forEach((a) => {
          if (!zoneMap.has(a.zone_name)) {
            zoneMap.set(a.zone_name, { diffs: [], labels: [] });
          }
          zoneMap.get(a.zone_name)!.diffs.push(a.difference_pct);
          zoneMap.get(a.zone_name)!.labels.push(a.label);
        });

        const stats: ZoneStats[] = BARCELONA_ZONES.map((zone) => {
          const zoneData = zoneMap.get(zone.zone_name);
          if (!zoneData || zoneData.diffs.length === 0) {
            return {
              zone_name: zone.zone_name,
              center_lat: zone.center_lat,
              center_lng: zone.center_lng,
              total_analyses: 0,
              avg_difference_pct: 0,
              label: "MEDIO" as const,
            };
          }

          const avg =
            zoneData.diffs.reduce((a, b) => a + b, 0) / zoneData.diffs.length;
          const labelCounts = zoneData.labels.reduce(
            (acc, l) => {
              acc[l] = (acc[l] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
          const dominantLabel = Object.entries(labelCounts).sort(
            ([, a], [, b]) => b - a
          )[0][0] as "BAJO" | "MEDIO" | "ELEVADO";

          return {
            zone_name: zone.zone_name,
            center_lat: zone.center_lat,
            center_lng: zone.center_lng,
            total_analyses: zoneData.diffs.length,
            avg_difference_pct: Math.round(avg * 10) / 10,
            label: dominantLabel,
          };
        });

        return NextResponse.json(stats);
      }
    } catch {
      // Supabase not available — fall through to static data
    }

    // Return static zone data with neutral labels
    const staticStats: ZoneStats[] = BARCELONA_ZONES.map((zone) => ({
      zone_name: zone.zone_name,
      center_lat: zone.center_lat,
      center_lng: zone.center_lng,
      total_analyses: 0,
      avg_difference_pct: 0,
      label: "MEDIO" as const,
    }));

    return NextResponse.json(staticStats);
  } catch (error) {
    console.error("[GET /api/radar/zones]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

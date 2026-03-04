import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateComparables } from "@/lib/algorithm/comparables";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("listings_analyses")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Análisis no encontrado" },
        { status: 404 }
      );
    }

    const comparables = generateComparables(
      data.zone_name,
      data.sqm,
      data.eur_m2_ref
    );

    return NextResponse.json({ ...data, comparables });
  } catch (error) {
    console.error("[GET /api/analysis/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

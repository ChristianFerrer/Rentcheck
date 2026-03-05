import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("listings_analyses")
    .select(
      "id, zone_name, price_monthly, estimated_price, estimated_min, estimated_max, difference_pct, label, created_at, sqm, bedrooms, bathrooms, condition, source_url"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Error al cargar el historial" },
      { status: 500 }
    );
  }

  return NextResponse.json({ analyses: data ?? [] });
}

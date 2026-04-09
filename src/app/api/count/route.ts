import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 300; // revalidate every 5 minutes

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("listings_analyses")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

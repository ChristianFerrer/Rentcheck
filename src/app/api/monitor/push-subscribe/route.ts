import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth, max_price, min_sqm, min_bedrooms } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get user if authenticated
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    await supabase.from("monitor_push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth_key: auth,
        max_price: max_price || null,
        min_sqm: min_sqm || null,
        min_bedrooms: min_bedrooms || null,
        active: true,
      },
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

    const supabase = createAdminClient();
    await supabase.from("monitor_push_subscriptions").update({ active: false }).eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

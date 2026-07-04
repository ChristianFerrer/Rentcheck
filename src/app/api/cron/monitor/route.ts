import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { scrapeAgency, type SelectorConfig } from "@/lib/monitor/scraper";
import { sendPush, type PushPayload } from "@/lib/monitor/push";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch agencies due for scraping
  const { data: agencies } = await supabase
    .from("monitor_agencies")
    .select("*")
    .eq("active", true)
    .or(`last_scraped_at.is.null,last_scraped_at.lt.${new Date(Date.now() - 30 * 60 * 1000).toISOString()}`);

  if (!agencies?.length) {
    return NextResponse.json({ scraped: 0, new: 0 });
  }

  let totalNew = 0;

  // Scrape each agency (up to 5 in parallel to stay within time limit)
  const chunks = [];
  for (let i = 0; i < agencies.length; i += 5) chunks.push(agencies.slice(i, i + 5));

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(async (agency) => {
        try {
          const items = await scrapeAgency(agency.listing_url, agency.selector_config as SelectorConfig);

          // Mark as scraped regardless
          await supabase
            .from("monitor_agencies")
            .update({ last_scraped_at: new Date().toISOString(), error_count: 0, last_error: null })
            .eq("id", agency.id);

          if (!items.length) return;

          // Insert new listings (unique by URL)
          const { data: inserted } = await supabase
            .from("monitor_listings")
            .upsert(
              items.map((item) => ({ ...item, agency_id: agency.id })),
              { onConflict: "url", ignoreDuplicates: true }
            )
            .select("id,url,title,price_monthly,sqm,bedrooms");

          const newListings = inserted ?? [];
          totalNew += newListings.length;

          if (!newListings.length) return;

          // Fetch push subscribers and alert them
          const { data: subs } = await supabase
            .from("monitor_push_subscriptions")
            .select("*")
            .eq("active", true);

          for (const listing of newListings) {
            const matchingSubs = (subs ?? []).filter((sub) => {
              if (sub.max_price && listing.price_monthly && listing.price_monthly > sub.max_price) return false;
              if (sub.min_sqm && listing.sqm && listing.sqm < sub.min_sqm) return false;
              if (sub.min_bedrooms && listing.bedrooms && listing.bedrooms < sub.min_bedrooms) return false;
              return true;
            });

            const payload: PushPayload = {
              title: `Nuevo piso · ${agency.name}`,
              body: [
                listing.title ?? "Piso en alquiler",
                listing.price_monthly ? `${listing.price_monthly.toLocaleString("es-ES")}€/mes` : null,
                listing.sqm ? `${listing.sqm}m²` : null,
                listing.bedrooms ? `${listing.bedrooms} hab.` : null,
              ]
                .filter(Boolean)
                .join(" · "),
              url: listing.url,
              icon: "/house.png",
            };

            await Promise.allSettled(
              matchingSubs.map((sub) =>
                sendPush(sub, payload).catch(async () => {
                  // Subscription expired — deactivate it
                  await supabase
                    .from("monitor_push_subscriptions")
                    .update({ active: false })
                    .eq("id", sub.id);
                })
              )
            );

            await supabase
              .from("monitor_listings")
              .update({ alerted_at: new Date().toISOString() })
              .eq("id", listing.id);
          }
        } catch (err) {
          await supabase
            .from("monitor_agencies")
            .update({
              last_scraped_at: new Date().toISOString(),
              error_count: (agency.error_count ?? 0) + 1,
              last_error: String(err).slice(0, 200),
            })
            .eq("id", agency.id);
        }
      })
    );
  }

  return NextResponse.json({ scraped: agencies.length, new: totalNew });
}

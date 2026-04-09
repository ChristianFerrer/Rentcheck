import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResultDashboard from "@/components/analysis/ResultDashboard";
import { generateComparables } from "@/lib/algorithm/comparables";
import { createAdminClient } from "@/lib/supabase/server";
import { getMarketContext } from "@/lib/generalitat/api";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("listings_analyses")
      .select("zone_name, price_monthly, sqm, label, difference_pct")
      .eq("id", params.id)
      .single();

    if (!data) return {};

    const labelText: Record<string, string> = {
      BAJO: "Buen precio",
      MEDIO: "Precio medio",
      ELEVADO: "Precio elevado",
    };
    const sign = data.difference_pct >= 0 ? "+" : "";
    const title = `${labelText[data.label] ?? data.label} · ${data.price_monthly.toLocaleString("es-ES")}€/mes en ${data.zone_name}`;
    const description = `Piso de ${data.sqm}m² en ${data.zone_name}. Precio anunciado: ${data.price_monthly.toLocaleString("es-ES")}€/mes (${sign}${data.difference_pct}% vs mercado). Analizado con RentCheck.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "RentCheck Barcelona",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default async function ResultByIdPage({ params }: Props) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("listings_analyses")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      notFound();
    }

    const [comparables, marketContext] = await Promise.all([
      Promise.resolve(generateComparables(data.zone_name, data.sqm, data.eur_m2_ref)),
      getMarketContext(data.zone_name).catch(() => null),
    ]);

    return <ResultDashboard result={data} comparables={comparables} marketContext={marketContext} />;
  } catch {
    notFound();
  }
}

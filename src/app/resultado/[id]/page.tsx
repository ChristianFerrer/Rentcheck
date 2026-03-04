import { notFound } from "next/navigation";
import ResultDashboard from "@/components/analysis/ResultDashboard";
import { generateComparables } from "@/lib/algorithm/comparables";
import { createAdminClient } from "@/lib/supabase/server";
import { getMarketContext } from "@/lib/generalitat/api";

interface Props {
  params: { id: string };
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

import { notFound } from "next/navigation";
import ResultDashboard from "@/components/analysis/ResultDashboard";
import { generateComparables } from "@/lib/algorithm/comparables";
import { createAdminClient } from "@/lib/supabase/server";

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

    const comparables = generateComparables(
      data.zone_name,
      data.sqm,
      data.eur_m2_ref
    );

    return <ResultDashboard result={data} comparables={comparables} />;
  } catch {
    notFound();
  }
}

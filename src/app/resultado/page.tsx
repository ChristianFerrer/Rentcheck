"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultDashboard from "@/components/analysis/ResultDashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { AnalysisResult, ComparableListing, MarketContext } from "@/types";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<
    (AnalysisResult & { comparables: ComparableListing[]; marketContext?: MarketContext | null }) | null
  >(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("rentcheck_result");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" label="Cargando análisis..." />
      </div>
    );
  }

  return <ResultDashboard result={result} comparables={result.comparables} marketContext={result.marketContext} />;
}

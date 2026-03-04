import type {
  ListingInput,
  PriceLabel,
  ExplanationFactor,
  AnalysisResult,
} from "@/types";

const RANGE_PCT = 0.07; // ±7%

export interface EstimationOutput {
  eur_m2_ref: number;
  estimated_price: number;
  estimated_min: number;
  estimated_max: number;
  difference_pct: number;
  label: PriceLabel;
  explanation: ExplanationFactor[];
}

export function estimatePrice(
  input: ListingInput,
  eur_m2_ref: number
): EstimationOutput {
  let base = eur_m2_ref * input.sqm;
  const factors: ExplanationFactor[] = [];

  // Elevator bonus
  if (input.has_elevator) {
    base *= 1.03;
    factors.push({
      factor: "Ascensor",
      impact: "+3%",
      description: "El edificio dispone de ascensor",
    });
  }

  // Terrace bonus
  if (input.has_terrace) {
    base *= 1.05;
    factors.push({
      factor: "Terraza",
      impact: "+5%",
      description: "El piso incluye terraza exterior",
    });
  }

  // Furnished bonus
  if (input.furnished) {
    base *= 1.02;
    factors.push({
      factor: "Amueblado",
      impact: "+2%",
      description: "El piso está amueblado",
    });
  }

  // Condition adjustments
  if (input.condition === "reformado") {
    base *= 1.06;
    factors.push({
      factor: "Estado reformado",
      impact: "+6%",
      description: "El piso ha sido recientemente reformado",
    });
  } else if (input.condition === "a_reformar") {
    base *= 0.92;
    factors.push({
      factor: "Necesita reforma",
      impact: "-8%",
      description: "El piso requiere obras o reforma",
    });
  } else {
    factors.push({
      factor: "Estado bueno",
      impact: "0%",
      description: "El piso está en buen estado de conservación",
    });
  }

  // High floor without elevator penalty
  if (input.floor >= 4 && !input.has_elevator) {
    base *= 0.97;
    factors.push({
      factor: "Planta alta sin ascensor",
      impact: "-3%",
      description: `Planta ${input.floor} sin ascensor reduce el valor`,
    });
  } else if (input.floor >= 4 && input.has_elevator) {
    factors.push({
      factor: "Planta alta con ascensor",
      impact: "0%",
      description: `Planta ${input.floor} con ascensor — sin penalización`,
    });
  }

  // Bills included: listing includes utilities (~100-150€/month), so fair market price is higher
  if (input.bills_included) {
    base *= 1.08;
    factors.push({
      factor: "Gastos incluidos",
      impact: "+8%",
      description:
        "El precio incluye gastos de comunidad y/o suministros — precio justo ajustado al alza",
    });
  }

  const estimated_price = Math.round(base);
  const estimated_min = Math.round(base * (1 - RANGE_PCT));
  const estimated_max = Math.round(base * (1 + RANGE_PCT));

  const difference_pct =
    ((input.price_monthly - estimated_price) / estimated_price) * 100;

  let label: PriceLabel;
  const ratio = input.price_monthly / estimated_price;
  if (ratio <= 0.92) {
    label = "BAJO";
  } else if (ratio <= 1.08) {
    label = "MEDIO";
  } else {
    label = "ELEVADO";
  }

  return {
    eur_m2_ref,
    estimated_price,
    estimated_min,
    estimated_max,
    difference_pct: Math.round(difference_pct * 10) / 10,
    label,
    explanation: factors,
  };
}

export function buildAnalysisResult(
  input: ListingInput,
  estimation: EstimationOutput
): Omit<AnalysisResult, "id" | "created_at" | "user_id"> {
  return {
    source_url: input.source_url,
    city: input.city,
    zone_name: input.zone_name,
    price_monthly: input.price_monthly,
    sqm: input.sqm,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floor: input.floor,
    has_elevator: input.has_elevator,
    has_terrace: input.has_terrace,
    furnished: input.furnished,
    condition: input.condition,
    bills_included: input.bills_included,
    eur_m2_ref: estimation.eur_m2_ref,
    estimated_price: estimation.estimated_price,
    estimated_min: estimation.estimated_min,
    estimated_max: estimation.estimated_max,
    difference_pct: estimation.difference_pct,
    label: estimation.label,
    explanation: estimation.explanation,
  };
}

export function generateNegotiationText(result: AnalysisResult): string {
  if (result.label !== "ELEVADO") return "";

  const suggestedMin = result.estimated_min;
  const suggestedMax = Math.round(
    result.estimated_price * 1.03
  );
  const overprice = Math.round(
    result.price_monthly - result.estimated_price
  );

  return `Basándonos en los precios actuales de la zona ${result.zone_name}, este piso está aproximadamente un ${Math.abs(result.difference_pct)}% por encima del mercado (unos ${overprice}€ de diferencia). Podrías proponer un alquiler de entre ${suggestedMin.toLocaleString("es-ES")}€ y ${suggestedMax.toLocaleString("es-ES")}€ mensuales. Una estrategia efectiva sería ofrecer el precio medio del mercado justificando con pisos similares en la zona.`;
}

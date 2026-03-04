export type PriceLabel = "BAJO" | "MEDIO" | "ELEVADO";

export type Condition = "reformado" | "bueno" | "a_reformar";

export interface Zone {
  id: string;
  city: string;
  zone_name: string;
  center_lat: number;
  center_lng: number;
  eur_m2_ref: number;
}

export interface ListingInput {
  source_url?: string;
  city: string;
  zone_name: string;
  price_monthly: number;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  has_elevator: boolean;
  has_terrace: boolean;
  furnished: boolean;
  condition: Condition;
  bills_included: boolean;
}

export interface ExplanationFactor {
  factor: string;
  impact: string;
  description: string;
}

export interface AnalysisResult {
  id?: string;
  created_at?: string;
  user_id?: string;
  source_url?: string;
  city: string;
  zone_name: string;
  price_monthly: number;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  has_elevator: boolean;
  has_terrace: boolean;
  furnished: boolean;
  condition: Condition;
  bills_included: boolean;
  eur_m2_ref: number;
  estimated_price: number;
  estimated_min: number;
  estimated_max: number;
  difference_pct: number;
  label: PriceLabel;
  explanation: ExplanationFactor[];
}

export interface ComparableListing {
  zone: string;
  price: number;
  sqm: number;
  eur_m2: number;
}

export interface ZoneStats {
  zone_name: string;
  center_lat: number;
  center_lng: number;
  total_analyses: number;
  avg_difference_pct: number;
  label: PriceLabel;
}

export interface RadarDeal {
  id: string;
  zone_name: string;
  price_monthly: number;
  sqm: number;
  difference_pct: number;
  label: PriceLabel;
}

export interface MarketContext {
  cityAvgPricePerM2: number;
  districtFactor: number;
  districtAvgPricePerM2: number;
  year: number;
  source: "api" | "fallback";
  history: Array<{
    year: number;
    quarter: string;
    avgPricePerM2: number;
    avgMonthlyPrice: number;
  }>;
}

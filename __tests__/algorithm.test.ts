import { estimatePrice } from "../src/lib/algorithm/estimator";
import type { ListingInput } from "../src/types";

const BASE_INPUT: ListingInput = {
  city: "barcelona",
  zone_name: "Eixample",
  price_monthly: 1500,
  sqm: 70,
  bedrooms: 2,
  bathrooms: 1,
  floor: 2,
  has_elevator: false,
  has_terrace: false,
  furnished: false,
  condition: "bueno",
  bills_included: false,
};

const EUR_M2_REF = 20.0; // simplified reference for tests

describe("estimatePrice", () => {
  describe("label classification", () => {
    it("returns BAJO when price is ≤92% of estimated", () => {
      // base = 20 * 70 = 1400. 92% = 1288. Price 1200 < 1288 → BAJO
      const result = estimatePrice({ ...BASE_INPUT, price_monthly: 1200 }, EUR_M2_REF);
      expect(result.label).toBe("BAJO");
      expect(result.difference_pct).toBeLessThan(0);
    });

    it("returns MEDIO when price is between 92% and 108% of estimated", () => {
      // base = 20 * 70 = 1400. MEDIO range: 1288 - 1512.
      const result = estimatePrice({ ...BASE_INPUT, price_monthly: 1400 }, EUR_M2_REF);
      expect(result.label).toBe("MEDIO");
    });

    it("returns ELEVADO when price is ≥108% of estimated", () => {
      // base = 1400. 108% = 1512. Price 1800 > 1512 → ELEVADO
      const result = estimatePrice({ ...BASE_INPUT, price_monthly: 1800 }, EUR_M2_REF);
      expect(result.label).toBe("ELEVADO");
      expect(result.difference_pct).toBeGreaterThan(0);
    });
  });

  describe("adjustments", () => {
    it("applies +3% for elevator", () => {
      const withElevator = estimatePrice(
        { ...BASE_INPUT, has_elevator: true },
        EUR_M2_REF
      );
      const without = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(withElevator.estimated_price).toBeGreaterThan(without.estimated_price);
      const factor = withElevator.explanation.find((f) => f.factor === "Ascensor");
      expect(factor?.impact).toBe("+3%");
    });

    it("applies +5% for terrace", () => {
      const withTerrace = estimatePrice(
        { ...BASE_INPUT, has_terrace: true },
        EUR_M2_REF
      );
      const without = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(withTerrace.estimated_price).toBeGreaterThan(without.estimated_price);
      const factor = withTerrace.explanation.find((f) => f.factor === "Terraza");
      expect(factor?.impact).toBe("+5%");
    });

    it("applies +2% for furnished", () => {
      const furnished = estimatePrice(
        { ...BASE_INPUT, furnished: true },
        EUR_M2_REF
      );
      const without = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(furnished.estimated_price).toBeGreaterThan(without.estimated_price);
      const factor = furnished.explanation.find((f) => f.factor === "Amueblado");
      expect(factor?.impact).toBe("+2%");
    });

    it("applies +6% for reformed condition", () => {
      const reformed = estimatePrice(
        { ...BASE_INPUT, condition: "reformado" },
        EUR_M2_REF
      );
      const good = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(reformed.estimated_price).toBeGreaterThan(good.estimated_price);
      const factor = reformed.explanation.find((f) => f.factor === "Estado reformado");
      expect(factor?.impact).toBe("+6%");
    });

    it("applies -8% for needs reform condition", () => {
      const toReform = estimatePrice(
        { ...BASE_INPUT, condition: "a_reformar" },
        EUR_M2_REF
      );
      const good = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(toReform.estimated_price).toBeLessThan(good.estimated_price);
      const factor = toReform.explanation.find((f) => f.factor === "Necesita reforma");
      expect(factor?.impact).toBe("-8%");
    });

    it("applies -3% penalty for floor ≥4 without elevator", () => {
      const highNoElevator = estimatePrice(
        { ...BASE_INPUT, floor: 4, has_elevator: false },
        EUR_M2_REF
      );
      const lowFloor = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(highNoElevator.estimated_price).toBeLessThan(lowFloor.estimated_price);
      const factor = highNoElevator.explanation.find(
        (f) => f.factor === "Planta alta sin ascensor"
      );
      expect(factor?.impact).toBe("-3%");
    });

    it("does NOT apply penalty for floor ≥4 WITH elevator", () => {
      const highWithElevator = estimatePrice(
        { ...BASE_INPUT, floor: 4, has_elevator: true },
        EUR_M2_REF
      );
      const factor = highWithElevator.explanation.find(
        (f) => f.factor === "Planta alta sin ascensor"
      );
      expect(factor).toBeUndefined();
    });
  });

  describe("output shape", () => {
    it("returns estimated_min < estimated_price < estimated_max", () => {
      const result = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(result.estimated_min).toBeLessThan(result.estimated_price);
      expect(result.estimated_max).toBeGreaterThan(result.estimated_price);
    });

    it("returns range of ±7%", () => {
      const result = estimatePrice(BASE_INPUT, EUR_M2_REF);
      const minRatio = result.estimated_min / result.estimated_price;
      const maxRatio = result.estimated_max / result.estimated_price;
      expect(minRatio).toBeCloseTo(0.93, 0);
      expect(maxRatio).toBeCloseTo(1.07, 0);
    });

    it("returns correct eur_m2_ref", () => {
      const result = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(result.eur_m2_ref).toBe(EUR_M2_REF);
    });

    it("returns explanation with at least 1 factor", () => {
      const result = estimatePrice(BASE_INPUT, EUR_M2_REF);
      expect(result.explanation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("combined adjustments", () => {
    it("stacks multiple bonuses correctly (elevator + terrace + furnished)", () => {
      const stacked = estimatePrice(
        {
          ...BASE_INPUT,
          has_elevator: true,
          has_terrace: true,
          furnished: true,
          condition: "reformado",
        },
        EUR_M2_REF
      );
      // base 1400 * 1.03 * 1.05 * 1.02 * 1.06 ≈ 1642
      expect(stacked.estimated_price).toBeGreaterThan(1600);
      expect(stacked.estimated_price).toBeLessThan(1700);
    });
  });
});

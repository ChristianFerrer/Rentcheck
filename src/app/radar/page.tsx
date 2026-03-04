import RadarPageClient from "@/components/radar/RadarPageClient";

export const metadata = {
  title: "Radar de oportunidades — RentCheck",
  description:
    "Descubre qué zonas de Barcelona tienen más pisos con buen precio en este momento.",
};

export default function RadarPage() {
  return <RadarPageClient />;
}

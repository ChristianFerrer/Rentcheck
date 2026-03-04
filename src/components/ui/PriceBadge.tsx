import type { PriceLabel } from "@/types";

interface Props {
  label: PriceLabel;
  size?: "sm" | "lg";
}

const config: Record<
  PriceLabel,
  { emoji: string; text: string; className: string }
> = {
  BAJO: {
    emoji: "🟢",
    text: "Buen precio",
    className: "badge-low",
  },
  MEDIO: {
    emoji: "🟡",
    text: "Precio medio",
    className: "badge-medium",
  },
  ELEVADO: {
    emoji: "🔴",
    text: "Precio elevado",
    className: "badge-high",
  },
};

export default function PriceBadge({ label, size = "sm" }: Props) {
  const { emoji, text, className } = config[label];
  return (
    <span
      className={`${className} ${size === "lg" ? "text-lg px-6 py-3" : "text-sm"}`}
    >
      <span>{emoji}</span>
      <span>{text}</span>
    </span>
  );
}

import type { PriceLabel } from "@/types";

interface Props {
  label: PriceLabel;
  size?: "sm" | "lg";
}

const config: Record<
  PriceLabel,
  { dotClass: string; text: string; className: string }
> = {
  BAJO: {
    dotClass: "bg-green-500",
    text: "Buen precio",
    className: "badge-low",
  },
  MEDIO: {
    dotClass: "bg-yellow-500",
    text: "Precio medio",
    className: "badge-medium",
  },
  ELEVADO: {
    dotClass: "bg-red-500",
    text: "Precio elevado",
    className: "badge-high",
  },
};

export default function PriceBadge({ label, size = "sm" }: Props) {
  const { dotClass, text, className } = config[label];
  return (
    <span
      className={`${className} ${size === "lg" ? "text-lg px-6 py-3" : "text-sm"}`}
    >
      <span className={`inline-block rounded-full flex-shrink-0 ${dotClass} ${size === "lg" ? "w-3 h-3" : "w-2 h-2"}`} />
      <span>{text}</span>
    </span>
  );
}

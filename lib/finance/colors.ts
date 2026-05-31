export interface AccountColorDef {
  key: string;
  label: string;
  /** Solid color for picker swatch + pastel calculations. */
  base: string;
  /** Rich gradient for the physical card visual. */
  cardBg: string;
  /** Border for the card visual. */
  cardBorder: string;
  /** Pastel light background for non-card pages (goals/renta fija). */
  pastelBg: string;
  pastelText: string;
  pastelMuted: string;
  pastelBorder: string;
}

export const ACCOUNT_COLORS = [
  {
    key: "black",
    label: "Negro",
    base: "#0a0a0a",
    cardBg:
      "radial-gradient(circle at 85% 0%, #2a2a2a 0%, transparent 55%), linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
    cardBorder: "#2a2a2a",
    pastelBg: "linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)",
    pastelText: "#171717",
    pastelMuted: "#525252",
    pastelBorder: "#d4d4d4",
  },
  {
    key: "graphite",
    label: "Grafito",
    base: "#3f3f46",
    cardBg:
      "radial-gradient(circle at 85% 0%, #71717a 0%, transparent 55%), linear-gradient(135deg, #3f3f46 0%, #18181b 100%)",
    cardBorder: "#52525b",
    pastelBg: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)",
    pastelText: "#27272a",
    pastelMuted: "#52525b",
    pastelBorder: "#d4d4d8",
  },
  {
    key: "navy",
    label: "Azul Marino",
    base: "#1e3a8a",
    cardBg:
      "radial-gradient(circle at 85% 0%, #3b82f6 0%, transparent 55%), linear-gradient(135deg, #1e3a8a 0%, #0c1e4d 100%)",
    cardBorder: "#1e40af",
    pastelBg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    pastelText: "#1e3a8a",
    pastelMuted: "#1d4ed8",
    pastelBorder: "#93c5fd",
  },
  {
    key: "blue",
    label: "Azul",
    base: "#2563eb",
    cardBg:
      "radial-gradient(circle at 85% 0%, #60a5fa 0%, transparent 55%), linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    cardBorder: "#3b82f6",
    pastelBg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    pastelText: "#1e3a8a",
    pastelMuted: "#1d4ed8",
    pastelBorder: "#93c5fd",
  },
  {
    key: "purple",
    label: "Morado",
    base: "#7c3aed",
    cardBg:
      "radial-gradient(circle at 85% 0%, #a855f7 0%, transparent 55%), linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    cardBorder: "#8b5cf6",
    pastelBg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
    pastelText: "#5b21b6",
    pastelMuted: "#7c3aed",
    pastelBorder: "#c4b5fd",
  },
  {
    key: "magenta",
    label: "Magenta",
    base: "#db2777",
    cardBg:
      "radial-gradient(circle at 85% 0%, #f472b6 0%, transparent 55%), linear-gradient(135deg, #db2777 0%, #831843 100%)",
    cardBorder: "#ec4899",
    pastelBg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    pastelText: "#9d174d",
    pastelMuted: "#be185d",
    pastelBorder: "#f9a8d4",
  },
  {
    key: "red",
    label: "Rojo",
    base: "#dc2626",
    cardBg:
      "radial-gradient(circle at 85% 0%, #f87171 0%, transparent 55%), linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)",
    cardBorder: "#ef4444",
    pastelBg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    pastelText: "#991b1b",
    pastelMuted: "#dc2626",
    pastelBorder: "#fca5a5",
  },
  {
    key: "orange",
    label: "Naranja",
    base: "#ea580c",
    cardBg:
      "radial-gradient(circle at 85% 0%, #fb923c 0%, transparent 55%), linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)",
    cardBorder: "#f97316",
    pastelBg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
    pastelText: "#9a3412",
    pastelMuted: "#ea580c",
    pastelBorder: "#fdba74",
  },
  {
    key: "gold",
    label: "Dorado",
    base: "#d4a017",
    cardBg:
      "radial-gradient(circle at 85% 0%, #fde047 0%, transparent 55%), linear-gradient(135deg, #d4a017 0%, #854d0e 100%)",
    cardBorder: "#eab308",
    pastelBg: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
    pastelText: "#713f12",
    pastelMuted: "#a16207",
    pastelBorder: "#fde047",
  },
  {
    key: "emerald",
    label: "Esmeralda",
    base: "#059669",
    cardBg:
      "radial-gradient(circle at 85% 0%, #34d399 0%, transparent 55%), linear-gradient(135deg, #059669 0%, #064e3b 100%)",
    cardBorder: "#10b981",
    pastelBg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    pastelText: "#065f46",
    pastelMuted: "#059669",
    pastelBorder: "#6ee7b7",
  },
  {
    key: "teal",
    label: "Verde Agua",
    base: "#0d9488",
    cardBg:
      "radial-gradient(circle at 85% 0%, #2dd4bf 0%, transparent 55%), linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
    cardBorder: "#14b8a6",
    pastelBg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
    pastelText: "#115e59",
    pastelMuted: "#0d9488",
    pastelBorder: "#5eead4",
  },
  {
    key: "silver",
    label: "Plata",
    base: "#a1a1aa",
    cardBg:
      "radial-gradient(circle at 85% 0%, #f4f4f5 0%, transparent 55%), linear-gradient(135deg, #d4d4d8 0%, #71717a 100%)",
    cardBorder: "#a1a1aa",
    pastelBg: "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)",
    pastelText: "#27272a",
    pastelMuted: "#52525b",
    pastelBorder: "#d4d4d8",
  },
] as const satisfies readonly AccountColorDef[];

export type AccountColor = (typeof ACCOUNT_COLORS)[number]["key"];

export function getColorDef(key?: AccountColor): AccountColorDef {
  return ACCOUNT_COLORS.find((c) => c.key === key) ?? ACCOUNT_COLORS[3]; // default blue
}

/** Pastel style for non-card visuals (renta fija, inversión, metas). */
export function colorStyle(key?: AccountColor) {
  const c = getColorDef(key);
  return {
    background: c.pastelBg,
    color: c.pastelText,
    muted: c.pastelMuted,
    border: c.pastelBorder,
  };
}

/** Rich gradient for the physical card visual. */
export function cardStyle(key?: AccountColor) {
  const c = getColorDef(key);
  // Silver / very-light cards need dark text. Others use white text.
  const lightCard = c.key === "silver";
  return {
    background: c.cardBg,
    border: c.cardBorder,
    textTone: lightCard ? ("dark" as const) : ("light" as const),
    brandColor: lightCard ? "#1a1a1a" : "#ffffff",
  };
}

import type { CardNetwork } from "@/lib/types";

export interface CardPreset {
  id: string;
  label: string;
  issuer: string;
  network: CardNetwork;
  institutionHint?: string;
  /** CSS background (gradients allowed). */
  gradient: string;
  border: string;
  /** "light" → white text; "dark" → near-black text. */
  textTone: "light" | "dark";
  /** Color for the brand logo SVG ("currentColor"). */
  brandColor: string;
  /** Optional issuer text shown top-left instead of institution. */
  brandText?: string;
}

export const CARD_PRESETS: CardPreset[] = [
  {
    id: "apple-card",
    label: "Apple Card",
    issuer: "Apple",
    network: "mastercard",
    institutionHint: "Apple",
    gradient:
      "linear-gradient(135deg, #f4f4f4 0%, #e1e1e3 35%, #c8c8cc 70%, #b8b8bd 100%)",
    border: "#bdbdc2",
    textTone: "dark",
    brandColor: "#1a1a1a",
    brandText: " Card",
  },
  {
    id: "chase-sapphire-reserve",
    label: "Sapphire Reserve",
    issuer: "Chase",
    network: "visa",
    institutionHint: "Chase",
    gradient:
      "radial-gradient(circle at 85% 0%, #2a5a9e 0%, transparent 55%), linear-gradient(135deg, #0a1f3d 0%, #061429 100%)",
    border: "#1f3a66",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "chase-sapphire-preferred",
    label: "Sapphire Preferred",
    issuer: "Chase",
    network: "visa",
    institutionHint: "Chase",
    gradient:
      "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 60%, #14276b 100%)",
    border: "#2952c4",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "amex-platinum",
    label: "Platinum",
    issuer: "American Express",
    network: "amex",
    institutionHint: "American Express",
    gradient:
      "linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 40%, #71717a 100%)",
    border: "#a1a1aa",
    textTone: "dark",
    brandColor: "#1f1f1f",
  },
  {
    id: "amex-gold",
    label: "Gold",
    issuer: "American Express",
    network: "amex",
    institutionHint: "American Express",
    gradient:
      "linear-gradient(135deg, #f9d976 0%, #d4a544 50%, #a47715 100%)",
    border: "#c79a3f",
    textTone: "dark",
    brandColor: "#2a1f00",
  },
  {
    id: "amex-blue",
    label: "Blue Cash",
    issuer: "American Express",
    network: "amex",
    institutionHint: "American Express",
    gradient:
      "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    border: "#1e3a8a",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "bancolombia-mastercard",
    label: "Mastercard",
    issuer: "Bancolombia",
    network: "mastercard",
    institutionHint: "Bancolombia",
    gradient:
      "linear-gradient(135deg, #fdd835 0%, #f9a825 100%)",
    border: "#f9a825",
    textTone: "dark",
    brandColor: "#1a1a1a",
  },
  {
    id: "bancolombia-debito",
    label: "Débito Bancolombia",
    issuer: "Bancolombia",
    network: "visa",
    institutionHint: "Bancolombia",
    gradient:
      "linear-gradient(135deg, #003a70 0%, #00204a 100%)",
    border: "#00509e",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "nu-nubank",
    label: "Nu",
    issuer: "Nubank",
    network: "mastercard",
    institutionHint: "Nubank",
    gradient:
      "linear-gradient(135deg, #8a05be 0%, #5a0085 100%)",
    border: "#8a05be",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "nequi-visa",
    label: "Nequi",
    issuer: "Nequi",
    network: "visa",
    institutionHint: "Nequi",
    gradient:
      "linear-gradient(135deg, #ff3d8b 0%, #b80459 100%)",
    border: "#d6266f",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "davivienda-mastercard",
    label: "Davivienda",
    issuer: "Davivienda",
    network: "mastercard",
    institutionHint: "Davivienda",
    gradient:
      "linear-gradient(135deg, #e3201c 0%, #a30f0c 100%)",
    border: "#e3201c",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "bbva-aqua",
    label: "BBVA Aqua",
    issuer: "BBVA",
    network: "visa",
    institutionHint: "BBVA",
    gradient:
      "linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)",
    border: "#0077b6",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "visa-infinite-black",
    label: "Visa Infinite",
    issuer: "Genérica",
    network: "visa",
    gradient:
      "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
    border: "#3a3a3a",
    textTone: "light",
    brandColor: "#fff",
  },
  {
    id: "mastercard-world-black",
    label: "World Black",
    issuer: "Genérica",
    network: "mastercard",
    gradient:
      "linear-gradient(135deg, #2d2d2d 0%, #0a0a0a 100%)",
    border: "#3a3a3a",
    textTone: "light",
    brandColor: "#fff",
  },
];

export function getCardPreset(id?: string): CardPreset | undefined {
  if (!id) return undefined;
  return CARD_PRESETS.find((p) => p.id === id);
}

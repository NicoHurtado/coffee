import {
  ShoppingBag,
  UtensilsCrossed,
  Plane,
  HeartPulse,
  FileText,
  Car,
  Home,
  GraduationCap,
  Tag,
  Cpu,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Comida: UtensilsCrossed,
  Facturas: FileText,
  Shopping: ShoppingBag,
  Tecnologia: Cpu,
  Transporte: Car,
  Salud: HeartPulse,
  Hogar: Home,
  Viajes: Plane,
  Educacion: GraduationCap,
  Trabajo: Briefcase,
  Otro: Tag,
};

// Neutral category shades: financial direction is conveyed separately in red/green.
export const CATEGORY_COLOR: Record<string, string> = {
  Salud: "var(--chart-1)", Hogar: "var(--chart-2)",
  Facturas: "var(--chart-3)", Transporte: "var(--chart-4)",
  Tecnologia: "var(--chart-5)", Comida: "var(--chart-1)",
  Educacion: "var(--chart-2)", Shopping: "var(--chart-3)",
  Viajes: "var(--chart-4)", Trabajo: "var(--chart-5)", Otro: "var(--chart-2)",
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICON[name] ?? Tag;
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLOR[name] ?? "var(--chart-3)";
}

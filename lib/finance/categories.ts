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

export const CATEGORY_COLOR: Record<string, string> = {
  Comida: "#f59e0b",
  Facturas: "#6366f1",
  Shopping: "#ec4899",
  Tecnologia: "#4FB7C2",
  Transporte: "#3b82f6",
  Salud: "#10b981",
  Hogar: "#14b8a6",
  Viajes: "#0ea5e9",
  Educacion: "#f97316",
  Trabajo: "#64748b",
  Otro: "#94a3b8",
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICON[name] ?? Tag;
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLOR[name] ?? "#94a3b8";
}

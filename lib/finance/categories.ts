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

// Professional, desaturated data-viz palette. Leans on the app's emerald accent
// and cools/neutrals around it — no neon pinks/indigos. Reads as "finance terminal".
export const CATEGORY_COLOR: Record<string, string> = {
  Salud: "#16c784", // emerald (primary accent)
  Hogar: "#3aa88a", // deep teal-green
  Facturas: "#4f9bb0", // muted steel blue
  Transporte: "#6f8fb3", // slate blue
  Tecnologia: "#5bb8a8", // muted teal
  Comida: "#c79a4b", // muted amber
  Educacion: "#b07f53", // clay
  Shopping: "#9a8fc0", // muted violet
  Viajes: "#7aa6c2", // muted sky
  Trabajo: "#8a929c", // slate gray
  Otro: "#5f656e", // neutral gray
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICON[name] ?? Tag;
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLOR[name] ?? "#94a3b8";
}

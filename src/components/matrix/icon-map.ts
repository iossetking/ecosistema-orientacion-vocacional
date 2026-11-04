import {
  Anchor,
  ArrowLeftRight,
  Briefcase,
  Compass,
  Database,
  Lightbulb,
  Network,
  Search,
  SlidersHorizontal,
  Target,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export const STAGE_ICONS: Record<string, LucideIcon> = {
  Compass,
  Search,
  Target,
  ArrowLeftRight,
  Anchor,
};

export const DIMENSION_ICONS: Record<string, LucideIcon> = {
  Users,
  SlidersHorizontal,
  Briefcase,
  Database,
  TriangleAlert,
  Network,
  Lightbulb,
};

export function getStageIcon(name: string): LucideIcon {
  return STAGE_ICONS[name] ?? Compass;
}

export function getDimensionIcon(name: string): LucideIcon {
  return DIMENSION_ICONS[name] ?? Users;
}

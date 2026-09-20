import type { LucideIcon as LucideGlyph } from "lucide-react";

export type LucideIconProps = {
  icon: LucideGlyph;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
};

/** Static lucide-react glyph. Hover animation belongs on AnimatedIcon, as in HLEducation. */
function LucideIcon({ icon: Icon, size = 18, strokeWidth = 1.75, className = "", color = "currentColor" }: LucideIconProps) {
  return <Icon size={size} strokeWidth={strokeWidth} className={className} color={color} aria-hidden />;
}

LucideIcon.displayName = "LucideIcon";

export default LucideIcon;
